import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { blogCategory, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const blogTypeInput = z.object({
  name: z.string().trim().min(1, 'Ad gerekli'),
  slug: z.string().trim().min(1, 'Slug gerekli'),
  description: z.string().optional().nullable(),
})

export const blogTypeRouter = router({
  list: rbacProcedure(SCOPES.BLOG_TYPE, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'slug', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(blogCategory)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [blogCategory.name, blogCategory.slug, blogCategory.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: blogCategory.name,
        slug: blogCategory.slug,
        createdAt: blogCategory.createdAt,
        sortOrder: blogCategory.sortOrder,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: blogCategory.name,
        slug: blogCategory.slug,
        createdAt: blogCategory.createdAt,
        sortOrder: blogCategory.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: blogCategory.id,
            name: blogCategory.name,
            slug: blogCategory.slug,
            description: blogCategory.description,
            sortOrder: blogCategory.sortOrder,
            createdAt: blogCategory.createdAt,
            updatedAt: blogCategory.updatedAt,
          })
          .from(blogCategory)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(blogCategory)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.BLOG_TYPE, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: blogCategory.id,
          name: blogCategory.name,
          slug: blogCategory.slug,
          description: blogCategory.description,
          sortOrder: blogCategory.sortOrder,
          createdAt: blogCategory.createdAt,
          updatedAt: blogCategory.updatedAt,
        })
        .from(blogCategory)
        .where(and(eq(blogCategory.id, input.id), excludeDeleted(blogCategory)))
        .limit(1)
        .then((result) => result[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog türü bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.BLOG_TYPE, PERMISSIONS.CREATE)
    .input(blogTypeInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(blogCategory)
        .values({
          name: input.name.trim(),
          slug: input.slug.trim(),
          description: input.description?.trim() || null,
          sortOrder: await ctx.db
            .select({ sortOrder: blogCategory.sortOrder })
            .from(blogCategory)
            .where(excludeDeleted(blogCategory))
            .orderBy(desc(blogCategory.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: blogCategory.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Blog türü oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.BLOG_TYPE, PERMISSIONS.UPDATE)
    .input(
      blogTypeInput.extend({
        id: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: blogCategory.id })
        .from(blogCategory)
        .where(and(eq(blogCategory.id, input.id), excludeDeleted(blogCategory)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog türü bulunamadı',
        })
      }

      await ctx.db
        .update(blogCategory)
        .set({
          name: input.name.trim(),
          slug: input.slug.trim(),
          description: input.description?.trim() || null,
        })
        .where(eq(blogCategory.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.BLOG_TYPE, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: blogCategory.id })
        .from(blogCategory)
        .where(and(eq(blogCategory.id, input.id), excludeDeleted(blogCategory)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Blog türü bulunamadı',
        })
      }
      await ctx.db
        .update(blogCategory)
        .set(ctx.audit.softDelete(blogCategory))
        .where(eq(blogCategory.id, input.id))
      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(SCOPES.BLOG_TYPE, PERMISSIONS.READ).query(
    async ({ ctx }) =>
      ctx.db
        .select({ id: blogCategory.id })
        .from(blogCategory)
        .where(excludeDeleted(blogCategory))
        .orderBy(asc(blogCategory.sortOrder), desc(blogCategory.createdAt))
  ),

  reorder: rbacProcedure(SCOPES.BLOG_TYPE, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: blogCategory.id })
        .from(blogCategory)
        .where(excludeDeleted(blogCategory))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm blog türlerini içermelidir',
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
            .update(blogCategory)
            .set({ sortOrder: idx })
            .where(
              and(
                eq(blogCategory.id, id),
                inArray(blogCategory.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
