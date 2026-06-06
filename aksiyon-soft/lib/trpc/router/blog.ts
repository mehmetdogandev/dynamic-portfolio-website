import { TRPCError } from '@trpc/server'
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
} from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { blog, blogCategory, file, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  extractBlogImageFileIdsFromHtml,
  extractBlogVideoFileIdsFromHtml,
  normalizeBlogContent,
} from '@/lib/blog/content'
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

const blogContentInput = z.object({
  type: z.literal('doc'),
  version: z.literal(1).default(1),
  html: z.string().trim().min(1, 'İçerik gerekli'),
  imageFileIds: z.array(uuidZ).default([]),
  videoFileIds: z.array(uuidZ).default([]),
})

const blogFormInput = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  slug: z.string().trim().min(1, 'Slug gerekli'),
  excerpt: z.string().optional().nullable(),
  content: blogContentInput,
  categoryId: z.union([uuidZ, z.null()]).optional(),
  fileId: z.union([uuidZ, z.null()]).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.date().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  robotsIndex: z.boolean().optional(),
  /** Kapak `file` kaydı için `alt_text` senkronu */
  coverImageAlt: z.string().optional().nullable(),
})

function extractContentFileIds(content: {
  html: string
  imageFileIds?: string[]
  videoFileIds?: string[]
}) {
  const imageFileIds = [
    ...new Set(extractBlogImageFileIdsFromHtml(content.html)),
  ]
  const videoFileIds = [
    ...new Set(extractBlogVideoFileIdsFromHtml(content.html)),
  ]
  return { imageFileIds, videoFileIds }
}

export const blogRouter = router({
  listPublic: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        category: blogCategory.name,
        publishedAt: blog.publishedAt,
        fileId: blog.fileId,
        seoTitle: blog.seoTitle,
        seoDescription: blog.seoDescription,
        robotsIndex: blog.robotsIndex,
        coverFileAlt: file.altText,
      })
      .from(blog)
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .leftJoin(file, eq(blog.fileId, file.id))
      .where(
        and(
          excludeDeleted(blog),
          eq(blog.isPublished, true),
          isNotNull(blog.categoryId),
          eq(blog.robotsIndex, true)
        )
      )
      .orderBy(desc(blog.sortOrder), desc(blog.createdAt))

    const contentFileIds = rows.flatMap((row) => {
      const normalized = normalizeBlogContent(row.content)
      return [...normalized.imageFileIds, ...normalized.videoFileIds]
    })
    const uniqueContentFileIds = [...new Set(contentFileIds)]
    const availableContentFileIds =
      uniqueContentFileIds.length > 0
        ? await ctx.db
            .select({ id: file.id })
            .from(file)
            .where(
              and(
                inArray(file.id, uniqueContentFileIds),
                eq(file.isDeleted, false)
              )
            )
            .then((items) => new Set(items.map((item) => item.id)))
        : new Set<string>()

    return rows.map((row) => ({
      content: normalizeBlogContent(row.content, {
        allowedImageFileIds: availableContentFileIds,
        allowedVideoFileIds: availableContentFileIds,
        stripEditorChrome: true,
      }),
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? '',
      date: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : '',
      category: row.category ?? '',
      imageSrc: row.fileId ? `/api/files/${row.fileId}/view` : undefined,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      robotsIndex: row.robotsIndex,
      coverImageAlt: row.coverFileAlt ?? null,
    }))
  }),

  list: rbacProcedure(SCOPES.BLOG, PERMISSIONS.READ)
    .input(createAdminListSchema(['title', 'slug', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(blog)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [blog.title, blog.slug, blog.excerpt, blogCategory.name],
            search
          )
        )
      }

      applyColumnFilters(
        conditions,
        columnFilters,
        {
          categoryId: blog.categoryId,
          title: blog.title,
          slug: blog.slug,
        },
        { exactKeys: ['categoryId'] }
      )

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        title: blog.title,
        slug: blog.slug,
        createdAt: blog.createdAt,
        sortOrder: blog.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: blog.id,
            title: blog.title,
            slug: blog.slug,
            excerpt: blog.excerpt,
            content: blog.content,
            categoryId: blog.categoryId,
            categoryName: blogCategory.name,
            fileId: blog.fileId,
            fileName: file.originalName,
            isPublished: blog.isPublished,
            isFeatured: blog.isFeatured,
            viewCount: blog.viewCount,
            publishedAt: blog.publishedAt,
            sortOrder: blog.sortOrder,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
            seoTitle: blog.seoTitle,
            seoDescription: blog.seoDescription,
            robotsIndex: blog.robotsIndex,
          })
          .from(blog)
          .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
          .leftJoin(file, eq(blog.fileId, file.id))
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(blog)
          .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
          .where(whereCondition),
      ])

      const contentFileIds = rows.flatMap((row) => {
        const normalized = normalizeBlogContent(row.content)
        return [...normalized.imageFileIds, ...normalized.videoFileIds]
      })
      const uniqueContentFileIds = [...new Set(contentFileIds)]
      const availableContentFileIds =
        uniqueContentFileIds.length > 0
          ? await ctx.db
              .select({ id: file.id })
              .from(file)
              .where(
                and(
                  inArray(file.id, uniqueContentFileIds),
                  eq(file.isDeleted, false)
                )
              )
              .then((items) => new Set(items.map((item) => item.id)))
          : new Set<string>()

      const data = rows.map((row) => ({
        ...row,
        content: normalizeBlogContent(row.content, {
          allowedImageFileIds: availableContentFileIds,
          allowedVideoFileIds: availableContentFileIds,
        }),
        fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
      }))

      return paginatedListResponse(
        data,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.BLOG, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          content: blog.content,
          categoryId: blog.categoryId,
          fileId: blog.fileId,
          isPublished: blog.isPublished,
          isFeatured: blog.isFeatured,
          viewCount: blog.viewCount,
          publishedAt: blog.publishedAt,
          sortOrder: blog.sortOrder,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
          seoTitle: blog.seoTitle,
          seoDescription: blog.seoDescription,
          robotsIndex: blog.robotsIndex,
          coverImageAlt: file.altText,
        })
        .from(blog)
        .leftJoin(file, eq(blog.fileId, file.id))
        .where(and(eq(blog.id, input.id), excludeDeleted(blog)))
        .limit(1)
        .then((result) => result[0])

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Blog bulunamadı' })
      }
      const normalizedContent = normalizeBlogContent(row.content)
      const contentFileIds = [
        ...normalizedContent.imageFileIds,
        ...normalizedContent.videoFileIds,
      ]
      const uniqueContentFileIds = [...new Set(contentFileIds)]
      const availableContentFileIds =
        uniqueContentFileIds.length > 0
          ? await ctx.db
              .select({ id: file.id })
              .from(file)
              .where(
                and(
                  inArray(file.id, uniqueContentFileIds),
                  eq(file.isDeleted, false)
                )
              )
              .then((items) => new Set(items.map((item) => item.id)))
          : new Set<string>()

      return {
        ...row,
        content: normalizeBlogContent(row.content, {
          allowedImageFileIds: availableContentFileIds,
          allowedVideoFileIds: availableContentFileIds,
        }),
        fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
      }
    }),

  create: rbacProcedure(SCOPES.BLOG, PERMISSIONS.CREATE)
    .input(blogFormInput)
    .mutation(async ({ ctx, input }) => {
      if (!input.categoryId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Blog türü seçilmelidir',
        })
      }
      const categoryExists = await ctx.db
        .select({ id: blogCategory.id })
        .from(blogCategory)
        .where(
          and(
            eq(blogCategory.id, input.categoryId),
            excludeDeleted(blogCategory)
          )
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!categoryExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Blog türü bulunamadı',
        })
      }

      if (input.fileId) {
        const fileExists = await ctx.db
          .select({ id: file.id })
          .from(file)
          .where(and(eq(file.id, input.fileId), eq(file.isDeleted, false)))
          .limit(1)
          .then((rows) => rows[0])
        if (!fileExists) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Dosya bulunamadı',
          })
        }
      }

      const contentFileIds = extractContentFileIds(input.content)
      const referencedFileIds = [
        ...new Set([
          ...contentFileIds.imageFileIds,
          ...contentFileIds.videoFileIds,
        ]),
      ]
      if (referencedFileIds.length > 0) {
        const existingFiles = await ctx.db
          .select({ id: file.id })
          .from(file)
          .where(
            and(inArray(file.id, referencedFileIds), eq(file.isDeleted, false))
          )
        if (existingFiles.length !== referencedFileIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'İçerikteki bazı dosyalar bulunamadı',
          })
        }
      }

      const [inserted] = await ctx.db
        .insert(blog)
        .values({
          title: input.title.trim(),
          slug: input.slug.trim(),
          excerpt: input.excerpt?.trim() || null,
          content: {
            type: 'doc',
            version: 1,
            html: input.content.html.trim(),
            imageFileIds: contentFileIds.imageFileIds,
            videoFileIds: contentFileIds.videoFileIds,
          },
          categoryId: input.categoryId ?? null,
          fileId: input.fileId ?? null,
          isPublished: input.isPublished ?? false,
          isFeatured: input.isFeatured ?? false,
          publishedAt: input.publishedAt ?? null,
          sortOrder: await ctx.db
            .select({ sortOrder: blog.sortOrder })
            .from(blog)
            .where(excludeDeleted(blog))
            .orderBy(desc(blog.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          robotsIndex: input.robotsIndex ?? true,
        })
        .returning({ id: blog.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Blog oluşturulamadı',
        })
      }

      if (input.fileId && input.coverImageAlt !== undefined) {
        await ctx.db
          .update(file)
          .set({ altText: input.coverImageAlt?.trim() || null })
          .where(eq(file.id, input.fileId))
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.BLOG, PERMISSIONS.UPDATE)
    .input(blogFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: blog.id })
        .from(blog)
        .where(and(eq(blog.id, input.id), excludeDeleted(blog)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Blog bulunamadı' })
      }

      if (!input.categoryId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Blog türü seçilmelidir',
        })
      }
      const categoryExists = await ctx.db
        .select({ id: blogCategory.id })
        .from(blogCategory)
        .where(
          and(
            eq(blogCategory.id, input.categoryId),
            excludeDeleted(blogCategory)
          )
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!categoryExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Blog türü bulunamadı',
        })
      }

      if (input.fileId) {
        const fileExists = await ctx.db
          .select({ id: file.id })
          .from(file)
          .where(and(eq(file.id, input.fileId), eq(file.isDeleted, false)))
          .limit(1)
          .then((rows) => rows[0])
        if (!fileExists) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Dosya bulunamadı',
          })
        }
      }

      const contentFileIds = extractContentFileIds(input.content)
      const referencedFileIds = [
        ...new Set([
          ...contentFileIds.imageFileIds,
          ...contentFileIds.videoFileIds,
        ]),
      ]
      if (referencedFileIds.length > 0) {
        const existingFiles = await ctx.db
          .select({ id: file.id })
          .from(file)
          .where(
            and(inArray(file.id, referencedFileIds), eq(file.isDeleted, false))
          )
        if (existingFiles.length !== referencedFileIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'İçerikteki bazı dosyalar bulunamadı',
          })
        }
      }

      await ctx.db
        .update(blog)
        .set({
          title: input.title.trim(),
          slug: input.slug.trim(),
          excerpt: input.excerpt?.trim() || null,
          content: {
            type: 'doc',
            version: 1,
            html: input.content.html.trim(),
            imageFileIds: contentFileIds.imageFileIds,
            videoFileIds: contentFileIds.videoFileIds,
          },
          categoryId: input.categoryId ?? null,
          fileId: input.fileId ?? null,
          isPublished: input.isPublished ?? false,
          isFeatured: input.isFeatured ?? false,
          publishedAt: input.publishedAt ?? null,
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          robotsIndex: input.robotsIndex ?? true,
        })
        .where(eq(blog.id, input.id))

      if (input.fileId && input.coverImageAlt !== undefined) {
        await ctx.db
          .update(file)
          .set({ altText: input.coverImageAlt?.trim() || null })
          .where(eq(file.id, input.fileId))
      }

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.BLOG, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: blog.id })
        .from(blog)
        .where(and(eq(blog.id, input.id), excludeDeleted(blog)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Blog bulunamadı' })
      }
      await ctx.db
        .update(blog)
        .set(ctx.audit.softDelete(blog))
        .where(eq(blog.id, input.id))
      return { ok: true as const }
    }),

  reorder: rbacProcedure(SCOPES.BLOG, PERMISSIONS.UPDATE)
    .input(
      z.object({
        categoryId: z.union([uuidZ, z.null()]),
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conditions = [excludeDeleted(blog)]
      if (input.categoryId) {
        conditions.push(eq(blog.categoryId, input.categoryId))
      } else {
        conditions.push(isNull(blog.categoryId))
      }

      const existing = await ctx.db
        .select({ id: blog.id })
        .from(blog)
        .where(and(...conditions))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm blog kayıtlarını içermelidir',
        })
      }
      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz blog id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(blog)
            .set({ sortOrder: index })
            .where(and(eq(blog.id, id), inArray(blog.id, input.orderedIds)))
        }
      })
      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(SCOPES.BLOG, PERMISSIONS.READ)
    .input(z.object({ categoryId: uuidZ }))
    .query(async ({ ctx, input }) =>
      ctx.db
        .select({ id: blog.id })
        .from(blog)
        .where(and(excludeDeleted(blog), eq(blog.categoryId, input.categoryId)))
        .orderBy(asc(blog.sortOrder))
    ),

  moveToCategory: rbacProcedure(SCOPES.BLOG, PERMISSIONS.UPDATE)
    .input(
      z.object({
        id: uuidZ,
        categoryId: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: blog.id, categoryId: blog.categoryId })
        .from(blog)
        .where(and(eq(blog.id, input.id), excludeDeleted(blog)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Blog bulunamadı' })
      }

      if (existing.categoryId === input.categoryId) {
        return { id: input.id }
      }

      const categoryExists = await ctx.db
        .select({ id: blogCategory.id })
        .from(blogCategory)
        .where(
          and(
            eq(blogCategory.id, input.categoryId),
            excludeDeleted(blogCategory)
          )
        )
        .limit(1)
        .then((r) => r[0])

      if (!categoryExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Blog türü bulunamadı',
        })
      }

      const nextSortOrder = await ctx.db
        .select({ sortOrder: blog.sortOrder })
        .from(blog)
        .where(and(excludeDeleted(blog), eq(blog.categoryId, input.categoryId)))
        .orderBy(desc(blog.sortOrder))
        .limit(1)
        .then((r) => (r[0]?.sortOrder ?? -1) + 1)

      await ctx.db
        .update(blog)
        .set({
          categoryId: input.categoryId,
          sortOrder: nextSortOrder,
        })
        .where(eq(blog.id, input.id))

      return { id: input.id }
    }),
})
