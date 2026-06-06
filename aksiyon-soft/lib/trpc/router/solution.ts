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
import {
  file,
  PERMISSIONS,
  SCOPES,
  solution,
  solutionGroup,
  solutionTechnology,
  solutionTechnologyLink,
} from '@/lib/db/schema'
import {
  extractBlogImageFileIdsFromHtml,
  extractBlogVideoFileIdsFromHtml,
  normalizeBlogContent,
} from '@/lib/blog/content'
import type { DB } from '@/lib/db'
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

const solutionContentInput = z.object({
  type: z.literal('doc'),
  version: z.literal(1).default(1),
  html: z.string().trim().min(1, 'İçerik gerekli'),
  imageFileIds: z.array(uuidZ).default([]),
  videoFileIds: z.array(uuidZ).default([]),
})

const solutionFormInput = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  slug: z.string().trim().min(1, 'Slug gerekli'),
  excerpt: z.string().optional().nullable(),
  content: solutionContentInput,
  groupId: z.union([uuidZ, z.null()]).optional(),
  technologyIds: z.array(uuidZ).default([]),
  fileId: z.union([uuidZ, z.null()]).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.date().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  robotsIndex: z.boolean().optional(),
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

async function assertTechnologiesExist(db: DB, technologyIds: string[]) {
  if (technologyIds.length === 0) return
  const rows = await db
    .select({ id: solutionTechnology.id })
    .from(solutionTechnology)
    .where(
      and(
        inArray(solutionTechnology.id, technologyIds),
        excludeDeleted(solutionTechnology)
      )
    )
  if (rows.length !== technologyIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Bazı teknoloji kayıtları bulunamadı',
    })
  }
}

async function replaceTechnologyLinks(
  db: DB,
  solutionId: string,
  technologyIds: string[]
) {
  await db
    .delete(solutionTechnologyLink)
    .where(eq(solutionTechnologyLink.solutionId, solutionId))
  if (technologyIds.length === 0) return
  await db.insert(solutionTechnologyLink).values(
    technologyIds.map((technologyId) => ({
      solutionId,
      technologyId,
    }))
  )
}

async function loadTechnologyIdsForSolutions(
  db: DB,
  solutionIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (solutionIds.length === 0) return map
  const links = await db
    .select({
      solutionId: solutionTechnologyLink.solutionId,
      technologyId: solutionTechnologyLink.technologyId,
    })
    .from(solutionTechnologyLink)
    .where(inArray(solutionTechnologyLink.solutionId, solutionIds))

  for (const row of links) {
    const list = map.get(row.solutionId) ?? []
    list.push(row.technologyId)
    map.set(row.solutionId, list)
  }
  return map
}

async function technologyNameMap(
  db: DB,
  technologyIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (technologyIds.length === 0) return map
  const rows = await db
    .select({ id: solutionTechnology.id, name: solutionTechnology.name })
    .from(solutionTechnology)
    .where(
      and(
        inArray(solutionTechnology.id, technologyIds),
        excludeDeleted(solutionTechnology)
      )
    )
  for (const r of rows) {
    map.set(r.id, r.name)
  }
  return map
}

function namesForIds(ids: string[], nameById: Map<string, string>): string[] {
  return ids
    .map((id) => nameById.get(id))
    .filter((n): n is string => Boolean(n))
}

export const solutionRouter = router({
  listPublic: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: solution.id,
        slug: solution.slug,
        title: solution.title,
        excerpt: solution.excerpt,
        content: solution.content,
        groupName: solutionGroup.name,
        publishedAt: solution.publishedAt,
        fileId: solution.fileId,
        isFeatured: solution.isFeatured,
        seoTitle: solution.seoTitle,
        seoDescription: solution.seoDescription,
        robotsIndex: solution.robotsIndex,
        coverFileAlt: file.altText,
      })
      .from(solution)
      .leftJoin(solutionGroup, eq(solution.groupId, solutionGroup.id))
      .leftJoin(file, eq(solution.fileId, file.id))
      .where(
        and(
          excludeDeleted(solution),
          eq(solution.isPublished, true),
          isNotNull(solution.groupId),
          eq(solution.robotsIndex, true)
        )
      )
      .orderBy(desc(solution.sortOrder), desc(solution.createdAt))

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

    const ids = rows.map((r) => r.id)
    const tagRows =
      ids.length === 0
        ? []
        : await ctx.db
            .select({
              solutionId: solutionTechnologyLink.solutionId,
              name: solutionTechnology.name,
            })
            .from(solutionTechnologyLink)
            .innerJoin(
              solutionTechnology,
              eq(solutionTechnologyLink.technologyId, solutionTechnology.id)
            )
            .where(
              and(
                inArray(solutionTechnologyLink.solutionId, ids),
                excludeDeleted(solutionTechnology)
              )
            )
            .orderBy(
              asc(solutionTechnology.sortOrder),
              asc(solutionTechnology.name)
            )

    const tagsBySolution = new Map<string, string[]>()
    for (const tr of tagRows) {
      const list = tagsBySolution.get(tr.solutionId) ?? []
      list.push(tr.name)
      tagsBySolution.set(tr.solutionId, list)
    }

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? '',
      content: normalizeBlogContent(row.content, {
        allowedImageFileIds: availableContentFileIds,
        allowedVideoFileIds: availableContentFileIds,
        stripEditorChrome: true,
      }),
      sector: row.groupName ?? '',
      tags: tagsBySolution.get(row.id) ?? [],
      imageSrc: row.fileId ? `/api/files/${row.fileId}/view` : undefined,
      date: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : '',
      isFeatured: row.isFeatured,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      robotsIndex: row.robotsIndex,
      coverImageAlt: row.coverFileAlt ?? null,
    }))
  }),

  list: rbacProcedure(SCOPES.SOLUTION, PERMISSIONS.READ)
    .input(createAdminListSchema(['title', 'slug', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(solution)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [
              solution.title,
              solution.slug,
              solution.excerpt,
              solutionGroup.name,
            ],
            search
          )
        )
      }

      applyColumnFilters(
        conditions,
        columnFilters,
        {
          solutionGroupId: solution.groupId,
          title: solution.title,
          slug: solution.slug,
        },
        { exactKeys: ['solutionGroupId'] }
      )

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        title: solution.title,
        slug: solution.slug,
        createdAt: solution.createdAt,
        sortOrder: solution.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: solution.id,
            title: solution.title,
            slug: solution.slug,
            excerpt: solution.excerpt,
            content: solution.content,
            groupId: solution.groupId,
            groupName: solutionGroup.name,
            fileId: solution.fileId,
            fileName: file.originalName,
            isPublished: solution.isPublished,
            isFeatured: solution.isFeatured,
            viewCount: solution.viewCount,
            publishedAt: solution.publishedAt,
            sortOrder: solution.sortOrder,
            createdAt: solution.createdAt,
            updatedAt: solution.updatedAt,
            seoTitle: solution.seoTitle,
            seoDescription: solution.seoDescription,
            robotsIndex: solution.robotsIndex,
          })
          .from(solution)
          .leftJoin(solutionGroup, eq(solution.groupId, solutionGroup.id))
          .leftJoin(file, eq(solution.fileId, file.id))
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(solution)
          .leftJoin(solutionGroup, eq(solution.groupId, solutionGroup.id))
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

      const techMap = await loadTechnologyIdsForSolutions(
        ctx.db,
        rows.map((r) => r.id)
      )
      const allTechIds = [...new Set([...techMap.values()].flat())]
      const nameById = await technologyNameMap(ctx.db, allTechIds)

      const data = rows.map((row) => {
        const technologyIds = techMap.get(row.id) ?? []
        return {
          ...row,
          content: normalizeBlogContent(row.content, {
            allowedImageFileIds: availableContentFileIds,
            allowedVideoFileIds: availableContentFileIds,
          }),
          fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
          technologyIds,
          technologyNames: namesForIds(technologyIds, nameById),
        }
      })

      return paginatedListResponse(
        data,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.SOLUTION, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: solution.id,
          title: solution.title,
          slug: solution.slug,
          excerpt: solution.excerpt,
          content: solution.content,
          groupId: solution.groupId,
          groupName: solutionGroup.name,
          fileId: solution.fileId,
          isPublished: solution.isPublished,
          isFeatured: solution.isFeatured,
          viewCount: solution.viewCount,
          publishedAt: solution.publishedAt,
          sortOrder: solution.sortOrder,
          createdAt: solution.createdAt,
          updatedAt: solution.updatedAt,
          seoTitle: solution.seoTitle,
          seoDescription: solution.seoDescription,
          robotsIndex: solution.robotsIndex,
          coverImageAlt: file.altText,
        })
        .from(solution)
        .leftJoin(solutionGroup, eq(solution.groupId, solutionGroup.id))
        .leftJoin(file, eq(solution.fileId, file.id))
        .where(and(eq(solution.id, input.id), excludeDeleted(solution)))
        .limit(1)
        .then((result) => result[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm bulunamadı',
        })
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

      const techMap = await loadTechnologyIdsForSolutions(ctx.db, [row.id])
      const technologyIds = techMap.get(row.id) ?? []
      const nameById = await technologyNameMap(ctx.db, technologyIds)

      return {
        ...row,
        content: normalizeBlogContent(row.content, {
          allowedImageFileIds: availableContentFileIds,
          allowedVideoFileIds: availableContentFileIds,
        }),
        fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
        technologyIds,
        technologyNames: namesForIds(technologyIds, nameById),
      }
    }),

  create: rbacProcedure(SCOPES.SOLUTION, PERMISSIONS.CREATE)
    .input(solutionFormInput)
    .mutation(async ({ ctx, input }) => {
      if (!input.groupId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Çözüm grubu seçilmelidir',
        })
      }
      const groupExists = await ctx.db
        .select({ id: solutionGroup.id })
        .from(solutionGroup)
        .where(
          and(
            eq(solutionGroup.id, input.groupId),
            excludeDeleted(solutionGroup)
          )
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Çözüm grubu bulunamadı',
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

      await assertTechnologiesExist(ctx.db, input.technologyIds)

      const [inserted] = await ctx.db
        .insert(solution)
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
          groupId: input.groupId ?? null,
          fileId: input.fileId ?? null,
          isPublished: input.isPublished ?? false,
          isFeatured: input.isFeatured ?? false,
          publishedAt: input.publishedAt ?? null,
          sortOrder: await ctx.db
            .select({ sortOrder: solution.sortOrder })
            .from(solution)
            .where(excludeDeleted(solution))
            .orderBy(desc(solution.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          robotsIndex: input.robotsIndex ?? true,
        })
        .returning({ id: solution.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Çözüm oluşturulamadı',
        })
      }

      await replaceTechnologyLinks(ctx.db, inserted.id, input.technologyIds)

      if (input.fileId && input.coverImageAlt !== undefined) {
        await ctx.db
          .update(file)
          .set({ altText: input.coverImageAlt?.trim() || null })
          .where(eq(file.id, input.fileId))
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.SOLUTION, PERMISSIONS.UPDATE)
    .input(solutionFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solution.id })
        .from(solution)
        .where(and(eq(solution.id, input.id), excludeDeleted(solution)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm bulunamadı',
        })
      }

      if (!input.groupId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Çözüm grubu seçilmelidir',
        })
      }
      const groupExists = await ctx.db
        .select({ id: solutionGroup.id })
        .from(solutionGroup)
        .where(
          and(
            eq(solutionGroup.id, input.groupId),
            excludeDeleted(solutionGroup)
          )
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Çözüm grubu bulunamadı',
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

      await assertTechnologiesExist(ctx.db, input.technologyIds)

      await ctx.db
        .update(solution)
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
          groupId: input.groupId ?? null,
          fileId: input.fileId ?? null,
          isPublished: input.isPublished ?? false,
          isFeatured: input.isFeatured ?? false,
          publishedAt: input.publishedAt ?? null,
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          robotsIndex: input.robotsIndex ?? true,
        })
        .where(eq(solution.id, input.id))

      await replaceTechnologyLinks(ctx.db, input.id, input.technologyIds)

      if (input.fileId && input.coverImageAlt !== undefined) {
        await ctx.db
          .update(file)
          .set({ altText: input.coverImageAlt?.trim() || null })
          .where(eq(file.id, input.fileId))
      }

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.SOLUTION, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solution.id })
        .from(solution)
        .where(and(eq(solution.id, input.id), excludeDeleted(solution)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm bulunamadı',
        })
      }
      await ctx.db
        .update(solution)
        .set(ctx.audit.softDelete(solution))
        .where(eq(solution.id, input.id))
      return { ok: true as const }
    }),

  reorder: rbacProcedure(SCOPES.SOLUTION, PERMISSIONS.UPDATE)
    .input(
      z.object({
        groupId: z.union([uuidZ, z.null()]),
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conditions = [excludeDeleted(solution)]
      if (input.groupId) {
        conditions.push(eq(solution.groupId, input.groupId))
      } else {
        conditions.push(isNull(solution.groupId))
      }

      const existing = await ctx.db
        .select({ id: solution.id })
        .from(solution)
        .where(and(...conditions))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm çözüm kayıtlarını içermelidir',
        })
      }
      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz çözüm id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(solution)
            .set({ sortOrder: index })
            .where(
              and(eq(solution.id, id), inArray(solution.id, input.orderedIds))
            )
        }
      })
      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(SCOPES.SOLUTION, PERMISSIONS.READ)
    .input(z.object({ solutionGroupId: uuidZ }))
    .query(async ({ ctx, input }) =>
      ctx.db
        .select({ id: solution.id })
        .from(solution)
        .where(
          and(
            excludeDeleted(solution),
            eq(solution.groupId, input.solutionGroupId)
          )
        )
        .orderBy(asc(solution.sortOrder))
    ),

  moveToGroup: rbacProcedure(SCOPES.SOLUTION, PERMISSIONS.UPDATE)
    .input(
      z.object({
        id: uuidZ,
        solutionGroupId: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: solution.id, groupId: solution.groupId })
        .from(solution)
        .where(and(eq(solution.id, input.id), excludeDeleted(solution)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm bulunamadı',
        })
      }

      if (existing.groupId === input.solutionGroupId) {
        return { id: input.id }
      }

      const groupExists = await ctx.db
        .select({ id: solutionGroup.id })
        .from(solutionGroup)
        .where(
          and(
            eq(solutionGroup.id, input.solutionGroupId),
            excludeDeleted(solutionGroup)
          )
        )
        .limit(1)
        .then((r) => r[0])

      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Çözüm grubu bulunamadı',
        })
      }

      const nextSortOrder = await ctx.db
        .select({ sortOrder: solution.sortOrder })
        .from(solution)
        .where(
          and(
            excludeDeleted(solution),
            eq(solution.groupId, input.solutionGroupId)
          )
        )
        .orderBy(desc(solution.sortOrder))
        .limit(1)
        .then((r) => (r[0]?.sortOrder ?? -1) + 1)

      await ctx.db
        .update(solution)
        .set({
          groupId: input.solutionGroupId,
          sortOrder: nextSortOrder,
        })
        .where(eq(solution.id, input.id))

      return { id: input.id }
    }),
})
