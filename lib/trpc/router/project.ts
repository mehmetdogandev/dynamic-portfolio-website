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
  project,
  projectGroup,
  projectTechnology,
  projectTechnologyLink,
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

const projectContentInput = z.object({
  type: z.literal('doc'),
  version: z.literal(1).default(1),
  html: z.string().trim().min(1, 'İçerik gerekli'),
  imageFileIds: z.array(uuidZ).default([]),
  videoFileIds: z.array(uuidZ).default([]),
})

const projectFormInput = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  slug: z.string().trim().min(1, 'Slug gerekli'),
  excerpt: z.string().optional().nullable(),
  content: projectContentInput,
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
    .select({ id: projectTechnology.id })
    .from(projectTechnology)
    .where(
      and(
        inArray(projectTechnology.id, technologyIds),
        excludeDeleted(projectTechnology)
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
  projectId: string,
  technologyIds: string[]
) {
  await db
    .delete(projectTechnologyLink)
    .where(eq(projectTechnologyLink.projectId, projectId))
  if (technologyIds.length === 0) return
  await db.insert(projectTechnologyLink).values(
    technologyIds.map((technologyId) => ({
      projectId,
      technologyId,
    }))
  )
}

async function loadTechnologyIdsForSolutions(
  db: DB,
  projectIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (projectIds.length === 0) return map
  const links = await db
    .select({
      projectId: projectTechnologyLink.projectId,
      technologyId: projectTechnologyLink.technologyId,
    })
    .from(projectTechnologyLink)
    .where(inArray(projectTechnologyLink.projectId, projectIds))

  for (const row of links) {
    const list = map.get(row.projectId) ?? []
    list.push(row.technologyId)
    map.set(row.projectId, list)
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
    .select({ id: projectTechnology.id, name: projectTechnology.name })
    .from(projectTechnology)
    .where(
      and(
        inArray(projectTechnology.id, technologyIds),
        excludeDeleted(projectTechnology)
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

export const projectRouter = router({
  listPublic: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: project.id,
        slug: project.slug,
        title: project.title,
        excerpt: project.excerpt,
        content: project.content,
        groupName: projectGroup.name,
        publishedAt: project.publishedAt,
        fileId: project.fileId,
        isFeatured: project.isFeatured,
        seoTitle: project.seoTitle,
        seoDescription: project.seoDescription,
        robotsIndex: project.robotsIndex,
        coverFileAlt: file.altText,
      })
      .from(project)
      .leftJoin(projectGroup, eq(project.groupId, projectGroup.id))
      .leftJoin(file, eq(project.fileId, file.id))
      .where(
        and(
          excludeDeleted(project),
          eq(project.isPublished, true),
          isNotNull(project.groupId),
          eq(project.robotsIndex, true)
        )
      )
      .orderBy(desc(project.sortOrder), desc(project.createdAt))

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
              projectId: projectTechnologyLink.projectId,
              name: projectTechnology.name,
            })
            .from(projectTechnologyLink)
            .innerJoin(
              projectTechnology,
              eq(projectTechnologyLink.technologyId, projectTechnology.id)
            )
            .where(
              and(
                inArray(projectTechnologyLink.projectId, ids),
                excludeDeleted(projectTechnology)
              )
            )
            .orderBy(
              asc(projectTechnology.sortOrder),
              asc(projectTechnology.name)
            )

    const tagsByProject = new Map<string, string[]>()
    for (const tr of tagRows) {
      const list = tagsByProject.get(tr.projectId) ?? []
      list.push(tr.name)
      tagsByProject.set(tr.projectId, list)
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
      tags: tagsByProject.get(row.id) ?? [],
      imageSrc: row.fileId ? `/api/files/${row.fileId}/view` : undefined,
      date: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : '',
      isFeatured: row.isFeatured,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      robotsIndex: row.robotsIndex,
      coverImageAlt: row.coverFileAlt ?? null,
    }))
  }),

  list: rbacProcedure(SCOPES.PROJECT, PERMISSIONS.READ)
    .input(createAdminListSchema(['title', 'slug', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(project)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [project.title, project.slug, project.excerpt, projectGroup.name],
            search
          )
        )
      }

      applyColumnFilters(
        conditions,
        columnFilters,
        {
          projectGroupId: project.groupId,
          title: project.title,
          slug: project.slug,
        },
        { exactKeys: ['projectGroupId'] }
      )

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        title: project.title,
        slug: project.slug,
        createdAt: project.createdAt,
        sortOrder: project.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: project.id,
            title: project.title,
            slug: project.slug,
            excerpt: project.excerpt,
            content: project.content,
            groupId: project.groupId,
            groupName: projectGroup.name,
            fileId: project.fileId,
            fileName: file.originalName,
            isPublished: project.isPublished,
            isFeatured: project.isFeatured,
            viewCount: project.viewCount,
            publishedAt: project.publishedAt,
            sortOrder: project.sortOrder,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            seoTitle: project.seoTitle,
            seoDescription: project.seoDescription,
            robotsIndex: project.robotsIndex,
          })
          .from(project)
          .leftJoin(projectGroup, eq(project.groupId, projectGroup.id))
          .leftJoin(file, eq(project.fileId, file.id))
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(project)
          .leftJoin(projectGroup, eq(project.groupId, projectGroup.id))
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

  getById: rbacProcedure(SCOPES.PROJECT, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select({
          id: project.id,
          title: project.title,
          slug: project.slug,
          excerpt: project.excerpt,
          content: project.content,
          groupId: project.groupId,
          groupName: projectGroup.name,
          fileId: project.fileId,
          isPublished: project.isPublished,
          isFeatured: project.isFeatured,
          viewCount: project.viewCount,
          publishedAt: project.publishedAt,
          sortOrder: project.sortOrder,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          seoTitle: project.seoTitle,
          seoDescription: project.seoDescription,
          robotsIndex: project.robotsIndex,
          coverImageAlt: file.altText,
        })
        .from(project)
        .leftJoin(projectGroup, eq(project.groupId, projectGroup.id))
        .leftJoin(file, eq(project.fileId, file.id))
        .where(and(eq(project.id, input.id), excludeDeleted(project)))
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

  create: rbacProcedure(SCOPES.PROJECT, PERMISSIONS.CREATE)
    .input(projectFormInput)
    .mutation(async ({ ctx, input }) => {
      if (!input.groupId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Proje grubu seçilmelidir',
        })
      }
      const groupExists = await ctx.db
        .select({ id: projectGroup.id })
        .from(projectGroup)
        .where(
          and(eq(projectGroup.id, input.groupId), excludeDeleted(projectGroup))
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Proje grubu bulunamadı',
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
        .insert(project)
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
            .select({ sortOrder: project.sortOrder })
            .from(project)
            .where(excludeDeleted(project))
            .orderBy(desc(project.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          robotsIndex: input.robotsIndex ?? true,
        })
        .returning({ id: project.id })

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

  update: rbacProcedure(SCOPES.PROJECT, PERMISSIONS.UPDATE)
    .input(projectFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: project.id })
        .from(project)
        .where(and(eq(project.id, input.id), excludeDeleted(project)))
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
          message: 'Proje grubu seçilmelidir',
        })
      }
      const groupExists = await ctx.db
        .select({ id: projectGroup.id })
        .from(projectGroup)
        .where(
          and(eq(projectGroup.id, input.groupId), excludeDeleted(projectGroup))
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Proje grubu bulunamadı',
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
        .update(project)
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
        .where(eq(project.id, input.id))

      await replaceTechnologyLinks(ctx.db, input.id, input.technologyIds)

      if (input.fileId && input.coverImageAlt !== undefined) {
        await ctx.db
          .update(file)
          .set({ altText: input.coverImageAlt?.trim() || null })
          .where(eq(file.id, input.fileId))
      }

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.PROJECT, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: project.id })
        .from(project)
        .where(and(eq(project.id, input.id), excludeDeleted(project)))
        .limit(1)
        .then((rows) => rows[0])
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm bulunamadı',
        })
      }
      await ctx.db
        .update(project)
        .set(ctx.audit.softDelete(project))
        .where(eq(project.id, input.id))
      return { ok: true as const }
    }),

  reorder: rbacProcedure(SCOPES.PROJECT, PERMISSIONS.UPDATE)
    .input(
      z.object({
        groupId: z.union([uuidZ, z.null()]),
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conditions = [excludeDeleted(project)]
      if (input.groupId) {
        conditions.push(eq(project.groupId, input.groupId))
      } else {
        conditions.push(isNull(project.groupId))
      }

      const existing = await ctx.db
        .select({ id: project.id })
        .from(project)
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
            .update(project)
            .set({ sortOrder: index })
            .where(
              and(eq(project.id, id), inArray(project.id, input.orderedIds))
            )
        }
      })
      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(SCOPES.PROJECT, PERMISSIONS.READ)
    .input(z.object({ projectGroupId: uuidZ }))
    .query(async ({ ctx, input }) =>
      ctx.db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            excludeDeleted(project),
            eq(project.groupId, input.projectGroupId)
          )
        )
        .orderBy(asc(project.sortOrder))
    ),

  moveToGroup: rbacProcedure(SCOPES.PROJECT, PERMISSIONS.UPDATE)
    .input(
      z.object({
        id: uuidZ,
        projectGroupId: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: project.id, groupId: project.groupId })
        .from(project)
        .where(and(eq(project.id, input.id), excludeDeleted(project)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Çözüm bulunamadı',
        })
      }

      if (existing.groupId === input.projectGroupId) {
        return { id: input.id }
      }

      const groupExists = await ctx.db
        .select({ id: projectGroup.id })
        .from(projectGroup)
        .where(
          and(
            eq(projectGroup.id, input.projectGroupId),
            excludeDeleted(projectGroup)
          )
        )
        .limit(1)
        .then((r) => r[0])

      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Proje grubu bulunamadı',
        })
      }

      const nextSortOrder = await ctx.db
        .select({ sortOrder: project.sortOrder })
        .from(project)
        .where(
          and(
            excludeDeleted(project),
            eq(project.groupId, input.projectGroupId)
          )
        )
        .orderBy(desc(project.sortOrder))
        .limit(1)
        .then((r) => (r[0]?.sortOrder ?? -1) + 1)

      await ctx.db
        .update(project)
        .set({
          groupId: input.projectGroupId,
          sortOrder: nextSortOrder,
        })
        .where(eq(project.id, input.id))

      return { id: input.id }
    }),
})
