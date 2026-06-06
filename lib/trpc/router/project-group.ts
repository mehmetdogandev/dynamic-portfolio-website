import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { PERMISSIONS, SCOPES, projectGroup } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const projectGroupInput = z.object({
  name: z.string().trim().min(1, 'Ad gerekli'),
  description: z.string().trim().min(1, 'Açıklama gerekli'),
})

export const projectGroupRouter = router({
  list: rbacProcedure(SCOPES.PROJECT_GROUP, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(projectGroup)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [projectGroup.name, projectGroup.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: projectGroup.name,
        createdAt: projectGroup.createdAt,
        sortOrder: projectGroup.sortOrder,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: projectGroup.name,
        createdAt: projectGroup.createdAt,
        sortOrder: projectGroup.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: projectGroup.id,
            name: projectGroup.name,
            description: projectGroup.description,
            sortOrder: projectGroup.sortOrder,
            createdAt: projectGroup.createdAt,
            updatedAt: projectGroup.updatedAt,
          })
          .from(projectGroup)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(projectGroup)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.PROJECT_GROUP, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: projectGroup.id,
          name: projectGroup.name,
          description: projectGroup.description,
          sortOrder: projectGroup.sortOrder,
          createdAt: projectGroup.createdAt,
          updatedAt: projectGroup.updatedAt,
        })
        .from(projectGroup)
        .where(and(eq(projectGroup.id, input.id), excludeDeleted(projectGroup)))
        .limit(1)
        .then((result) => result[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proje grubu bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.PROJECT_GROUP, PERMISSIONS.CREATE)
    .input(projectGroupInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(projectGroup)
        .values({
          name: input.name.trim(),
          description: input.description.trim(),
          sortOrder: await ctx.db
            .select({ sortOrder: projectGroup.sortOrder })
            .from(projectGroup)
            .where(excludeDeleted(projectGroup))
            .orderBy(desc(projectGroup.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: projectGroup.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Proje grubu oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.PROJECT_GROUP, PERMISSIONS.UPDATE)
    .input(projectGroupInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: projectGroup.id })
        .from(projectGroup)
        .where(and(eq(projectGroup.id, input.id), excludeDeleted(projectGroup)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proje grubu bulunamadı',
        })
      }

      await ctx.db
        .update(projectGroup)
        .set({
          name: input.name.trim(),
          description: input.description.trim(),
        })
        .where(eq(projectGroup.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.PROJECT_GROUP, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: projectGroup.id })
        .from(projectGroup)
        .where(and(eq(projectGroup.id, input.id), excludeDeleted(projectGroup)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proje grubu bulunamadı',
        })
      }
      await ctx.db
        .update(projectGroup)
        .set(ctx.audit.softDelete(projectGroup))
        .where(eq(projectGroup.id, input.id))
      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(SCOPES.PROJECT_GROUP, PERMISSIONS.READ).query(
    async ({ ctx }) =>
      ctx.db
        .select({ id: projectGroup.id })
        .from(projectGroup)
        .where(excludeDeleted(projectGroup))
        .orderBy(asc(projectGroup.sortOrder), desc(projectGroup.createdAt))
  ),

  reorder: rbacProcedure(SCOPES.PROJECT_GROUP, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: projectGroup.id })
        .from(projectGroup)
        .where(excludeDeleted(projectGroup))

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
            .update(projectGroup)
            .set({ sortOrder: idx })
            .where(
              and(
                eq(projectGroup.id, id),
                inArray(projectGroup.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
