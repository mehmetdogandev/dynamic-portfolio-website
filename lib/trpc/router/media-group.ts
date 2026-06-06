import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { mediaGroup, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const mediaGroupFormInput = z.object({
  name: z.string().trim().min(1, 'Grup adı gerekli'),
  description: z.string().optional().nullable(),
  parentMediaGroupId: z.union([uuidZ, z.null()]).optional(),
})

export const mediaGroupRouter = router({
  list: rbacProcedure(SCOPES.MEDIA_GROUP, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(mediaGroup)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [mediaGroup.name, mediaGroup.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: mediaGroup.name,
        createdAt: mediaGroup.createdAt,
        sortOrder: mediaGroup.sortOrder,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: mediaGroup.name,
        createdAt: mediaGroup.createdAt,
        sortOrder: mediaGroup.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: mediaGroup.id,
            name: mediaGroup.name,
            description: mediaGroup.description,
            parentMediaGroupId: mediaGroup.parentMediaGroupId,
            sortOrder: mediaGroup.sortOrder,
            createdAt: mediaGroup.createdAt,
            updatedAt: mediaGroup.updatedAt,
          })
          .from(mediaGroup)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(mediaGroup)
          .where(whereCondition),
      ])

      const parentIds = [
        ...new Set(
          rows
            .map((row) => row.parentMediaGroupId)
            .filter((id): id is string => id != null)
        ),
      ]
      const nameById =
        parentIds.length > 0
          ? new Map(
              (
                await ctx.db
                  .select({ id: mediaGroup.id, name: mediaGroup.name })
                  .from(mediaGroup)
                  .where(inArray(mediaGroup.id, parentIds))
              ).map((row) => [row.id, row.name])
            )
          : new Map<string, string>()

      const data = rows.map((row) => ({
        ...row,
        parentName: row.parentMediaGroupId
          ? (nameById.get(row.parentMediaGroupId) ?? null)
          : null,
      }))

      return paginatedListResponse(
        data,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.MEDIA_GROUP, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: mediaGroup.id,
          name: mediaGroup.name,
          description: mediaGroup.description,
          parentMediaGroupId: mediaGroup.parentMediaGroupId,
          sortOrder: mediaGroup.sortOrder,
          createdAt: mediaGroup.createdAt,
          updatedAt: mediaGroup.updatedAt,
        })
        .from(mediaGroup)
        .where(and(eq(mediaGroup.id, input.id), excludeDeleted(mediaGroup)))
        .limit(1)

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medya grubu yok' })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.MEDIA_GROUP, PERMISSIONS.CREATE)
    .input(mediaGroupFormInput)
    .mutation(async ({ ctx, input }) => {
      if (input.parentMediaGroupId) {
        const parent = await ctx.db
          .select({ id: mediaGroup.id })
          .from(mediaGroup)
          .where(
            and(
              eq(mediaGroup.id, input.parentMediaGroupId),
              excludeDeleted(mediaGroup)
            )
          )
          .limit(1)
          .then((r) => r[0])

        if (!parent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Üst medya grubu bulunamadı',
          })
        }
      }

      const [inserted] = await ctx.db
        .insert(mediaGroup)
        .values({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          parentMediaGroupId: input.parentMediaGroupId ?? null,
          sortOrder: await ctx.db
            .select({ sortOrder: mediaGroup.sortOrder })
            .from(mediaGroup)
            .where(excludeDeleted(mediaGroup))
            .orderBy(desc(mediaGroup.sortOrder))
            .limit(1)
            .then((r) => (r[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: mediaGroup.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Medya grubu oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.MEDIA_GROUP, PERMISSIONS.UPDATE)
    .input(
      mediaGroupFormInput.extend({
        id: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: mediaGroup.id })
        .from(mediaGroup)
        .where(and(eq(mediaGroup.id, input.id), excludeDeleted(mediaGroup)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medya grubu yok' })
      }

      if (input.parentMediaGroupId === input.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Bir grup kendisini parent olarak alamaz',
        })
      }

      if (input.parentMediaGroupId) {
        const parent = await ctx.db
          .select({ id: mediaGroup.id })
          .from(mediaGroup)
          .where(
            and(
              eq(mediaGroup.id, input.parentMediaGroupId),
              excludeDeleted(mediaGroup)
            )
          )
          .limit(1)
          .then((r) => r[0])

        if (!parent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Üst medya grubu bulunamadı',
          })
        }
      }

      await ctx.db
        .update(mediaGroup)
        .set({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          parentMediaGroupId: input.parentMediaGroupId ?? null,
        })
        .where(eq(mediaGroup.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.MEDIA_GROUP, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const hasActiveChildren = await ctx.db
        .select({ id: mediaGroup.id })
        .from(mediaGroup)
        .where(
          and(
            eq(mediaGroup.parentMediaGroupId, input.id),
            isNull(mediaGroup.deletedAt)
          )
        )
        .limit(1)
        .then((r) => r[0])

      if (hasActiveChildren) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Bu grup altında alt gruplar var. Önce alt grupları taşıyın veya silin.',
        })
      }

      const existing = await ctx.db
        .select({ id: mediaGroup.id })
        .from(mediaGroup)
        .where(and(eq(mediaGroup.id, input.id), excludeDeleted(mediaGroup)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medya grubu yok' })
      }

      await ctx.db
        .update(mediaGroup)
        .set(ctx.audit.softDelete(mediaGroup))
        .where(eq(mediaGroup.id, input.id))

      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(SCOPES.MEDIA_GROUP, PERMISSIONS.READ).query(
    async ({ ctx }) =>
      ctx.db
        .select({ id: mediaGroup.id })
        .from(mediaGroup)
        .where(excludeDeleted(mediaGroup))
        .orderBy(asc(mediaGroup.sortOrder), desc(mediaGroup.createdAt))
  ),

  reorder: rbacProcedure(SCOPES.MEDIA_GROUP, PERMISSIONS.UPDATE)
    .input(z.object({ orderedIds: z.array(uuidZ).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: mediaGroup.id })
        .from(mediaGroup)
        .where(excludeDeleted(mediaGroup))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm medya gruplarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      const allIdsExist = input.orderedIds.every((id) => existingIds.has(id))
      if (!allIdsExist) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz medya grubu id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(mediaGroup)
            .set({ sortOrder: index })
            .where(
              and(
                eq(mediaGroup.id, id),
                inArray(mediaGroup.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
