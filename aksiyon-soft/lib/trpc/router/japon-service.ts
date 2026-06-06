import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { PERMISSIONS, SCOPES, japonService } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const serviceInput = z.object({
  name: z.string().trim().min(1, 'Ad gerekli'),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  isActive: z.boolean().default(true),
})

export const japonServiceRouter = router({
  list: rbacProcedure(SCOPES.JAPON_OTO_SERVICE, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(japonService)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [japonService.name, japonService.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: japonService.name,
        createdAt: japonService.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: japonService.name,
        createdAt: japonService.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: japonService.id,
            name: japonService.name,
            description: japonService.description,
            isActive: japonService.isActive,
            createdAt: japonService.createdAt,
            updatedAt: japonService.updatedAt,
          })
          .from(japonService)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(japonService)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.JAPON_OTO_SERVICE, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select()
        .from(japonService)
        .where(and(eq(japonService.id, input.id), excludeDeleted(japonService)))
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Servis bulunamadı',
        })
      }
      return row
    }),

  create: rbacProcedure(SCOPES.JAPON_OTO_SERVICE, PERMISSIONS.CREATE)
    .input(serviceInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(japonService)
        .values({
          name: input.name.trim(),
          description: input.description,
          isActive: input.isActive,
        })
        .returning({ id: japonService.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Servis oluşturulamadı',
        })
      }
      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.JAPON_OTO_SERVICE, PERMISSIONS.UPDATE)
    .input(serviceInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: japonService.id })
        .from(japonService)
        .where(and(eq(japonService.id, input.id), excludeDeleted(japonService)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Servis bulunamadı',
        })
      }

      await ctx.db
        .update(japonService)
        .set({
          name: input.name.trim(),
          description: input.description,
          isActive: input.isActive,
        })
        .where(eq(japonService.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.JAPON_OTO_SERVICE, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: japonService.id })
        .from(japonService)
        .where(and(eq(japonService.id, input.id), excludeDeleted(japonService)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Servis bulunamadı',
        })
      }
      await ctx.db
        .update(japonService)
        .set(ctx.audit.softDelete(japonService))
        .where(eq(japonService.id, input.id))
      return { ok: true as const }
    }),
})
