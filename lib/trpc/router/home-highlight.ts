import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { homeHighlight, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { HOME_HIGHLIGHT_ICON_KEYS } from '@/lib/website/home-highlight-icons'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import {
  createAdminListSchema,
  publicProcedure,
  rbacProcedure,
  router,
} from '../index'

const uuidZ = z.uuid()

const iconKeyZ = z.enum(HOME_HIGHLIGHT_ICON_KEYS)

const highlightSelect = {
  id: homeHighlight.id,
  title: homeHighlight.title,
  description: homeHighlight.description,
  iconKey: homeHighlight.iconKey,
  sortOrder: homeHighlight.sortOrder,
  createdAt: homeHighlight.createdAt,
  updatedAt: homeHighlight.updatedAt,
} as const

const highlightFormInput = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  description: z.string().trim().min(1, 'Açıklama gerekli'),
  iconKey: iconKeyZ,
})

const highlightListOrder = [
  asc(homeHighlight.sortOrder),
  desc(homeHighlight.createdAt),
] as const

export const homeHighlightRouter = router({
  list: rbacProcedure(SCOPES.HOME_HIGHLIGHT, PERMISSIONS.READ)
    .input(createAdminListSchema(['title', 'sortOrder', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(homeHighlight)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [homeHighlight.title, homeHighlight.description, homeHighlight.iconKey],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        title: homeHighlight.title,
        sortOrder: homeHighlight.sortOrder,
        createdAt: homeHighlight.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        title: homeHighlight.title,
        sortOrder: homeHighlight.sortOrder,
        createdAt: homeHighlight.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select(highlightSelect)
          .from(homeHighlight)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(homeHighlight)
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
    SCOPES.HOME_HIGHLIGHT,
    PERMISSIONS.READ
  ).query(async ({ ctx }) =>
    ctx.db
      .select({ id: homeHighlight.id })
      .from(homeHighlight)
      .where(excludeDeleted(homeHighlight))
      .orderBy(...highlightListOrder)
  ),

  listPublic: publicProcedure.query(async ({ ctx }) =>
    ctx.db
      .select({
        title: homeHighlight.title,
        description: homeHighlight.description,
        iconKey: homeHighlight.iconKey,
      })
      .from(homeHighlight)
      .where(excludeDeleted(homeHighlight))
      .orderBy(...highlightListOrder)
  ),

  getById: rbacProcedure(SCOPES.HOME_HIGHLIGHT, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(highlightSelect)
        .from(homeHighlight)
        .where(
          and(eq(homeHighlight.id, input.id), excludeDeleted(homeHighlight))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Highlight kaydı bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.HOME_HIGHLIGHT, PERMISSIONS.CREATE)
    .input(highlightFormInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(homeHighlight)
        .values({
          title: input.title.trim(),
          description: input.description.trim(),
          iconKey: input.iconKey,
          sortOrder: await ctx.db
            .select({ sortOrder: homeHighlight.sortOrder })
            .from(homeHighlight)
            .where(excludeDeleted(homeHighlight))
            .orderBy(desc(homeHighlight.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: homeHighlight.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Highlight kaydı oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.HOME_HIGHLIGHT, PERMISSIONS.UPDATE)
    .input(highlightFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeHighlight.id })
        .from(homeHighlight)
        .where(
          and(eq(homeHighlight.id, input.id), excludeDeleted(homeHighlight))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Highlight kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(homeHighlight)
        .set({
          title: input.title.trim(),
          description: input.description.trim(),
          iconKey: input.iconKey,
        })
        .where(eq(homeHighlight.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.HOME_HIGHLIGHT, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeHighlight.id })
        .from(homeHighlight)
        .where(
          and(eq(homeHighlight.id, input.id), excludeDeleted(homeHighlight))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Highlight kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(homeHighlight)
        .set(ctx.audit.softDelete(homeHighlight))
        .where(eq(homeHighlight.id, input.id))

      return { ok: true as const }
    }),

  restore: rbacProcedure(SCOPES.HOME_HIGHLIGHT, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const [restored] = await ctx.db
        .update(homeHighlight)
        .set({ deletedAt: null, deletedBy: null })
        .where(
          and(eq(homeHighlight.id, input.id), isNotNull(homeHighlight.deletedAt))
        )
        .returning({ id: homeHighlight.id })

      if (!restored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Geri alınacak highlight kaydı bulunamadı',
        })
      }

      return { id: restored.id }
    }),

  reorder: rbacProcedure(SCOPES.HOME_HIGHLIGHT, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeHighlight.id })
        .from(homeHighlight)
        .where(excludeDeleted(homeHighlight))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm highlight kayıtlarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz highlight id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(homeHighlight)
            .set({ sortOrder: index })
            .where(
              and(
                eq(homeHighlight.id, id),
                inArray(homeHighlight.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
