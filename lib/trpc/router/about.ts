import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, ne } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { normalizeBlogContent } from '@/lib/blog/content'
import type { DB } from '@/lib/db'
import { about, file, PERMISSIONS, SCOPES } from '@/lib/db/schema'
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

const aboutContentInput = z.object({
  type: z.literal('doc'),
  version: z.literal(1).default(1),
  html: z.string().trim().min(1, 'İçerik gerekli'),
  imageFileIds: z.array(uuidZ).default([]),
  videoFileIds: z.array(uuidZ).default([]),
})

const aboutFormInput = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  slug: z.string().trim().min(1, 'Slug gerekli'),
  content: aboutContentInput,
  isPublished: z.boolean().optional(),
  publishedAt: z.date().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  robotsIndex: z.boolean().optional(),
})

async function assertContentFilesExist(
  db: DB,
  content: z.infer<typeof aboutContentInput>
) {
  const fileIds = [
    ...new Set([...content.imageFileIds, ...content.videoFileIds]),
  ]
  if (fileIds.length === 0) return
  const existing = await db
    .select({ id: file.id })
    .from(file)
    .where(and(inArray(file.id, fileIds), eq(file.isDeleted, false)))
  if (existing.length !== fileIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'İçerikteki bazı dosyalar bulunamadı',
    })
  }
}

export const aboutRouter = router({
  getPublished: publicProcedure.query(async ({ ctx }) => {
    const row = await ctx.db
      .select({
        id: about.id,
        title: about.title,
        slug: about.slug,
        content: about.content,
        seoTitle: about.seoTitle,
        seoDescription: about.seoDescription,
        robotsIndex: about.robotsIndex,
        updatedAt: about.updatedAt,
      })
      .from(about)
      .where(and(excludeDeleted(about), eq(about.isPublished, true)))
      .orderBy(desc(about.updatedAt))
      .limit(1)
      .then((rows) => rows[0] ?? null)

    if (!row) return null

    const normalized = normalizeBlogContent(row.content)
    const contentFileIds = [
      ...new Set([...normalized.imageFileIds, ...normalized.videoFileIds]),
    ]
    const allowedContentIds =
      contentFileIds.length > 0
        ? await ctx.db
            .select({ id: file.id })
            .from(file)
            .where(
              and(inArray(file.id, contentFileIds), eq(file.isDeleted, false))
            )
            .then((items) => new Set(items.map((item) => item.id)))
        : new Set<string>()

    return {
      ...row,
      content: normalizeBlogContent(row.content, {
        allowedImageFileIds: allowedContentIds,
        allowedVideoFileIds: allowedContentIds,
        stripEditorChrome: true,
      }),
    }
  }),

  list: rbacProcedure(SCOPES.ABOUT, PERMISSIONS.READ)
    .input(createAdminListSchema(['title', 'slug', 'sortOrder', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(about)]

      if (search) {
        conditions.push(
          createMultiColumnSearch([about.title, about.slug], search)
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        title: about.title,
        slug: about.slug,
        sortOrder: about.sortOrder,
        createdAt: about.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        title: about.title,
        slug: about.slug,
        sortOrder: about.sortOrder,
        createdAt: about.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: about.id,
            title: about.title,
            slug: about.slug,
            content: about.content,
            isPublished: about.isPublished,
            publishedAt: about.publishedAt,
            sortOrder: about.sortOrder,
            createdAt: about.createdAt,
            updatedAt: about.updatedAt,
            seoTitle: about.seoTitle,
            seoDescription: about.seoDescription,
            robotsIndex: about.robotsIndex,
          })
          .from(about)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db.select({ count: count() }).from(about).where(whereCondition),
      ])

      const contentFileIds = rows.flatMap((row) => {
        const normalized = normalizeBlogContent(row.content)
        return [...normalized.imageFileIds, ...normalized.videoFileIds]
      })
      const uniqueContentIds = [...new Set(contentFileIds)]
      const allowedContentIds =
        uniqueContentIds.length > 0
          ? await ctx.db
              .select({ id: file.id })
              .from(file)
              .where(
                and(
                  inArray(file.id, uniqueContentIds),
                  eq(file.isDeleted, false)
                )
              )
              .then((items) => new Set(items.map((item) => item.id)))
          : new Set<string>()

      const data = rows.map((row) => ({
        ...row,
        content: normalizeBlogContent(row.content, {
          allowedImageFileIds: allowedContentIds,
          allowedVideoFileIds: allowedContentIds,
        }),
      }))

      return paginatedListResponse(
        data,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  listReorderScope: rbacProcedure(SCOPES.ABOUT, PERMISSIONS.READ).query(
    async ({ ctx }) =>
      ctx.db
        .select({ id: about.id })
        .from(about)
        .where(excludeDeleted(about))
        .orderBy(asc(about.sortOrder), desc(about.createdAt))
  ),

  getById: rbacProcedure(SCOPES.ABOUT, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: about.id,
          title: about.title,
          slug: about.slug,
          content: about.content,
          isPublished: about.isPublished,
          publishedAt: about.publishedAt,
          sortOrder: about.sortOrder,
          createdAt: about.createdAt,
          updatedAt: about.updatedAt,
          seoTitle: about.seoTitle,
          seoDescription: about.seoDescription,
          robotsIndex: about.robotsIndex,
        })
        .from(about)
        .where(and(eq(about.id, input.id), excludeDeleted(about)))
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hakkımızda kaydı bulunamadı',
        })
      }

      const normalized = normalizeBlogContent(row.content)
      const contentFileIds = [
        ...new Set([...normalized.imageFileIds, ...normalized.videoFileIds]),
      ]
      const allowedContentIds =
        contentFileIds.length > 0
          ? await ctx.db
              .select({ id: file.id })
              .from(file)
              .where(
                and(inArray(file.id, contentFileIds), eq(file.isDeleted, false))
              )
              .then((items) => new Set(items.map((item) => item.id)))
          : new Set<string>()

      return {
        ...row,
        content: normalizeBlogContent(row.content, {
          allowedImageFileIds: allowedContentIds,
          allowedVideoFileIds: allowedContentIds,
        }),
      }
    }),

  create: rbacProcedure(SCOPES.ABOUT, PERMISSIONS.CREATE)
    .input(aboutFormInput)
    .mutation(async ({ ctx, input }) => {
      await assertContentFilesExist(ctx.db, input.content)
      const shouldPublish = input.isPublished ?? false
      const publishedAt = shouldPublish
        ? (input.publishedAt ?? new Date())
        : null

      const inserted = await ctx.db.transaction(async (tx) => {
        if (shouldPublish) {
          await tx
            .update(about)
            .set({ isPublished: false, publishedAt: null })
            .where(and(excludeDeleted(about), eq(about.isPublished, true)))
        }

        const [created] = await tx
          .insert(about)
          .values({
            title: input.title.trim(),
            slug: input.slug.trim(),
            content: {
              type: 'doc',
              version: 1,
              html: input.content.html.trim(),
              imageFileIds: [...new Set(input.content.imageFileIds)],
              videoFileIds: [...new Set(input.content.videoFileIds)],
            },
            isPublished: shouldPublish,
            publishedAt,
            sortOrder: await tx
              .select({ sortOrder: about.sortOrder })
              .from(about)
              .where(excludeDeleted(about))
              .orderBy(desc(about.sortOrder))
              .limit(1)
              .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
            seoTitle: input.seoTitle?.trim() || null,
            seoDescription: input.seoDescription?.trim() || null,
            robotsIndex: input.robotsIndex ?? true,
          })
          .returning({ id: about.id })
        return created
      })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Hakkımızda kaydı oluşturulamadı',
        })
      }
      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.ABOUT, PERMISSIONS.UPDATE)
    .input(aboutFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: about.id })
        .from(about)
        .where(and(eq(about.id, input.id), excludeDeleted(about)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hakkımızda kaydı bulunamadı',
        })
      }

      await assertContentFilesExist(ctx.db, input.content)
      const shouldPublish = input.isPublished ?? false
      const publishedAt = shouldPublish
        ? (input.publishedAt ?? new Date())
        : null

      await ctx.db.transaction(async (tx) => {
        if (shouldPublish) {
          await tx
            .update(about)
            .set({ isPublished: false, publishedAt: null })
            .where(
              and(
                excludeDeleted(about),
                eq(about.isPublished, true),
                ne(about.id, input.id)
              )
            )
        }

        await tx
          .update(about)
          .set({
            title: input.title.trim(),
            slug: input.slug.trim(),
            content: {
              type: 'doc',
              version: 1,
              html: input.content.html.trim(),
              imageFileIds: [...new Set(input.content.imageFileIds)],
              videoFileIds: [...new Set(input.content.videoFileIds)],
            },
            isPublished: shouldPublish,
            publishedAt,
            seoTitle: input.seoTitle?.trim() || null,
            seoDescription: input.seoDescription?.trim() || null,
            robotsIndex: input.robotsIndex ?? true,
          })
          .where(eq(about.id, input.id))
      })

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.ABOUT, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: about.id })
        .from(about)
        .where(and(eq(about.id, input.id), excludeDeleted(about)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hakkımızda kaydı bulunamadı',
        })
      }
      await ctx.db
        .update(about)
        .set(ctx.audit.softDelete(about))
        .where(eq(about.id, input.id))
      return { ok: true as const }
    }),

  reorder: rbacProcedure(SCOPES.ABOUT, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: about.id })
        .from(about)
        .where(excludeDeleted(about))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm hakkımızda kayıtlarını içermelidir',
        })
      }
      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz hakkımızda id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(about)
            .set({ sortOrder: index })
            .where(eq(about.id, id))
        }
      })
      return { ok: true as const }
    }),
})
