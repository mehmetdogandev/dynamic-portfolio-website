import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, isNotNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { aboutPageProfile, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const profileSelect = {
  id: aboutPageProfile.id,
  lead: aboutPageProfile.lead,
  intro: aboutPageProfile.intro,
  introPart2: aboutPageProfile.introPart2,
  introPart3: aboutPageProfile.introPart3,
  introPart4: aboutPageProfile.introPart4,
  seoTitle: aboutPageProfile.seoTitle,
  seoDescription: aboutPageProfile.seoDescription,
  robotsIndex: aboutPageProfile.robotsIndex,
  sortOrder: aboutPageProfile.sortOrder,
  createdAt: aboutPageProfile.createdAt,
  updatedAt: aboutPageProfile.updatedAt,
} as const

const profileFormInput = z.object({
  lead: z.string().trim().min(1, 'Özet metin gerekli'),
  intro: z.string().trim().min(1, 'Giriş metni gerekli'),
  introPart2: z.string().optional().nullable(),
  introPart3: z.string().optional().nullable(),
  introPart4: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  robotsIndex: z.boolean().optional(),
})

const profileListOrder = [
  asc(aboutPageProfile.sortOrder),
  desc(aboutPageProfile.createdAt),
] as const

export const aboutPageProfileRouter = router({
  list: rbacProcedure(SCOPES.ABOUT_PROFILE, PERMISSIONS.READ)
    .input(createAdminListSchema(['lead', 'sortOrder', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(aboutPageProfile)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [
              aboutPageProfile.lead,
              aboutPageProfile.intro,
              aboutPageProfile.introPart2,
              aboutPageProfile.introPart3,
              aboutPageProfile.introPart4,
            ],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        lead: aboutPageProfile.lead,
        sortOrder: aboutPageProfile.sortOrder,
        createdAt: aboutPageProfile.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        lead: aboutPageProfile.lead,
        sortOrder: aboutPageProfile.sortOrder,
        createdAt: aboutPageProfile.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select(profileSelect)
          .from(aboutPageProfile)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(aboutPageProfile)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  listReorderScope: rbacProcedure(SCOPES.ABOUT_PROFILE, PERMISSIONS.READ).query(
    async ({ ctx }) =>
      ctx.db
        .select({ id: aboutPageProfile.id })
        .from(aboutPageProfile)
        .where(excludeDeleted(aboutPageProfile))
        .orderBy(...profileListOrder)
  ),

  getById: rbacProcedure(SCOPES.ABOUT_PROFILE, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(profileSelect)
        .from(aboutPageProfile)
        .where(
          and(
            eq(aboutPageProfile.id, input.id),
            excludeDeleted(aboutPageProfile)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hakkımda profili bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.ABOUT_PROFILE, PERMISSIONS.CREATE)
    .input(profileFormInput)
    .mutation(async ({ ctx, input }) => {
      const active = await ctx.db
        .select({ id: aboutPageProfile.id })
        .from(aboutPageProfile)
        .where(excludeDeleted(aboutPageProfile))
        .limit(1)
        .then((rows) => rows[0])

      if (active) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Aktif hakkımda profili zaten mevcut',
        })
      }

      const [inserted] = await ctx.db
        .insert(aboutPageProfile)
        .values({
          lead: input.lead.trim(),
          intro: input.intro.trim(),
          introPart2: input.introPart2?.trim() || null,
          introPart3: input.introPart3?.trim() || null,
          introPart4: input.introPart4?.trim() || null,
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          robotsIndex: input.robotsIndex ?? true,
          sortOrder: 0,
        })
        .returning({ id: aboutPageProfile.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Hakkımda profili oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.ABOUT_PROFILE, PERMISSIONS.UPDATE)
    .input(profileFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutPageProfile.id })
        .from(aboutPageProfile)
        .where(
          and(
            eq(aboutPageProfile.id, input.id),
            excludeDeleted(aboutPageProfile)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hakkımda profili bulunamadı',
        })
      }

      await ctx.db
        .update(aboutPageProfile)
        .set({
          lead: input.lead.trim(),
          intro: input.intro.trim(),
          introPart2: input.introPart2?.trim() || null,
          introPart3: input.introPart3?.trim() || null,
          introPart4: input.introPart4?.trim() || null,
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          robotsIndex: input.robotsIndex ?? true,
        })
        .where(eq(aboutPageProfile.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.ABOUT_PROFILE, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutPageProfile.id })
        .from(aboutPageProfile)
        .where(
          and(
            eq(aboutPageProfile.id, input.id),
            excludeDeleted(aboutPageProfile)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hakkımda profili bulunamadı',
        })
      }

      await ctx.db
        .update(aboutPageProfile)
        .set(ctx.audit.softDelete(aboutPageProfile))
        .where(eq(aboutPageProfile.id, input.id))

      return { ok: true as const }
    }),

  restore: rbacProcedure(SCOPES.ABOUT_PROFILE, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const active = await ctx.db
        .select({ id: aboutPageProfile.id })
        .from(aboutPageProfile)
        .where(excludeDeleted(aboutPageProfile))
        .limit(1)
        .then((rows) => rows[0])

      if (active && active.id !== input.id) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Başka bir aktif hakkımda profili zaten mevcut',
        })
      }

      const [restored] = await ctx.db
        .update(aboutPageProfile)
        .set({ deletedAt: null, deletedBy: null })
        .where(
          and(
            eq(aboutPageProfile.id, input.id),
            isNotNull(aboutPageProfile.deletedAt)
          )
        )
        .returning({ id: aboutPageProfile.id })

      if (!restored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Geri alınacak hakkımda profili bulunamadı',
        })
      }

      return { id: restored.id }
    }),

  reorder: rbacProcedure(SCOPES.ABOUT_PROFILE, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutPageProfile.id })
        .from(aboutPageProfile)
        .where(excludeDeleted(aboutPageProfile))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm profil kayıtlarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz profil id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(aboutPageProfile)
            .set({ sortOrder: index })
            .where(eq(aboutPageProfile.id, id))
        }
      })

      return { ok: true as const }
    }),
})
