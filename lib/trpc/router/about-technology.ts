import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { aboutTechnology, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const technologySelect = {
  id: aboutTechnology.id,
  category: aboutTechnology.category,
  name: aboutTechnology.name,
  sortOrder: aboutTechnology.sortOrder,
  createdAt: aboutTechnology.createdAt,
  updatedAt: aboutTechnology.updatedAt,
} as const

const technologyFormInput = z.object({
  category: z.string().trim().min(1, 'Kategori gerekli'),
  name: z.string().trim().min(1, 'Ad gerekli'),
})

const technologyListOrder = [
  asc(aboutTechnology.sortOrder),
  desc(aboutTechnology.createdAt),
] as const

export const aboutTechnologyRouter = router({
  list: rbacProcedure(SCOPES.ABOUT_TECHNOLOGY, PERMISSIONS.READ)
    .input(
      createAdminListSchema(['category', 'name', 'sortOrder', 'createdAt'])
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(aboutTechnology)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [aboutTechnology.category, aboutTechnology.name],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        category: aboutTechnology.category,
        name: aboutTechnology.name,
        sortOrder: aboutTechnology.sortOrder,
        createdAt: aboutTechnology.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        category: aboutTechnology.category,
        name: aboutTechnology.name,
        sortOrder: aboutTechnology.sortOrder,
        createdAt: aboutTechnology.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select(technologySelect)
          .from(aboutTechnology)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(aboutTechnology)
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
    SCOPES.ABOUT_TECHNOLOGY,
    PERMISSIONS.READ
  ).query(async ({ ctx }) =>
    ctx.db
      .select({ id: aboutTechnology.id })
      .from(aboutTechnology)
      .where(excludeDeleted(aboutTechnology))
      .orderBy(...technologyListOrder)
  ),

  getById: rbacProcedure(SCOPES.ABOUT_TECHNOLOGY, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(technologySelect)
        .from(aboutTechnology)
        .where(
          and(eq(aboutTechnology.id, input.id), excludeDeleted(aboutTechnology))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teknoloji kaydı bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.ABOUT_TECHNOLOGY, PERMISSIONS.CREATE)
    .input(technologyFormInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(aboutTechnology)
        .values({
          category: input.category.trim(),
          name: input.name.trim(),
          sortOrder: await ctx.db
            .select({ sortOrder: aboutTechnology.sortOrder })
            .from(aboutTechnology)
            .where(excludeDeleted(aboutTechnology))
            .orderBy(desc(aboutTechnology.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: aboutTechnology.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Teknoloji kaydı oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.ABOUT_TECHNOLOGY, PERMISSIONS.UPDATE)
    .input(technologyFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutTechnology.id })
        .from(aboutTechnology)
        .where(
          and(eq(aboutTechnology.id, input.id), excludeDeleted(aboutTechnology))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teknoloji kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(aboutTechnology)
        .set({
          category: input.category.trim(),
          name: input.name.trim(),
        })
        .where(eq(aboutTechnology.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.ABOUT_TECHNOLOGY, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutTechnology.id })
        .from(aboutTechnology)
        .where(
          and(eq(aboutTechnology.id, input.id), excludeDeleted(aboutTechnology))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teknoloji kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(aboutTechnology)
        .set(ctx.audit.softDelete(aboutTechnology))
        .where(eq(aboutTechnology.id, input.id))

      return { ok: true as const }
    }),

  restore: rbacProcedure(SCOPES.ABOUT_TECHNOLOGY, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const [restored] = await ctx.db
        .update(aboutTechnology)
        .set({ deletedAt: null, deletedBy: null })
        .where(
          and(
            eq(aboutTechnology.id, input.id),
            isNotNull(aboutTechnology.deletedAt)
          )
        )
        .returning({ id: aboutTechnology.id })

      if (!restored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Geri alınacak teknoloji kaydı bulunamadı',
        })
      }

      return { id: restored.id }
    }),

  reorder: rbacProcedure(SCOPES.ABOUT_TECHNOLOGY, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutTechnology.id })
        .from(aboutTechnology)
        .where(excludeDeleted(aboutTechnology))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm teknoloji kayıtlarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz teknoloji id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(aboutTechnology)
            .set({ sortOrder: index })
            .where(
              and(
                eq(aboutTechnology.id, id),
                inArray(aboutTechnology.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
