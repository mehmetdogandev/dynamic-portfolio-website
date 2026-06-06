import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import {
  file,
  media,
  mediaGroup,
  mediaTypeEnum,
  PERMISSIONS,
  SCOPES,
} from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const mediaFormInput = z.object({
  mediaGroupId: uuidZ,
  fileId: uuidZ,
  type: z.enum(mediaTypeEnum.enumValues),
  title: z.string().trim().min(1, 'Başlık gerekli'),
  description: z.string().optional().nullable(),
  imageAlt: z.string().optional().nullable(),
  parentMediaId: z.union([uuidZ, z.null()]).optional(),
})

export const mediaRouter = router({
  list: rbacProcedure(SCOPES.MEDIA, PERMISSIONS.READ)
    .input(createAdminListSchema(['title', 'type', 'sortOrder', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(media)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [media.title, media.description, mediaGroup.name],
            search
          )
        )
      }

      applyColumnFilters(
        conditions,
        columnFilters,
        {
          mediaGroupId: media.mediaGroupId,
          title: media.title,
          type: media.type,
        },
        { exactKeys: ['mediaGroupId', 'type'] }
      )

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        title: media.title,
        type: media.type,
        sortOrder: media.sortOrder,
        createdAt: media.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: media.id,
            mediaGroupId: media.mediaGroupId,
            mediaGroupName: mediaGroup.name,
            fileId: media.fileId,
            fileName: file.originalName,
            fileMimeType: file.mimeType,
            type: media.type,
            title: media.title,
            description: media.description,
            imageAlt: media.imageAlt,
            parentMediaId: media.parentMediaId,
            sortOrder: media.sortOrder,
            createdAt: media.createdAt,
            updatedAt: media.updatedAt,
          })
          .from(media)
          .leftJoin(mediaGroup, eq(media.mediaGroupId, mediaGroup.id))
          .leftJoin(file, eq(media.fileId, file.id))
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(media)
          .leftJoin(mediaGroup, eq(media.mediaGroupId, mediaGroup.id))
          .where(whereCondition),
      ])

      const data = rows.map((row) => ({
        id: row.id,
        mediaGroupId: row.mediaGroupId,
        mediaGroupName: row.mediaGroupName,
        fileId: row.fileId,
        fileName: row.fileName,
        fileMimeType: row.fileMimeType,
        type: row.type,
        title: row.title,
        description: row.description,
        imageAlt: row.imageAlt,
        parentMediaId: row.parentMediaId,
        parentMediaTitle: null,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
      }))

      return paginatedListResponse(
        data,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.MEDIA, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: media.id,
          mediaGroupId: media.mediaGroupId,
          fileId: media.fileId,
          type: media.type,
          title: media.title,
          description: media.description,
          imageAlt: media.imageAlt,
          parentMediaId: media.parentMediaId,
          sortOrder: media.sortOrder,
          createdAt: media.createdAt,
          updatedAt: media.updatedAt,
        })
        .from(media)
        .where(and(eq(media.id, input.id), excludeDeleted(media)))
        .limit(1)

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medya bulunamadı' })
      }

      return {
        ...row,
        fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
      }
    }),

  create: rbacProcedure(SCOPES.MEDIA, PERMISSIONS.CREATE)
    .input(mediaFormInput)
    .mutation(async ({ ctx, input }) => {
      const groupExists = await ctx.db
        .select({ id: mediaGroup.id })
        .from(mediaGroup)
        .where(
          and(eq(mediaGroup.id, input.mediaGroupId), excludeDeleted(mediaGroup))
        )
        .limit(1)
        .then((r) => r[0])

      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Medya grubu bulunamadı',
        })
      }

      const fileExists = await ctx.db
        .select({ id: file.id })
        .from(file)
        .where(and(eq(file.id, input.fileId), eq(file.isDeleted, false)))
        .limit(1)
        .then((r) => r[0])

      if (!fileExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Dosya bulunamadı',
        })
      }

      if (input.parentMediaId) {
        const parentExists = await ctx.db
          .select({ id: media.id })
          .from(media)
          .where(and(eq(media.id, input.parentMediaId), excludeDeleted(media)))
          .limit(1)
          .then((r) => r[0])

        if (!parentExists) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Üst medya kaydı bulunamadı',
          })
        }
      }

      const [inserted] = await ctx.db
        .insert(media)
        .values({
          mediaGroupId: input.mediaGroupId,
          fileId: input.fileId,
          type: input.type,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          imageAlt: input.imageAlt?.trim() || null,
          parentMediaId: input.parentMediaId ?? null,
          sortOrder: await ctx.db
            .select({ sortOrder: media.sortOrder })
            .from(media)
            .where(
              and(
                excludeDeleted(media),
                eq(media.mediaGroupId, input.mediaGroupId)
              )
            )
            .orderBy(desc(media.sortOrder))
            .limit(1)
            .then((r) => (r[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: media.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Medya oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.MEDIA, PERMISSIONS.UPDATE)
    .input(
      mediaFormInput.extend({
        id: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: media.id })
        .from(media)
        .where(and(eq(media.id, input.id), excludeDeleted(media)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medya bulunamadı' })
      }

      if (input.parentMediaId === input.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Bir medya kaydı kendisini parent olarak alamaz',
        })
      }

      const groupExists = await ctx.db
        .select({ id: mediaGroup.id })
        .from(mediaGroup)
        .where(
          and(eq(mediaGroup.id, input.mediaGroupId), excludeDeleted(mediaGroup))
        )
        .limit(1)
        .then((r) => r[0])

      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Medya grubu bulunamadı',
        })
      }

      const fileExists = await ctx.db
        .select({ id: file.id })
        .from(file)
        .where(and(eq(file.id, input.fileId), eq(file.isDeleted, false)))
        .limit(1)
        .then((r) => r[0])

      if (!fileExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Dosya bulunamadı',
        })
      }

      if (input.parentMediaId) {
        const parentExists = await ctx.db
          .select({ id: media.id })
          .from(media)
          .where(and(eq(media.id, input.parentMediaId), excludeDeleted(media)))
          .limit(1)
          .then((r) => r[0])

        if (!parentExists) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Üst medya kaydı bulunamadı',
          })
        }
      }

      await ctx.db
        .update(media)
        .set({
          mediaGroupId: input.mediaGroupId,
          fileId: input.fileId,
          type: input.type,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          imageAlt: input.imageAlt?.trim() || null,
          parentMediaId: input.parentMediaId ?? null,
        })
        .where(eq(media.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.MEDIA, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: media.id })
        .from(media)
        .where(and(eq(media.id, input.id), excludeDeleted(media)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medya bulunamadı' })
      }

      await ctx.db
        .update(media)
        .set(ctx.audit.softDelete(media))
        .where(eq(media.id, input.id))
      return { ok: true as const }
    }),

  reorder: rbacProcedure(SCOPES.MEDIA, PERMISSIONS.UPDATE)
    .input(
      z.object({
        mediaGroupId: uuidZ,
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: media.id })
        .from(media)
        .where(
          and(excludeDeleted(media), eq(media.mediaGroupId, input.mediaGroupId))
        )

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Sıralama listesi seçili grubun tüm medya kayıtlarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      const allIdsExist = input.orderedIds.every((id) => existingIds.has(id))
      if (!allIdsExist) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz medya id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(media)
            .set({ sortOrder: index })
            .where(eq(media.id, id))
        }
      })

      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(SCOPES.MEDIA, PERMISSIONS.READ)
    .input(z.object({ mediaGroupId: uuidZ }))
    .query(async ({ ctx, input }) =>
      ctx.db
        .select({ id: media.id })
        .from(media)
        .where(
          and(excludeDeleted(media), eq(media.mediaGroupId, input.mediaGroupId))
        )
        .orderBy(asc(media.sortOrder))
    ),

  moveToGroup: rbacProcedure(SCOPES.MEDIA, PERMISSIONS.UPDATE)
    .input(
      z.object({
        id: uuidZ,
        targetMediaGroupId: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: media.id, mediaGroupId: media.mediaGroupId })
        .from(media)
        .where(and(eq(media.id, input.id), excludeDeleted(media)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Medya bulunamadı' })
      }

      if (existing.mediaGroupId === input.targetMediaGroupId) {
        return { id: input.id }
      }

      const groupExists = await ctx.db
        .select({ id: mediaGroup.id })
        .from(mediaGroup)
        .where(
          and(
            eq(mediaGroup.id, input.targetMediaGroupId),
            excludeDeleted(mediaGroup)
          )
        )
        .limit(1)
        .then((r) => r[0])

      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Medya grubu bulunamadı',
        })
      }

      const nextSortOrder = await ctx.db
        .select({ sortOrder: media.sortOrder })
        .from(media)
        .where(
          and(
            excludeDeleted(media),
            eq(media.mediaGroupId, input.targetMediaGroupId)
          )
        )
        .orderBy(desc(media.sortOrder))
        .limit(1)
        .then((r) => (r[0]?.sortOrder ?? -1) + 1)

      await ctx.db
        .update(media)
        .set({
          mediaGroupId: input.targetMediaGroupId,
          sortOrder: nextSortOrder,
        })
        .where(eq(media.id, input.id))

      return { id: input.id }
    }),
})
