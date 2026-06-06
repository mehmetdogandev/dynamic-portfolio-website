import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import type { DB } from '@/lib/db'
import { aboutExperience, file, PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const experienceSelect = {
  id: aboutExperience.id,
  title: aboutExperience.title,
  company: aboutExperience.company,
  location: aboutExperience.location,
  startDate: aboutExperience.startDate,
  endDate: aboutExperience.endDate,
  description: aboutExperience.description,
  fileId: aboutExperience.fileId,
  sortOrder: aboutExperience.sortOrder,
  createdAt: aboutExperience.createdAt,
  updatedAt: aboutExperience.updatedAt,
} as const

const experienceFormInput = z.object({
  title: z.string().trim().min(1, 'Başlık gerekli'),
  company: z.string().trim().min(1, 'Şirket gerekli'),
  location: z.string().optional().nullable(),
  startDate: z.string().trim().min(1, 'Başlangıç tarihi gerekli'),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  fileId: z.union([uuidZ, z.null()]).optional(),
})

const experienceListOrder = [
  asc(aboutExperience.sortOrder),
  desc(aboutExperience.createdAt),
] as const

async function assertFileExists(db: DB, fileId: string | null | undefined) {
  if (!fileId) return
  const existing = await db
    .select({ id: file.id })
    .from(file)
    .where(and(eq(file.id, fileId), eq(file.isDeleted, false)))
    .limit(1)
    .then((rows) => rows[0])

  if (!existing) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Dosya bulunamadı',
    })
  }
}

export const aboutExperienceRouter = router({
  list: rbacProcedure(SCOPES.ABOUT_EXPERIENCE, PERMISSIONS.READ)
    .input(
      createAdminListSchema(['title', 'company', 'sortOrder', 'createdAt'])
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(aboutExperience)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [
              aboutExperience.title,
              aboutExperience.company,
              aboutExperience.location,
              aboutExperience.description,
            ],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        title: aboutExperience.title,
        company: aboutExperience.company,
        sortOrder: aboutExperience.sortOrder,
        createdAt: aboutExperience.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        title: aboutExperience.title,
        company: aboutExperience.company,
        sortOrder: aboutExperience.sortOrder,
        createdAt: aboutExperience.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select(experienceSelect)
          .from(aboutExperience)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(aboutExperience)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows.map((row) => ({
          ...row,
          fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
        })),
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  listReorderScope: rbacProcedure(
    SCOPES.ABOUT_EXPERIENCE,
    PERMISSIONS.READ
  ).query(async ({ ctx }) =>
    ctx.db
      .select({ id: aboutExperience.id })
      .from(aboutExperience)
      .where(excludeDeleted(aboutExperience))
      .orderBy(...experienceListOrder)
  ),

  getById: rbacProcedure(SCOPES.ABOUT_EXPERIENCE, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(experienceSelect)
        .from(aboutExperience)
        .where(
          and(eq(aboutExperience.id, input.id), excludeDeleted(aboutExperience))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deneyim kaydı bulunamadı',
        })
      }

      return {
        ...row,
        fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
      }
    }),

  create: rbacProcedure(SCOPES.ABOUT_EXPERIENCE, PERMISSIONS.CREATE)
    .input(experienceFormInput)
    .mutation(async ({ ctx, input }) => {
      await assertFileExists(ctx.db, input.fileId)

      const [inserted] = await ctx.db
        .insert(aboutExperience)
        .values({
          title: input.title.trim(),
          company: input.company.trim(),
          location: input.location?.trim() || null,
          startDate: input.startDate.trim(),
          endDate: input.endDate?.trim() || null,
          description: input.description?.trim() || null,
          fileId: input.fileId ?? null,
          sortOrder: await ctx.db
            .select({ sortOrder: aboutExperience.sortOrder })
            .from(aboutExperience)
            .where(excludeDeleted(aboutExperience))
            .orderBy(desc(aboutExperience.sortOrder))
            .limit(1)
            .then((rows) => (rows[0]?.sortOrder ?? -1) + 1),
        })
        .returning({ id: aboutExperience.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Deneyim kaydı oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.ABOUT_EXPERIENCE, PERMISSIONS.UPDATE)
    .input(experienceFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutExperience.id })
        .from(aboutExperience)
        .where(
          and(eq(aboutExperience.id, input.id), excludeDeleted(aboutExperience))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deneyim kaydı bulunamadı',
        })
      }

      await assertFileExists(ctx.db, input.fileId)

      await ctx.db
        .update(aboutExperience)
        .set({
          title: input.title.trim(),
          company: input.company.trim(),
          location: input.location?.trim() || null,
          startDate: input.startDate.trim(),
          endDate: input.endDate?.trim() || null,
          description: input.description?.trim() || null,
          fileId: input.fileId ?? null,
        })
        .where(eq(aboutExperience.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.ABOUT_EXPERIENCE, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutExperience.id })
        .from(aboutExperience)
        .where(
          and(eq(aboutExperience.id, input.id), excludeDeleted(aboutExperience))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deneyim kaydı bulunamadı',
        })
      }

      await ctx.db
        .update(aboutExperience)
        .set(ctx.audit.softDelete(aboutExperience))
        .where(eq(aboutExperience.id, input.id))

      return { ok: true as const }
    }),

  restore: rbacProcedure(SCOPES.ABOUT_EXPERIENCE, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const [restored] = await ctx.db
        .update(aboutExperience)
        .set({ deletedAt: null, deletedBy: null })
        .where(
          and(
            eq(aboutExperience.id, input.id),
            isNotNull(aboutExperience.deletedAt)
          )
        )
        .returning({ id: aboutExperience.id })

      if (!restored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Geri alınacak deneyim kaydı bulunamadı',
        })
      }

      return { id: restored.id }
    }),

  reorder: rbacProcedure(SCOPES.ABOUT_EXPERIENCE, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: aboutExperience.id })
        .from(aboutExperience)
        .where(excludeDeleted(aboutExperience))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm deneyim kayıtlarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz deneyim id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(aboutExperience)
            .set({ sortOrder: index })
            .where(
              and(
                eq(aboutExperience.id, id),
                inArray(aboutExperience.id, input.orderedIds)
              )
            )
        }
      })

      return { ok: true as const }
    }),
})
