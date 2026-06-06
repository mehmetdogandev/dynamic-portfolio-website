import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { footerSocialLink, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import {
  deactivateActiveSiblings,
  findActiveSibling,
  getSocialDisplayName,
  normalizeCustomLabel,
} from '@/lib/footer-social/helpers'
import {
  FOOTER_SOCIAL_KNOWN_PLATFORMS,
  FOOTER_SOCIAL_PLATFORMS,
} from '@/lib/website/social-platforms'
import { rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const platformZ = z.enum(FOOTER_SOCIAL_PLATFORMS)
const knownPlatformZ = z.enum(FOOTER_SOCIAL_KNOWN_PLATFORMS)
const socialInputBase = z.object({
  url: z.url('Geçerli bir URL girin'),
  isActive: z.boolean().default(false),
})

const knownSocialInput = socialInputBase.extend({
  platform: knownPlatformZ,
  type: z.literal('ICON'),
  customLabel: z.null().optional(),
  iconFileId: z.null().optional(),
})

const otherSocialInput = socialInputBase.extend({
  platform: z.literal('OTHER'),
  type: z.literal('IMAGE'),
  customLabel: z.string().trim().min(1, 'Platform adı gerekli'),
  iconFileId: uuidZ,
})

const socialInput = z.discriminatedUnion('platform', [
  knownSocialInput,
  otherSocialInput,
])

const socialUpdateInput = z.intersection(z.object({ id: uuidZ }), socialInput)

function mapSocialRow(row: {
  id: string
  platform: (typeof FOOTER_SOCIAL_PLATFORMS)[number]
  customLabel: string | null
  url: string
  type: 'ICON' | 'IMAGE'
  iconFileId: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...row,
    displayName: getSocialDisplayName(row.platform, row.customLabel),
    iconPreviewUrl: row.iconFileId ? `/api/files/${row.iconFileId}/view` : null,
  }
}

const socialSelect = {
  id: footerSocialLink.id,
  platform: footerSocialLink.platform,
  customLabel: footerSocialLink.customLabel,
  url: footerSocialLink.url,
  type: footerSocialLink.type,
  iconFileId: footerSocialLink.iconFileId,
  sortOrder: footerSocialLink.sortOrder,
  isActive: footerSocialLink.isActive,
  createdAt: footerSocialLink.createdAt,
  updatedAt: footerSocialLink.updatedAt,
}

export const footerSocialRouter = router({
  list: rbacProcedure(SCOPES.FOOTER_NAV, PERMISSIONS.READ).query(
    async ({ ctx }) => {
      const rows = await ctx.db
        .select(socialSelect)
        .from(footerSocialLink)
        .where(excludeDeleted(footerSocialLink))
        .orderBy(
          asc(footerSocialLink.sortOrder),
          asc(footerSocialLink.createdAt)
        )

      return rows.map(mapSocialRow)
    }
  ),

  getById: rbacProcedure(SCOPES.FOOTER_NAV, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(socialSelect)
        .from(footerSocialLink)
        .where(
          and(
            eq(footerSocialLink.id, input.id),
            excludeDeleted(footerSocialLink)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sosyal medya kaydı bulunamadı',
        })
      }

      return mapSocialRow(row)
    }),

  getActiveConflict: rbacProcedure(SCOPES.FOOTER_NAV, PERMISSIONS.READ)
    .input(
      z.object({
        platform: platformZ,
        customLabel: z.string().optional().nullable(),
        excludeId: uuidZ.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const customLabel = normalizeCustomLabel(
        input.platform,
        input.customLabel
      )
      if (input.platform === 'OTHER' && !customLabel) {
        return { hasConflict: false as const, displayName: null }
      }

      const sibling = await findActiveSibling(ctx.db, {
        platform: input.platform,
        customLabel,
        excludeId: input.excludeId,
      })

      if (!sibling) {
        return { hasConflict: false as const, displayName: null }
      }

      return {
        hasConflict: true as const,
        displayName: sibling.displayName,
      }
    }),

  create: rbacProcedure(SCOPES.FOOTER_NAV, PERMISSIONS.CREATE)
    .input(socialInput)
    .mutation(async ({ ctx, input }) => {
      const customLabel = normalizeCustomLabel(
        input.platform,
        input.platform === 'OTHER' ? input.customLabel : null
      )

      const maxSort = await ctx.db
        .select({ sortOrder: footerSocialLink.sortOrder })
        .from(footerSocialLink)
        .where(excludeDeleted(footerSocialLink))
        .orderBy(desc(footerSocialLink.sortOrder))
        .limit(1)
        .then((rows) => rows[0]?.sortOrder ?? -1)

      const [inserted] = await ctx.db.transaction(async (tx) => {
        if (input.isActive) {
          await deactivateActiveSiblings(tx, {
            platform: input.platform,
            customLabel,
          })
        }

        return tx
          .insert(footerSocialLink)
          .values({
            platform: input.platform,
            customLabel,
            url: input.url.trim(),
            type: input.type,
            iconFileId: input.platform === 'OTHER' ? input.iconFileId : null,
            sortOrder: maxSort + 1,
            isActive: input.isActive,
          })
          .returning({ id: footerSocialLink.id })
      })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Sosyal medya kaydı oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.FOOTER_NAV, PERMISSIONS.UPDATE)
    .input(socialUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: footerSocialLink.id })
        .from(footerSocialLink)
        .where(
          and(
            eq(footerSocialLink.id, input.id),
            excludeDeleted(footerSocialLink)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sosyal medya kaydı bulunamadı',
        })
      }

      const customLabel = normalizeCustomLabel(
        input.platform,
        input.platform === 'OTHER' ? input.customLabel : null
      )

      await ctx.db.transaction(async (tx) => {
        if (input.isActive) {
          await deactivateActiveSiblings(tx, {
            platform: input.platform,
            customLabel,
            excludeId: input.id,
          })
        }

        await tx
          .update(footerSocialLink)
          .set({
            platform: input.platform,
            customLabel,
            url: input.url.trim(),
            type: input.type,
            iconFileId: input.platform === 'OTHER' ? input.iconFileId : null,
            isActive: input.isActive,
          })
          .where(eq(footerSocialLink.id, input.id))
      })

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.FOOTER_NAV, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: footerSocialLink.id })
        .from(footerSocialLink)
        .where(
          and(
            eq(footerSocialLink.id, input.id),
            excludeDeleted(footerSocialLink)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sosyal medya kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(footerSocialLink)
        .set(ctx.audit.softDelete(footerSocialLink))
        .where(eq(footerSocialLink.id, input.id))

      return { ok: true as const }
    }),

  toggleActive: rbacProcedure(SCOPES.FOOTER_NAV, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ, isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({
          id: footerSocialLink.id,
          platform: footerSocialLink.platform,
          customLabel: footerSocialLink.customLabel,
        })
        .from(footerSocialLink)
        .where(
          and(
            eq(footerSocialLink.id, input.id),
            excludeDeleted(footerSocialLink)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sosyal medya kaydı bulunamadı',
        })
      }

      const customLabel = normalizeCustomLabel(
        existing.platform,
        existing.customLabel
      )

      await ctx.db.transaction(async (tx) => {
        if (input.isActive) {
          await deactivateActiveSiblings(tx, {
            platform: existing.platform,
            customLabel,
            excludeId: input.id,
          })
        }

        await tx
          .update(footerSocialLink)
          .set({ isActive: input.isActive })
          .where(eq(footerSocialLink.id, input.id))
      })

      return { ok: true as const }
    }),

  reorder: rbacProcedure(SCOPES.FOOTER_NAV, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: footerSocialLink.id })
        .from(footerSocialLink)
        .where(excludeDeleted(footerSocialLink))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm kayıtları içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [idx, id] of input.orderedIds.entries()) {
          await tx
            .update(footerSocialLink)
            .set({ sortOrder: idx })
            .where(
              and(
                eq(footerSocialLink.id, id),
                inArray(footerSocialLink.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
