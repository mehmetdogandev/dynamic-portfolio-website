import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, isNotNull, ne } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import {
  homeStatSet,
  homeStatValueSourceEnum,
  PERMISSIONS,
  SCOPES,
  sliderGroupStatusEnum,
} from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const experienceCountSourceZ = z.enum([
  'MANUAL',
  'AUTO_EXPERIENCE_COUNT',
] as const)

const companyCountSourceZ = z.enum(['MANUAL', 'AUTO_REFERENCE_COUNT'] as const)

const statSetSelect = {
  id: homeStatSet.id,
  name: homeStatSet.name,
  status: homeStatSet.status,
  yearsExperienceValue: homeStatSet.yearsExperienceValue,
  yearsExperienceLabel: homeStatSet.yearsExperienceLabel,
  yearsExperienceHref: homeStatSet.yearsExperienceHref,
  experienceCountValue: homeStatSet.experienceCountValue,
  experienceCountLabel: homeStatSet.experienceCountLabel,
  experienceCountHref: homeStatSet.experienceCountHref,
  experienceCountSource: homeStatSet.experienceCountSource,
  companyCountValue: homeStatSet.companyCountValue,
  companyCountLabel: homeStatSet.companyCountLabel,
  companyCountHref: homeStatSet.companyCountHref,
  companyCountSource: homeStatSet.companyCountSource,
  studentsTaughtValue: homeStatSet.studentsTaughtValue,
  studentsTaughtLabel: homeStatSet.studentsTaughtLabel,
  studentsTaughtHref: homeStatSet.studentsTaughtHref,
  publishedAt: homeStatSet.publishedAt,
  createdAt: homeStatSet.createdAt,
  updatedAt: homeStatSet.updatedAt,
} as const

const optionalHrefZ = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v?.length ? v : null))

const statSetFormInput = z
  .object({
    name: z.string().trim().min(1, 'Set adı gerekli'),
    yearsExperienceValue: z.string().trim().min(1, 'Yıl deneyimi değeri gerekli'),
    yearsExperienceLabel: z
      .string()
      .trim()
      .min(1, 'Yıl deneyimi etiketi gerekli'),
    yearsExperienceHref: optionalHrefZ,
    experienceCountValue: z.string().trim(),
    experienceCountLabel: z
      .string()
      .trim()
      .min(1, 'Deneyim sayısı etiketi gerekli'),
    experienceCountHref: optionalHrefZ,
    experienceCountSource: experienceCountSourceZ,
    companyCountValue: z.string().trim(),
    companyCountLabel: z
      .string()
      .trim()
      .min(1, 'Şirket sayısı etiketi gerekli'),
    companyCountHref: optionalHrefZ,
    companyCountSource: companyCountSourceZ,
    studentsTaughtValue: z
      .string()
      .trim()
      .min(1, 'Öğrenci sayısı değeri gerekli'),
    studentsTaughtLabel: z
      .string()
      .trim()
      .min(1, 'Öğrenci sayısı etiketi gerekli'),
    studentsTaughtHref: optionalHrefZ,
  })
  .superRefine((data, ctx) => {
    if (
      data.experienceCountSource === 'MANUAL' &&
      !data.experienceCountValue.trim()
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Manuel modda deneyim sayısı değeri gerekli',
        path: ['experienceCountValue'],
      })
    }
    if (data.companyCountSource === 'MANUAL' && !data.companyCountValue.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Manuel modda şirket sayısı değeri gerekli',
        path: ['companyCountValue'],
      })
    }
  })

function mapFormToDb(input: z.infer<typeof statSetFormInput>) {
  return {
    name: input.name.trim(),
    yearsExperienceValue: input.yearsExperienceValue.trim(),
    yearsExperienceLabel: input.yearsExperienceLabel.trim(),
    yearsExperienceHref: input.yearsExperienceHref,
    experienceCountValue:
      input.experienceCountSource === 'MANUAL'
        ? input.experienceCountValue.trim()
        : '0',
    experienceCountLabel: input.experienceCountLabel.trim(),
    experienceCountHref: input.experienceCountHref,
    experienceCountSource: input.experienceCountSource,
    companyCountValue:
      input.companyCountSource === 'MANUAL'
        ? input.companyCountValue.trim()
        : '0',
    companyCountLabel: input.companyCountLabel.trim(),
    companyCountHref: input.companyCountHref,
    companyCountSource: input.companyCountSource,
    studentsTaughtValue: input.studentsTaughtValue.trim(),
    studentsTaughtLabel: input.studentsTaughtLabel.trim(),
    studentsTaughtHref: input.studentsTaughtHref,
  }
}

export const homeStatSetRouter = router({
  list: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'status', 'createdAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(homeStatSet)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [
              homeStatSet.name,
              homeStatSet.yearsExperienceLabel,
              homeStatSet.experienceCountLabel,
              homeStatSet.companyCountLabel,
              homeStatSet.studentsTaughtLabel,
            ],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: homeStatSet.name,
        status: homeStatSet.status,
        createdAt: homeStatSet.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: homeStatSet.name,
        status: homeStatSet.status,
        createdAt: homeStatSet.createdAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select(statSetSelect)
          .from(homeStatSet)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(homeStatSet)
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getById: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db
        .select(statSetSelect)
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      return row
    }),

  create: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.CREATE)
    .input(statSetFormInput)
    .mutation(async ({ ctx, input }) => {
      const [inserted] = await ctx.db
        .insert(homeStatSet)
        .values({
          ...mapFormToDb(input),
          status: 'DRAFT',
        })
        .returning({ id: homeStatSet.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'İstatistik seti oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.UPDATE)
    .input(statSetFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeStatSet.id })
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      await ctx.db
        .update(homeStatSet)
        .set(mapFormToDb(input))
        .where(eq(homeStatSet.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeStatSet.id, status: homeStatSet.status })
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      if (existing.status === 'PUBLISHED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Yayındaki istatistik seti silinemez. Önce yayından kaldırın.',
        })
      }

      await ctx.db
        .update(homeStatSet)
        .set(ctx.audit.softDelete(homeStatSet))
        .where(eq(homeStatSet.id, input.id))

      return { ok: true as const }
    }),

  restore: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const [restored] = await ctx.db
        .update(homeStatSet)
        .set({ deletedAt: null, deletedBy: null })
        .where(
          and(eq(homeStatSet.id, input.id), isNotNull(homeStatSet.deletedAt))
        )
        .returning({ id: homeStatSet.id })

      if (!restored) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Geri alınacak istatistik seti bulunamadı',
        })
      }

      return { id: restored.id }
    }),

  publish: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeStatSet.id })
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      const now = new Date()

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(homeStatSet)
          .set({ status: 'DRAFT', publishedAt: null })
          .where(
            and(
              ne(homeStatSet.id, input.id),
              eq(homeStatSet.status, 'PUBLISHED'),
              excludeDeleted(homeStatSet)
            )
          )

        await tx
          .update(homeStatSet)
          .set({ status: 'PUBLISHED', publishedAt: now })
          .where(eq(homeStatSet.id, input.id))
      })

      return { id: input.id }
    }),

  unpublish: rbacProcedure(SCOPES.HOME_STAT_SET, PERMISSIONS.UPDATE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: homeStatSet.id, status: homeStatSet.status })
        .from(homeStatSet)
        .where(and(eq(homeStatSet.id, input.id), excludeDeleted(homeStatSet)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'İstatistik seti bulunamadı',
        })
      }

      if (existing.status !== 'PUBLISHED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Yalnızca yayındaki set yayından kaldırılabilir',
        })
      }

      await ctx.db
        .update(homeStatSet)
        .set({ status: 'DRAFT', publishedAt: null })
        .where(eq(homeStatSet.id, input.id))

      return { id: input.id }
    }),
})

export type HomeStatSetStatus =
  (typeof sliderGroupStatusEnum.enumValues)[number]

export type HomeStatValueSource =
  (typeof homeStatValueSourceEnum.enumValues)[number]
