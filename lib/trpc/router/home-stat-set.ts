import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, isNotNull, ne } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import {
  homeStatSet,
  PERMISSIONS,
  SCOPES,
  sliderGroupStatusEnum,
} from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const statSetSelect = {
  id: homeStatSet.id,
  name: homeStatSet.name,
  status: homeStatSet.status,
  stat1Value: homeStatSet.stat1Value,
  stat1Label: homeStatSet.stat1Label,
  stat2Value: homeStatSet.stat2Value,
  stat2Label: homeStatSet.stat2Label,
  stat3Value: homeStatSet.stat3Value,
  stat3Label: homeStatSet.stat3Label,
  stat4Value: homeStatSet.stat4Value,
  stat4Label: homeStatSet.stat4Label,
  publishedAt: homeStatSet.publishedAt,
  createdAt: homeStatSet.createdAt,
  updatedAt: homeStatSet.updatedAt,
} as const

const statSetFormInput = z.object({
  name: z.string().trim().min(1, 'Set adı gerekli'),
  stat1Value: z.string().trim().min(1, '1. kutu değeri gerekli'),
  stat1Label: z.string().trim().min(1, '1. kutu etiketi gerekli'),
  stat2Value: z.string().trim().min(1, '2. kutu değeri gerekli'),
  stat2Label: z.string().trim().min(1, '2. kutu etiketi gerekli'),
  stat3Value: z.string().trim().min(1, '3. kutu değeri gerekli'),
  stat3Label: z.string().trim().min(1, '3. kutu etiketi gerekli'),
  stat4Value: z.string().trim().min(1, '4. kutu değeri gerekli'),
  stat4Label: z.string().trim().min(1, '4. kutu etiketi gerekli'),
})

export const homeStatSetRouter = router({
  list: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'status', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(homeStatSet)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [
              homeStatSet.name,
              homeStatSet.stat1Label,
              homeStatSet.stat2Label,
              homeStatSet.stat3Label,
              homeStatSet.stat4Label,
            ],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: homeStatSet.name,
        status: homeStatSet.status,
        createdAt: homeStatSet.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: homeStatSet.name,
        status: homeStatSet.status,
        createdAt: homeStatSet.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select(statSetSelect)
          .from(homeStatSet)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(homeStatSet)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(statSetSelect)
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.CREATE)
    .input(statSetFormInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(homeStatSet)
        .values({
          name: input.name.trim(),
          status: 'DRAFT',
          stat1Value: input.stat1Value.trim(),
          stat1Label: input.stat1Label.trim(),
          stat2Value: input.stat2Value.trim(),
          stat2Label: input.stat2Label.trim(),
          stat3Value: input.stat3Value.trim(),
          stat3Label: input.stat3Label.trim(),
          stat4Value: input.stat4Value.trim(),
          stat4Label: input.stat4Label.trim(),
        })
        .returning({ id: homeStatSet.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'İstatistik seti oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.UPDATE)
    .input(statSetFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeStatSet.id })
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      await ctx.db
        .update(homeStatSet)
        .set({
          name: input.name.trim(),
          stat1Value: input.stat1Value.trim(),
          stat1Label: input.stat1Label.trim(),
          stat2Value: input.stat2Value.trim(),
          stat2Label: input.stat2Label.trim(),
          stat3Value: input.stat3Value.trim(),
          stat3Label: input.stat3Label.trim(),
          stat4Value: input.stat4Value.trim(),
          stat4Label: input.stat4Label.trim(),
        })
        .where(eq(homeStatSet.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeStatSet.id, status: homeStatSet.status })
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      if (existing.status === 'PUBLISHED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Yayındaki istatistik seti silinemez. Önce yayından kaldırın.',
        })
      }

      await ctx.db
        .update(homeStatSet)
        .set(ctx.audit.softDelete(homeStatSet))
        .where(eq(homeStatSet.id, input.id))

      return { ok: true as const }
    }),

  restore: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const [restored] = await ctx.db
        .update(homeStatSet)
        .set({ deletedAt: null, deletedBy: null })
        .where(
          and(eq(homeStatSet.id, input.id), isNotNull(homeStatSet.deletedAt))
        )
        .returning({ id: homeStatSet.id })

      if (!restored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Geri alınacak istatistik seti bulunamadı',
        })
      }

      return { id: restored.id }
    }),

  publish: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeStatSet.id })
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      const now = new Date()

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(homeStatSet)
          .set({ status: 'DRAFT', publishedAt: null })
          .where(
            and(
              ne(homeStatSet.id, input.id),
              eq(homeStatSet.status, 'PUBLISHED'),
              excludeDeleted(homeStatSet)
            )
          )

        await tx
          .update(homeStatSet)
          .set({ status: 'PUBLISHED', publishedAt: now })
          .where(eq(homeStatSet.id, input.id))
      })

      return { id: input.id }
    }),

  unpublish: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeStatSet.id, status: homeStatSet.status })
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      if (existing.status !== 'PUBLISHED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Yalnızca yayındaki set yayından kaldırılabilir',
        })
      }

      await ctx.db
        .update(homeStatSet)
        .set({ status: 'DRAFT', publishedAt: null })
        .where(eq(homeStatSet.id, input.id))

      return { id: input.id }
    }),
})

export type HomeStatSetStatus =
  (typeof sliderGroupStatusEnum.enumValues)[number]
