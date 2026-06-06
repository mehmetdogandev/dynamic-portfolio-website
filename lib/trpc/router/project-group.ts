import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { PERMISSIONS, SCOPES, solutionGroup } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const solutionGroupInput = z.object({
  name: z.string().trim().min(1, 'Ad gerekli'),
  description: z.string().trim().min(1, 'Açıklama gerekli'),
})

export const solutionGroupRouter = router({
  list: rbacProcedure(SCOPES.SOLUTION_GROUP, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(solutionGroup)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [solutionGroup.name, solutionGroup.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: solutionGroup.name,
        createdAt: solutionGroup.createdAt,
        sortOrder: solutionGroup.sortOrder,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: solutionGroup.name,
        createdAt: solutionGroup.createdAt,
        sortOrder: solutionGroup.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: solutionGroup.id,
            name: solutionGroup.name,
            description: solutionGroup.description,
            sortOrder: solutionGroup.sortOrder,
            createdAt: solutionGroup.createdAt,
            updatedAt: solutionGroup.updatedAt,
          })
          .from(solutionGroup)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(solutionGroup)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.SOLUTION_GROUP, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: solutionGroup.id,
          name: solutionGroup.name,
          description: solutionGroup.description,
          sortOrder: solutionGroup.sortOrder,
          createdAt: solutionGroup.createdAt,
          updatedAt: solutionGroup.updatedAt,
        })
        .from(solutionGroup)
        .where(
          and(eq(solutionGroup.id, input.id), excludeDeleted(solutionGroup))
        )
        .limit(1)
        .then((result) => result[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm grubu bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.SOLUTION_GROUP, PERMISSIONS.CREATE)
    .input(solutionGroupInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(solutionGroup)
        .values({
          name: input.name.trim(),
          description: input.description.trim(),
          sortOrder: await ctx.db
            .select({ sortOrder: solutionGroup.sortOrder })
            .from(solutionGroup)
            .where(excludeDeleted(solutionGroup))
            .orderBy(desc(solutionGroup.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: solutionGroup.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Çözüm grubu oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.SOLUTION_GROUP, PERMISSIONS.UPDATE)
    .input(solutionGroupInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solutionGroup.id })
        .from(solutionGroup)
        .where(
          and(eq(solutionGroup.id, input.id), excludeDeleted(solutionGroup))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm grubu bulunamadı',
        })
      }

      await ctx.db
        .update(solutionGroup)
        .set({
          name: input.name.trim(),
          description: input.description.trim(),
        })
        .where(eq(solutionGroup.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.SOLUTION_GROUP, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solutionGroup.id })
        .from(solutionGroup)
        .where(
          and(eq(solutionGroup.id, input.id), excludeDeleted(solutionGroup))
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm grubu bulunamadı',
        })
      }
      await ctx.db
        .update(solutionGroup)
        .set(ctx.audit.softDelete(solutionGroup))
        .where(eq(solutionGroup.id, input.id))
      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(
    SCOPES.SOLUTION_GROUP,
    PERMISSIONS.READ
  ).query(async ({ ctx }) =>
    ctx.db
      .select({ id: solutionGroup.id })
      .from(solutionGroup)
      .where(excludeDeleted(solutionGroup))
      .orderBy(asc(solutionGroup.sortOrder), desc(solutionGroup.createdAt))
  ),

  reorder: rbacProcedure(SCOPES.SOLUTION_GROUP, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solutionGroup.id })
        .from(solutionGroup)
        .where(excludeDeleted(solutionGroup))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm çözüm gruplarını içermelidir',
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
            .update(solutionGroup)
            .set({ sortOrder: idx })
            .where(
              and(
                eq(solutionGroup.id, id),
                inArray(solutionGroup.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
