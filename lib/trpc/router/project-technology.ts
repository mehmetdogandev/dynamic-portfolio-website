import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { PERMISSIONS, SCOPES, projectTechnology } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const projectTechnologyInput = z.object({
  name: z.string().trim().min(1, 'Ad gerekli'),
  description: z.string().trim().min(1, 'Açıklama gerekli'),
})

export const projectTechnologyRouter = router({
  list: rbacProcedure(SCOPES.PROJECT_TECHNOLOGY, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(projectTechnology)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [projectTechnology.name, projectTechnology.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: projectTechnology.name,
        createdAt: projectTechnology.createdAt,
        sortOrder: projectTechnology.sortOrder,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: projectTechnology.name,
        createdAt: projectTechnology.createdAt,
        sortOrder: projectTechnology.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: projectTechnology.id,
            name: projectTechnology.name,
            description: projectTechnology.description,
            sortOrder: projectTechnology.sortOrder,
            createdAt: projectTechnology.createdAt,
            updatedAt: projectTechnology.updatedAt,
          })
          .from(projectTechnology)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(projectTechnology)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.PROJECT_TECHNOLOGY, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: projectTechnology.id,
          name: projectTechnology.name,
          description: projectTechnology.description,
          sortOrder: projectTechnology.sortOrder,
          createdAt: projectTechnology.createdAt,
          updatedAt: projectTechnology.updatedAt,
        })
        .from(projectTechnology)
        .where(
          and(
            eq(projectTechnology.id, input.id),
            excludeDeleted(projectTechnology)
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

  create: rbacProcedure(SCOPES.PROJECT_TECHNOLOGY, PERMISSIONS.CREATE)
    .input(projectTechnologyInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(projectTechnology)
        .values({
          name: input.name.trim(),
          description: input.description.trim(),
          sortOrder: await ctx.db
            .select({ sortOrder: projectTechnology.sortOrder })
            .from(projectTechnology)
            .where(excludeDeleted(projectTechnology))
            .orderBy(desc(projectTechnology.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: projectTechnology.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Çözüm teknolojisi oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.PROJECT_TECHNOLOGY, PERMISSIONS.UPDATE)
    .input(projectTechnologyInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: projectTechnology.id })
        .from(projectTechnology)
        .where(
          and(
            eq(projectTechnology.id, input.id),
            excludeDeleted(projectTechnology)
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
        .update(projectTechnology)
        .set({
          name: input.name.trim(),
          description: input.description.trim(),
        })
        .where(eq(projectTechnology.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.PROJECT_TECHNOLOGY, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: projectTechnology.id })
        .from(projectTechnology)
        .where(
          and(
            eq(projectTechnology.id, input.id),
            excludeDeleted(projectTechnology)
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
        .update(projectTechnology)
        .set(ctx.audit.softDelete(projectTechnology))
        .where(eq(projectTechnology.id, input.id))
      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(
    SCOPES.PROJECT_TECHNOLOGY,
    PERMISSIONS.READ
  ).query(async ({ ctx }) =>
    ctx.db
      .select({ id: projectTechnology.id })
      .from(projectTechnology)
      .where(excludeDeleted(projectTechnology))
      .orderBy(
        asc(projectTechnology.sortOrder),
        desc(projectTechnology.createdAt)
      )
  ),

  reorder: rbacProcedure(SCOPES.PROJECT_TECHNOLOGY, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: projectTechnology.id })
        .from(projectTechnology)
        .where(excludeDeleted(projectTechnology))

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
            .update(projectTechnology)
            .set({ sortOrder: idx })
            .where(
              and(
                eq(projectTechnology.id, id),
                inArray(projectTechnology.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
