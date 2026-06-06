import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import {
  PERMISSIONS,
  SCOPES,
  japonFormen as japonFormenTable,
} from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const formenInput = z.object({
  name: z.string().trim().min(1, 'Ad gerekli'),
  surname: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  isActive: z.boolean().default(true),
})

export const japonFormenRouter = router({
  list: rbacProcedure(SCOPES.JAPON_OTO_FORMEN, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(japonFormenTable)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [
              japonFormenTable.name,
              japonFormenTable.surname,
              japonFormenTable.phone,
            ],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: japonFormenTable.name,
        createdAt: japonFormenTable.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: japonFormenTable.name,
        createdAt: japonFormenTable.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: japonFormenTable.id,
            name: japonFormenTable.name,
            surname: japonFormenTable.surname,
            phone: japonFormenTable.phone,
            notes: japonFormenTable.notes,
            isActive: japonFormenTable.isActive,
            createdAt: japonFormenTable.createdAt,
            updatedAt: japonFormenTable.updatedAt,
          })
          .from(japonFormenTable)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(japonFormenTable)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.JAPON_OTO_FORMEN, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select()
        .from(japonFormenTable)
        .where(
          and(
            eq(japonFormenTable.id, input.id),
            excludeDeleted(japonFormenTable)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Formen bulunamadı',
        })
      }
      return row
    }),

  create: rbacProcedure(SCOPES.JAPON_OTO_FORMEN, PERMISSIONS.CREATE)
    .input(formenInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(japonFormenTable)
        .values({
          name: input.name.trim(),
          surname: input.surname,
          phone: input.phone,
          notes: input.notes,
          isActive: input.isActive,
        })
        .returning({ id: japonFormenTable.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Formen oluşturulamadı',
        })
      }
      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.JAPON_OTO_FORMEN, PERMISSIONS.UPDATE)
    .input(formenInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: japonFormenTable.id })
        .from(japonFormenTable)
        .where(
          and(
            eq(japonFormenTable.id, input.id),
            excludeDeleted(japonFormenTable)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Formen bulunamadı',
        })
      }

      await ctx.db
        .update(japonFormenTable)
        .set({
          name: input.name.trim(),
          surname: input.surname,
          phone: input.phone,
          notes: input.notes,
          isActive: input.isActive,
        })
        .where(eq(japonFormenTable.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.JAPON_OTO_FORMEN, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: japonFormenTable.id })
        .from(japonFormenTable)
        .where(
          and(
            eq(japonFormenTable.id, input.id),
            excludeDeleted(japonFormenTable)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Formen bulunamadı',
        })
      }
      await ctx.db
        .update(japonFormenTable)
        .set(ctx.audit.softDelete(japonFormenTable))
        .where(eq(japonFormenTable.id, input.id))
      return { ok: true as const }
    }),
})
