import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, ne } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import {
  file,
  PERMISSIONS,
  SCOPES,
  slider,
  sliderGroup,
  sliderGroupStatusEnum,
  sliderTypeEnum,
} from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import {
  HERO_AUTOPLAY_MAX_MS,
  HERO_AUTOPLAY_MIN_MS,
} from '@/lib/website/slider-autoplay'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const slideFieldsSchema = z
  .object({
    fileId: uuidZ,
    title: z.string().trim().min(1, 'Başlık gerekli'),
    subtitle: z.string().optional().nullable(),
    imageAlt: z.string().optional().nullable(),
    showPrimaryButton: z.boolean(),
    showSecondaryButton: z.boolean(),
    primaryLabel: z.string().optional().nullable(),
    primaryHref: z.string().optional().nullable(),
    secondaryLabel: z.string().optional().nullable(),
    secondaryHref: z.string().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.showPrimaryButton) {
      if (!val.primaryLabel?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Birincil buton görünürken etiket gerekli',
          path: ['primaryLabel'],
        })
      }
      if (!val.primaryHref?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Birincil buton görünürken bağlantı gerekli',
          path: ['primaryHref'],
        })
      }
    }
    if (val.showSecondaryButton) {
      if (!val.secondaryLabel?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'İkincil buton görünürken etiket gerekli',
          path: ['secondaryLabel'],
        })
      }
      if (!val.secondaryHref?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'İkincil buton görünürken bağlantı gerekli',
          path: ['secondaryHref'],
        })
      }
    }
  })

const groupFormInput = z.object({
  name: z.string().trim().min(1, 'Grup adı gerekli'),
  description: z.string().optional().nullable(),
  type: z.enum(sliderTypeEnum.enumValues),
  status: z.enum(sliderGroupStatusEnum.enumValues),
  autoplayInterval: z
    .number()
    .int()
    .min(HERO_AUTOPLAY_MIN_MS)
    .max(HERO_AUTOPLAY_MAX_MS)
    .optional()
    .nullable(),
})

function mapSlideRow(row: {
  id: string
  groupId: string
  fileId: string
  sortOrder: number
  title: string
  subtitle: string | null
  imageAlt: string | null
  showPrimaryButton: boolean
  showSecondaryButton: boolean
  primaryLabel: string | null
  primaryHref: string | null
  secondaryLabel: string | null
  secondaryHref: string | null
  createdAt: Date
  updatedAt: Date
  fileName: string | null
  fileMimeType: string | null
}) {
  return {
    id: row.id,
    groupId: row.groupId,
    fileId: row.fileId,
    sortOrder: row.sortOrder,
    title: row.title,
    subtitle: row.subtitle,
    imageAlt: row.imageAlt,
    showPrimaryButton: row.showPrimaryButton,
    showSecondaryButton: row.showSecondaryButton,
    primaryLabel: row.primaryLabel,
    primaryHref: row.primaryHref,
    secondaryLabel: row.secondaryLabel,
    secondaryHref: row.secondaryHref,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    fileName: row.fileName,
    fileMimeType: row.fileMimeType,
    fileViewUrl: row.fileId ? `/api/files/${row.fileId}/view` : null,
  }
}

export const sliderRouter = router({
  listGroups: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.READ)
    .input(
      createAdminListSchema([
        'name',
        'type',
        'status',
        'createdAt',
        'sortOrder',
      ]).extend({
        type: z.enum(sliderTypeEnum.enumValues).optional(),
        status: z.enum(sliderGroupStatusEnum.enumValues).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        columnFilters,
        type,
        status,
      } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(sliderGroup)]
      if (type) {
        conditions.push(eq(sliderGroup.type, type))
      }
      if (status) {
        conditions.push(eq(sliderGroup.status, status))
      }

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [sliderGroup.name, sliderGroup.description],
            search
          )
        )
      }

      applyColumnFilters(
        conditions,
        columnFilters,
        {
          name: sliderGroup.name,
          type: sliderGroup.type,
          status: sliderGroup.status,
          createdAt: sliderGroup.createdAt,
          sortOrder: sliderGroup.sortOrder,
        },
        { exactKeys: ['type', 'status'] }
      )

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: sliderGroup.name,
        type: sliderGroup.type,
        status: sliderGroup.status,
        createdAt: sliderGroup.createdAt,
        sortOrder: sliderGroup.sortOrder,
      }[sortBy]

      const [groups, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: sliderGroup.id,
            name: sliderGroup.name,
            description: sliderGroup.description,
            type: sliderGroup.type,
            autoplayInterval: sliderGroup.autoplayInterval,
            status: sliderGroup.status,
            sortOrder: sliderGroup.sortOrder,
            createdAt: sliderGroup.createdAt,
            updatedAt: sliderGroup.updatedAt,
          })
          .from(sliderGroup)
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(sliderGroup)
          .where(whereCondition),
      ])

      if (groups.length === 0) {
        return paginatedListResponse(
          [],
          totalResult[0]?.count ?? 0,
          page,
          limit
        )
      }

      const groupIds = groups.map((g) => g.id)
      const slideRows = await ctx.db
        .select({
          id: slider.id,
          groupId: slider.groupId,
          fileId: slider.fileId,
          sortOrder: slider.sortOrder,
          title: slider.title,
          subtitle: slider.subtitle,
          imageAlt: slider.imageAlt,
          showPrimaryButton: slider.showPrimaryButton,
          showSecondaryButton: slider.showSecondaryButton,
          primaryLabel: slider.primaryLabel,
          primaryHref: slider.primaryHref,
          secondaryLabel: slider.secondaryLabel,
          secondaryHref: slider.secondaryHref,
          createdAt: slider.createdAt,
          updatedAt: slider.updatedAt,
          fileName: file.originalName,
          fileMimeType: file.mimeType,
        })
        .from(slider)
        .leftJoin(file, eq(slider.fileId, file.id))
        .where(and(inArray(slider.groupId, groupIds), excludeDeleted(slider)))
        .orderBy(asc(slider.sortOrder), asc(slider.createdAt))

      const slidesByGroup = new Map<string, ReturnType<typeof mapSlideRow>[]>()
      for (const row of slideRows) {
        const list = slidesByGroup.get(row.groupId) ?? []
        list.push(mapSlideRow(row))
        slidesByGroup.set(row.groupId, list)
      }

      const data = groups.map((g) => ({
        ...g,
        slides: slidesByGroup.get(g.id) ?? [],
      }))

      return paginatedListResponse(
        data,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  getGroupById: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const [group] = await ctx.db
        .select({
          id: sliderGroup.id,
          name: sliderGroup.name,
          description: sliderGroup.description,
          type: sliderGroup.type,
          autoplayInterval: sliderGroup.autoplayInterval,
          status: sliderGroup.status,
          sortOrder: sliderGroup.sortOrder,
          createdAt: sliderGroup.createdAt,
          updatedAt: sliderGroup.updatedAt,
        })
        .from(sliderGroup)
        .where(and(eq(sliderGroup.id, input.id), excludeDeleted(sliderGroup)))
        .limit(1)

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Slider grubu bulunamadı',
        })
      }

      const slideRows = await ctx.db
        .select({
          id: slider.id,
          groupId: slider.groupId,
          fileId: slider.fileId,
          sortOrder: slider.sortOrder,
          title: slider.title,
          subtitle: slider.subtitle,
          imageAlt: slider.imageAlt,
          showPrimaryButton: slider.showPrimaryButton,
          showSecondaryButton: slider.showSecondaryButton,
          primaryLabel: slider.primaryLabel,
          primaryHref: slider.primaryHref,
          secondaryLabel: slider.secondaryLabel,
          secondaryHref: slider.secondaryHref,
          createdAt: slider.createdAt,
          updatedAt: slider.updatedAt,
          fileName: file.originalName,
          fileMimeType: file.mimeType,
        })
        .from(slider)
        .leftJoin(file, eq(slider.fileId, file.id))
        .where(and(eq(slider.groupId, input.id), excludeDeleted(slider)))
        .orderBy(asc(slider.sortOrder), asc(slider.createdAt))

      return {
        ...group,
        slides: slideRows.map(mapSlideRow),
      }
    }),

  createGroup: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.CREATE)
    .input(groupFormInput)
    .mutation(async ({ ctx, input }) => {
      const nextSort =
        (await ctx.db
          .select({ sortOrder: sliderGroup.sortOrder })
          .from(sliderGroup)
          .where(excludeDeleted(sliderGroup))
          .orderBy(desc(sliderGroup.sortOrder))
          .limit(1)
          .then((r) => r[0]?.sortOrder ?? -1)) + 1

      return await ctx.db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(sliderGroup)
          .values({
            name: input.name.trim(),
            description: input.description?.trim() || null,
            type: input.type,
            autoplayInterval: input.autoplayInterval ?? null,
            status: input.status,
            sortOrder: nextSort,
          })
          .returning({ id: sliderGroup.id })

        if (!inserted) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Slider grubu oluşturulamadı',
          })
        }

        if (input.status === 'PUBLISHED') {
          await tx
            .update(sliderGroup)
            .set({ status: 'DRAFT' })
            .where(
              and(
                ne(sliderGroup.id, inserted.id),
                eq(sliderGroup.status, 'PUBLISHED'),
                excludeDeleted(sliderGroup)
              )
            )
        }

        return { id: inserted.id }
      })
    }),

  updateGroup: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.UPDATE)
    .input(groupFormInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: sliderGroup.id })
        .from(sliderGroup)
        .where(and(eq(sliderGroup.id, input.id), excludeDeleted(sliderGroup)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Slider grubu bulunamadı',
        })
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(sliderGroup)
          .set({
            name: input.name.trim(),
            description: input.description?.trim() || null,
            type: input.type,
            autoplayInterval: input.autoplayInterval ?? null,
            status: input.status,
          })
          .where(eq(sliderGroup.id, input.id))

        if (input.status === 'PUBLISHED') {
          await tx
            .update(sliderGroup)
            .set({ status: 'DRAFT' })
            .where(
              and(
                ne(sliderGroup.id, input.id),
                eq(sliderGroup.status, 'PUBLISHED'),
                excludeDeleted(sliderGroup)
              )
            )
        }
      })

      return { id: input.id }
    }),

  deleteGroup: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: sliderGroup.id })
        .from(sliderGroup)
        .where(and(eq(sliderGroup.id, input.id), excludeDeleted(sliderGroup)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Slider grubu bulunamadı',
        })
      }

      await ctx.db.transaction(async (tx) => {
        const slideIds = await tx
          .select({ id: slider.id })
          .from(slider)
          .where(and(eq(slider.groupId, input.id), excludeDeleted(slider)))

        for (const s of slideIds) {
          await tx
            .update(slider)
            .set(ctx.audit.softDelete(slider))
            .where(eq(slider.id, s.id))
        }

        await tx
          .update(sliderGroup)
          .set(ctx.audit.softDelete(sliderGroup))
          .where(eq(sliderGroup.id, input.id))
      })

      return { ok: true as const }
    }),

  listReorderScope: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.READ).query(
    async ({ ctx }) =>
      ctx.db
        .select({ id: sliderGroup.id })
        .from(sliderGroup)
        .where(excludeDeleted(sliderGroup))
        .orderBy(asc(sliderGroup.sortOrder), desc(sliderGroup.createdAt))
  ),

  reorderGroups: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.UPDATE)
    .input(z.object({ orderedIds: z.array(uuidZ).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: sliderGroup.id })
        .from(sliderGroup)
        .where(excludeDeleted(sliderGroup))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm slider gruplarını içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz grup id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(sliderGroup)
            .set({ sortOrder: index })
            .where(eq(sliderGroup.id, id))
        }
      })

      return { ok: true as const }
    }),

  createSlide: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.CREATE)
    .input(
      slideFieldsSchema.safeExtend({
        groupId: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const groupExists = await ctx.db
        .select({ id: sliderGroup.id })
        .from(sliderGroup)
        .where(
          and(eq(sliderGroup.id, input.groupId), excludeDeleted(sliderGroup))
        )
        .limit(1)
        .then((r) => r[0])

      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Slider grubu bulunamadı',
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

      const nextSort =
        (await ctx.db
          .select({ sortOrder: slider.sortOrder })
          .from(slider)
          .where(and(eq(slider.groupId, input.groupId), excludeDeleted(slider)))
          .orderBy(desc(slider.sortOrder))
          .limit(1)
          .then((r) => r[0]?.sortOrder ?? -1)) + 1

      const [inserted] = await ctx.db
        .insert(slider)
        .values({
          groupId: input.groupId,
          fileId: input.fileId,
          sortOrder: nextSort,
          title: input.title.trim(),
          subtitle: input.subtitle?.trim() || null,
          imageAlt: input.imageAlt?.trim() || null,
          showPrimaryButton: input.showPrimaryButton,
          showSecondaryButton: input.showSecondaryButton,
          primaryLabel: input.primaryLabel?.trim() || null,
          primaryHref: input.primaryHref?.trim() || null,
          secondaryLabel: input.secondaryLabel?.trim() || null,
          secondaryHref: input.secondaryHref?.trim() || null,
        })
        .returning({ id: slider.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Slayt oluşturulamadı',
        })
      }

      return { id: inserted.id }
    }),

  updateSlide: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.UPDATE)
    .input(
      slideFieldsSchema.safeExtend({
        id: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: slider.id, groupId: slider.groupId })
        .from(slider)
        .where(and(eq(slider.id, input.id), excludeDeleted(slider)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Slayt bulunamadı' })
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

      await ctx.db
        .update(slider)
        .set({
          fileId: input.fileId,
          title: input.title.trim(),
          subtitle: input.subtitle?.trim() || null,
          imageAlt: input.imageAlt?.trim() || null,
          showPrimaryButton: input.showPrimaryButton,
          showSecondaryButton: input.showSecondaryButton,
          primaryLabel: input.primaryLabel?.trim() || null,
          primaryHref: input.primaryHref?.trim() || null,
          secondaryLabel: input.secondaryLabel?.trim() || null,
          secondaryHref: input.secondaryHref?.trim() || null,
        })
        .where(eq(slider.id, input.id))

      return { id: input.id }
    }),

  deleteSlide: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: slider.id })
        .from(slider)
        .where(and(eq(slider.id, input.id), excludeDeleted(slider)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Slayt bulunamadı' })
      }

      await ctx.db
        .update(slider)
        .set(ctx.audit.softDelete(slider))
        .where(eq(slider.id, input.id))

      return { ok: true as const }
    }),

  reorderSlides: rbacProcedure(SCOPES.SLIDER, PERMISSIONS.UPDATE)
    .input(
      z.object({
        groupId: uuidZ,
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const groupExists = await ctx.db
        .select({ id: sliderGroup.id })
        .from(sliderGroup)
        .where(
          and(eq(sliderGroup.id, input.groupId), excludeDeleted(sliderGroup))
        )
        .limit(1)
        .then((r) => r[0])

      if (!groupExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Slider grubu bulunamadı',
        })
      }

      const existing = await ctx.db
        .select({ id: slider.id })
        .from(slider)
        .where(and(eq(slider.groupId, input.groupId), excludeDeleted(slider)))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi bu gruptaki tüm slaytları içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz slayt id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.orderedIds.entries()) {
          await tx
            .update(slider)
            .set({ sortOrder: index })
            .where(eq(slider.id, id))
        }
      })

      return { ok: true as const }
    }),
})
