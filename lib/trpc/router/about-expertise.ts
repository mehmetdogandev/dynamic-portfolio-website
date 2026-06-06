import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { aboutExpertise, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const expertiseSelect = {
  id: aboutExpertise.id,
  title: aboutExpertise.title,
  description: aboutExpertise.description,
  keywords: aboutExpertise.keywords,
  sortOrder: aboutExpertise.sortOrder,
  createdAt: aboutExpertise.createdAt,
  updatedAt: aboutExpertise.updatedAt,
} as const

const expertiseFormInput = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  description: z.string().trim().min(1, 'Açıklama gerekli'),
  keywords: z.array(z.string().trim().min(1)).default([]),
})

const expertiseListOrder = [
  asc(aboutExpertise.sortOrder),
  desc(aboutExpertise.createdAt),
] as const

export const aboutExpertiseRouter = router({
  list: rbacProcedure(SCOPES.ABOUT_EXPERTISE, PERMISSIONS.READ)
    .input(createAdminListSchema(['title', 'sortOrder', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(aboutExpertise)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [aboutExpertise.title, aboutExpertise.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        title: aboutExpertise.title,
        sortOrder: aboutExpertise.sortOrder,
        createdAt: aboutExpertise.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        title: aboutExpertise.title,
        sortOrder: aboutExpertise.sortOrder,
        createdAt: aboutExpertise.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select(expertiseSelect)
          .from(aboutExpertise)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(aboutExpertise)
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
    SCOPES.ABOUT_EXPERTISE,
    PERMISSIONS.READ
  ).query(async ({ ctx }) =>
    ctx.db
      .select({ id: aboutExpertise.id })
      .from(aboutExpertise)
      .where(excludeDeleted(aboutExpertise))
      .orderBy(...expertiseListOrder)
  ),

  getById: rbacProcedure(SCOPES.ABOUT_EXPERTISE, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(expertiseSelect)
        .from(aboutExpertise)
        .where(
          and(eq(aboutExpertise.id, input.id), excludeDeleted(aboutExpertise))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Uzmanlık kaydı bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.ABOUT_EXPERTISE, PERMISSIONS.CREATE)
    .input(expertiseFormInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(aboutExpertise)
        .values({
          title: input.title.trim(),
          description: input.description.trim(),
          keywords: [...new Set(input.keywords.map((k) => k.trim()))],
          sortOrder: await ctx.db
            .select({ sortOrder: aboutExpertise.sortOrder })
            .from(aboutExpertise)
            .where(excludeDeleted(aboutExpertise))
            .orderBy(desc(aboutExpertise.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: aboutExpertise.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Uzmanlık kaydı oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.ABOUT_EXPERTISE, PERMISSIONS.UPDATE)
    .input(expertiseFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutExpertise.id })
        .from(aboutExpertise)
        .where(
          and(eq(aboutExpertise.id, input.id), excludeDeleted(aboutExpertise))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Uzmanlık kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(aboutExpertise)
        .set({
          title: input.title.trim(),
          description: input.description.trim(),
          keywords: [...new Set(input.keywords.map((k) => k.trim()))],
        })
        .where(eq(aboutExpertise.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.ABOUT_EXPERTISE, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutExpertise.id })
        .from(aboutExpertise)
        .where(
          and(eq(aboutExpertise.id, input.id), excludeDeleted(aboutExpertise))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Uzmanlık kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(aboutExpertise)
        .set(ctx.audit.softDelete(aboutExpertise))
        .where(eq(aboutExpertise.id, input.id))

      return { ok: true as const }
    }),

  restore: rbacProcedure(SCOPES.ABOUT_EXPERTISE, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const [restored] = await ctx.db
        .update(aboutExpertise)
        .set({ deletedAt: null, deletedBy: null })
        .where(
          and(
            eq(aboutExpertise.id, input.id),
            isNotNull(aboutExpertise.deletedAt)
          )
        )
        .returning({ id: aboutExpertise.id })

      if (!restored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Geri alınacak uzmanlık kaydı bulunamadı',
        })
      }

      return { id: restored.id }
    }),

  reorder: rbacProcedure(SCOPES.ABOUT_EXPERTISE, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutExpertise.id })
        .from(aboutExpertise)
        .where(excludeDeleted(aboutExpertise))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm uzmanlık kayıtlarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz uzmanlık id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(aboutExpertise)
            .set({ sortOrder: index })
            .where(
              and(
                eq(aboutExpertise.id, id),
                inArray(aboutExpertise.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
