import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { aboutInterest, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const interestSelect = {
  id: aboutInterest.id,
  label: aboutInterest.label,
  sortOrder: aboutInterest.sortOrder,
  createdAt: aboutInterest.createdAt,
  updatedAt: aboutInterest.updatedAt,
} as const

const interestFormInput = z.object({
  label: z.string().trim().min(1, 'Etiket gerekli'),
})

const interestListOrder = [
  asc(aboutInterest.sortOrder),
  desc(aboutInterest.createdAt),
] as const

export const aboutInterestRouter = router({
  list: rbacProcedure(SCOPES.ABOUT_INTEREST, PERMISSIONS.READ)
    .input(createAdminListSchema(['label', 'sortOrder', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(aboutInterest)]

      if (search) {
        conditions.push(createMultiColumnSearch([aboutInterest.label], search))
      }

      applyColumnFilters(conditions, columnFilters, {
        label: aboutInterest.label,
        sortOrder: aboutInterest.sortOrder,
        createdAt: aboutInterest.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        label: aboutInterest.label,
        sortOrder: aboutInterest.sortOrder,
        createdAt: aboutInterest.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select(interestSelect)
          .from(aboutInterest)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(aboutInterest)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  listReorderScope: rbacProcedure(
    SCOPES.ABOUT_INTEREST,
    PERMISSIONS.READ
  ).query(async ({ ctx }) =>
    ctx.db
      .select({ id: aboutInterest.id })
      .from(aboutInterest)
      .where(excludeDeleted(aboutInterest))
      .orderBy(...interestListOrder)
  ),

  getById: rbacProcedure(SCOPES.ABOUT_INTEREST, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(interestSelect)
        .from(aboutInterest)
        .where(
          and(eq(aboutInterest.id, input.id), excludeDeleted(aboutInterest))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İlgi alanı kaydı bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.ABOUT_INTEREST, PERMISSIONS.CREATE)
    .input(interestFormInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(aboutInterest)
        .values({
          label: input.label.trim(),
          sortOrder: await ctx.db
            .select({ sortOrder: aboutInterest.sortOrder })
            .from(aboutInterest)
            .where(excludeDeleted(aboutInterest))
            .orderBy(desc(aboutInterest.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: aboutInterest.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'İlgi alanı kaydı oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.ABOUT_INTEREST, PERMISSIONS.UPDATE)
    .input(interestFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutInterest.id })
        .from(aboutInterest)
        .where(
          and(eq(aboutInterest.id, input.id), excludeDeleted(aboutInterest))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İlgi alanı kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(aboutInterest)
        .set({ label: input.label.trim() })
        .where(eq(aboutInterest.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.ABOUT_INTEREST, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutInterest.id })
        .from(aboutInterest)
        .where(
          and(eq(aboutInterest.id, input.id), excludeDeleted(aboutInterest))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İlgi alanı kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(aboutInterest)
        .set(ctx.audit.softDelete(aboutInterest))
        .where(eq(aboutInterest.id, input.id))

      return { ok: true as const }
    }),

  restore: rbacProcedure(SCOPES.ABOUT_INTEREST, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const [restored] = await ctx.db
        .update(aboutInterest)
        .set({ deletedAt: null, deletedBy: null })
        .where(
          and(
            eq(aboutInterest.id, input.id),
            isNotNull(aboutInterest.deletedAt)
          )
        )
        .returning({ id: aboutInterest.id })

      if (!restored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Geri alınacak ilgi alanı kaydı bulunamadı',
        })
      }

      return { id: restored.id }
    }),

  reorder: rbacProcedure(SCOPES.ABOUT_INTEREST, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutInterest.id })
        .from(aboutInterest)
        .where(excludeDeleted(aboutInterest))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm ilgi alanı kayıtlarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz ilgi alanı id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(aboutInterest)
            .set({ sortOrder: index })
            .where(
              and(
                eq(aboutInterest.id, id),
                inArray(aboutInterest.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
