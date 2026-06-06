import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { PERMISSIONS, siteNavLink, type ScopeLiteral } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'
import { rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const navLinkInput = z.object({
  label: z.string().trim().min(1, 'Etiket gerekli'),
  href: z.string().trim().min(1, 'Link gerekli'),
  openInNewTab: z.boolean().optional().default(false),
})

type NavPlacement = 'HEADER' | 'FOOTER'

export function createSiteNavRouter(
  scope: ScopeLiteral,
  placement: NavPlacement
) {
  const placementFilter = eq(siteNavLink.placement, placement)

  return router({
    list: rbacProcedure(scope, PERMISSIONS.READ).query(async ({ ctx }) => {
      return ctx.db
        .select({
          id: siteNavLink.id,
          label: siteNavLink.label,
          href: siteNavLink.href,
          sortOrder: siteNavLink.sortOrder,
          isActive: siteNavLink.isActive,
          openInNewTab: siteNavLink.openInNewTab,
          createdAt: siteNavLink.createdAt,
          updatedAt: siteNavLink.updatedAt,
        })
        .from(siteNavLink)
        .where(and(placementFilter, excludeDeleted(siteNavLink)))
        .orderBy(asc(siteNavLink.sortOrder), asc(siteNavLink.createdAt))
    }),

    getById: rbacProcedure(scope, PERMISSIONS.READ)
      .input(z.object({ id: uuidZ }))
      .query(async ({ ctx, input }) => {
        const row = await ctx.db
          .select({
            id: siteNavLink.id,
            label: siteNavLink.label,
            href: siteNavLink.href,
            sortOrder: siteNavLink.sortOrder,
            isActive: siteNavLink.isActive,
            openInNewTab: siteNavLink.openInNewTab,
            createdAt: siteNavLink.createdAt,
            updatedAt: siteNavLink.updatedAt,
          })
          .from(siteNavLink)
          .where(
            and(
              eq(siteNavLink.id, input.id),
              placementFilter,
              excludeDeleted(siteNavLink)
            )
          )
          .limit(1)
          .then((rows) => rows[0])

        if (!row) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Menü öğesi bulunamadı',
          })
        }

        return row
      }),

    create: rbacProcedure(scope, PERMISSIONS.CREATE)
      .input(navLinkInput)
      .mutation(async ({ ctx, input }) => {
        const maxSort = await ctx.db
          .select({ sortOrder: siteNavLink.sortOrder })
          .from(siteNavLink)
          .where(and(placementFilter, excludeDeleted(siteNavLink)))
          .orderBy(desc(siteNavLink.sortOrder))
          .limit(1)
          .then((rows) => rows[0]?.sortOrder ?? -1)

        const [inserted] = await ctx.db
          .insert(siteNavLink)
          .values({
            placement,
            label: input.label.trim(),
            href: input.href.trim(),
            openInNewTab: input.openInNewTab ?? false,
            sortOrder: maxSort + 1,
          })
          .returning({ id: siteNavLink.id })

        if (!inserted) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Menü öğesi oluşturulamadı',
          })
        }

        return { id: inserted.id }
      }),

    update: rbacProcedure(scope, PERMISSIONS.UPDATE)
      .input(
        navLinkInput.extend({
          id: uuidZ,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db
          .select({ id: siteNavLink.id })
          .from(siteNavLink)
          .where(
            and(
              eq(siteNavLink.id, input.id),
              placementFilter,
              excludeDeleted(siteNavLink)
            )
          )
          .limit(1)
          .then((rows) => rows[0])

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Menü öğesi bulunamadı',
          })
        }

        await ctx.db
          .update(siteNavLink)
          .set({
            label: input.label.trim(),
            href: input.href.trim(),
            openInNewTab: input.openInNewTab ?? false,
          })
          .where(eq(siteNavLink.id, input.id))

        return { id: input.id }
      }),

    delete: rbacProcedure(scope, PERMISSIONS.DELETE)
      .input(z.object({ id: uuidZ }))
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db
          .select({ id: siteNavLink.id })
          .from(siteNavLink)
          .where(
            and(
              eq(siteNavLink.id, input.id),
              placementFilter,
              excludeDeleted(siteNavLink)
            )
          )
          .limit(1)
          .then((rows) => rows[0])

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Menü öğesi bulunamadı',
          })
        }

        await ctx.db
          .update(siteNavLink)
          .set(ctx.audit.softDelete(siteNavLink))
          .where(eq(siteNavLink.id, input.id))

        return { ok: true as const }
      }),

    toggleActive: rbacProcedure(scope, PERMISSIONS.UPDATE)
      .input(z.object({ id: uuidZ, isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db
          .select({ id: siteNavLink.id })
          .from(siteNavLink)
          .where(
            and(
              eq(siteNavLink.id, input.id),
              placementFilter,
              excludeDeleted(siteNavLink)
            )
          )
          .limit(1)
          .then((rows) => rows[0])

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Menü öğesi bulunamadı',
          })
        }

        await ctx.db
          .update(siteNavLink)
          .set({ isActive: input.isActive })
          .where(eq(siteNavLink.id, input.id))

        return { ok: true as const }
      }),

    reorder: rbacProcedure(scope, PERMISSIONS.UPDATE)
      .input(
        z.object({
          orderedIds: z.array(uuidZ).min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db
          .select({ id: siteNavLink.id })
          .from(siteNavLink)
          .where(and(placementFilter, excludeDeleted(siteNavLink)))

        if (existing.length !== input.orderedIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Sıralama listesi tüm menü öğelerini içermelidir',
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
              .update(siteNavLink)
              .set({ sortOrder: idx })
              .where(
                and(
                  eq(siteNavLink.id, id),
                  placementFilter,
                  inArray(siteNavLink.id, input.orderedIds)
                )
              )
          }
        })

        return { ok: true as const }
      }),
  })
}
