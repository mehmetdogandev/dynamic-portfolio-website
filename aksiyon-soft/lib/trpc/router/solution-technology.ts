import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { PERMISSIONS, SCOPES, solutionTechnology } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const solutionTechnologyInput = z.object({
  name: z.string().trim().min(1, 'Ad gerekli'),
  description: z.string().trim().min(1, 'Açıklama gerekli'),
})

export const solutionTechnologyRouter = router({
  list: rbacProcedure(SCOPES.SOLUTION_TECHNOLOGY, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(solutionTechnology)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [solutionTechnology.name, solutionTechnology.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: solutionTechnology.name,
        createdAt: solutionTechnology.createdAt,
        sortOrder: solutionTechnology.sortOrder,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: solutionTechnology.name,
        createdAt: solutionTechnology.createdAt,
        sortOrder: solutionTechnology.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: solutionTechnology.id,
            name: solutionTechnology.name,
            description: solutionTechnology.description,
            sortOrder: solutionTechnology.sortOrder,
            createdAt: solutionTechnology.createdAt,
            updatedAt: solutionTechnology.updatedAt,
          })
          .from(solutionTechnology)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(solutionTechnology)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.SOLUTION_TECHNOLOGY, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: solutionTechnology.id,
          name: solutionTechnology.name,
          description: solutionTechnology.description,
          sortOrder: solutionTechnology.sortOrder,
          createdAt: solutionTechnology.createdAt,
          updatedAt: solutionTechnology.updatedAt,
        })
        .from(solutionTechnology)
        .where(
          and(
            eq(solutionTechnology.id, input.id),
            excludeDeleted(solutionTechnology)
          )
        )
        .limit(1)
        .then((result) => result[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm teknolojisi bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.SOLUTION_TECHNOLOGY, PERMISSIONS.CREATE)
    .input(solutionTechnologyInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(solutionTechnology)
        .values({
          name: input.name.trim(),
          description: input.description.trim(),
          sortOrder: await ctx.db
            .select({ sortOrder: solutionTechnology.sortOrder })
            .from(solutionTechnology)
            .where(excludeDeleted(solutionTechnology))
            .orderBy(desc(solutionTechnology.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: solutionTechnology.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Çözüm teknolojisi oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.SOLUTION_TECHNOLOGY, PERMISSIONS.UPDATE)
    .input(solutionTechnologyInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solutionTechnology.id })
        .from(solutionTechnology)
        .where(
          and(
            eq(solutionTechnology.id, input.id),
            excludeDeleted(solutionTechnology)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm teknolojisi bulunamadı',
        })
      }

      await ctx.db
        .update(solutionTechnology)
        .set({
          name: input.name.trim(),
          description: input.description.trim(),
        })
        .where(eq(solutionTechnology.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.SOLUTION_TECHNOLOGY, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solutionTechnology.id })
        .from(solutionTechnology)
        .where(
          and(
            eq(solutionTechnology.id, input.id),
            excludeDeleted(solutionTechnology)
          )
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm teknolojisi bulunamadı',
        })
      }
      await ctx.db
        .update(solutionTechnology)
        .set(ctx.audit.softDelete(solutionTechnology))
        .where(eq(solutionTechnology.id, input.id))
      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(
    SCOPES.SOLUTION_TECHNOLOGY,
    PERMISSIONS.READ
  ).query(async ({ ctx }) =>
    ctx.db
      .select({ id: solutionTechnology.id })
      .from(solutionTechnology)
      .where(excludeDeleted(solutionTechnology))
      .orderBy(
        asc(solutionTechnology.sortOrder),
        desc(solutionTechnology.createdAt)
      )
  ),

  reorder: rbacProcedure(SCOPES.SOLUTION_TECHNOLOGY, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solutionTechnology.id })
        .from(solutionTechnology)
        .where(excludeDeleted(solutionTechnology))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm çözüm teknolojilerini içermelidir',
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
            .update(solutionTechnology)
            .set({ sortOrder: idx })
            .where(
              and(
                eq(solutionTechnology.id, id),
                inArray(solutionTechnology.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
