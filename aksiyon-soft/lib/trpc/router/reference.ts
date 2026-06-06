import {
  createAdminListSchema,
  router,
  publicProcedure,
  rbacProcedure,
} from '../index'
import { paginatedListResponse } from '../admin-list'
import { file, reference, SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { and, asc, count, desc, eq, max } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { TRPCError } from '@trpc/server'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'

const uuidZ = z.uuid()

const refSelect = {
  id: reference.id,
  name: reference.name,
  sector: reference.sector,
  description: reference.description,
  summary: reference.summary,
  websiteUrl: reference.websiteUrl,
  logoId: reference.logoId,
  logoAlt: reference.logoAlt,
  sortOrder: reference.sortOrder,
  createdAt: reference.createdAt,
  updatedAt: reference.updatedAt,
} as const

const referenceFormInput = z.object({
  name: z.string().min(1, 'Ad gerekli'),
  sector: z.string().min(1, 'Sektör gerekli'),
  description: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  websiteUrl: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .nullable()
    .transform((v) => (v === '' || v === undefined || v === null ? null : v)),
  logoId: z.union([uuidZ, z.null()]).optional(),
  logoAlt: z.string().optional().nullable(),
})

function toAdminRow(r: {
  id: string
  name: string
  sector: string
  description: string | null
  summary: string | null
  websiteUrl: string | null
  logoId: string | null
  logoAlt: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  logoFileName: string | null
}) {
  return {
    id: r.id,
    name: r.name,
    sector: r.sector,
    description: r.description,
    summary: r.summary,
    websiteUrl: r.websiteUrl,
    logoId: r.logoId,
    logoAlt: r.logoAlt,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    logoViewUrl: r.logoId ? `/api/files/${r.logoId}/view` : null,
  }
}

const referenceListOrder = [
  asc(reference.sortOrder),
  asc(reference.createdAt),
] as const

export const referenceRouter = router({
  listPublic: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: refSelect.id,
        name: refSelect.name,
        sector: refSelect.sector,
        description: refSelect.description,
        summary: refSelect.summary,
        websiteUrl: refSelect.websiteUrl,
        logoId: refSelect.logoId,
        logoAlt: refSelect.logoAlt,
        createdAt: refSelect.createdAt,
        updatedAt: refSelect.updatedAt,
        logoFileName: file.fileName,
      })
      .from(reference)
      .leftJoin(file, eq(reference.logoId, file.id))
      .where(excludeDeleted(reference))
      .orderBy(...referenceListOrder)

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sector: row.sector,
      description: row.description ?? undefined,
      summary: row.summary ?? undefined,
      websiteUrl: row.websiteUrl ?? undefined,
      logoSrc: row.logoId ? `/api/files/${row.logoId}/view` : undefined,
      logoAlt: row.logoAlt ?? undefined,
    }))
  }),

  list: rbacProcedure(SCOPES.REFERENCE, PERMISSIONS.READ)
    .input(createAdminListSchema(['name', 'sector', 'createdAt', 'sortOrder']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(reference)]

      if (search) {
        conditions.push(
          createMultiColumnSearch(
            [reference.name, reference.sector, reference.description],
            search
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        name: reference.name,
        sector: reference.sector,
        description: reference.description,
        sortOrder: reference.sortOrder,
        createdAt: reference.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderBy = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        name: reference.name,
        sector: reference.sector,
        createdAt: reference.createdAt,
        sortOrder: reference.sortOrder,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: refSelect.id,
            name: refSelect.name,
            sector: refSelect.sector,
            description: refSelect.description,
            summary: refSelect.summary,
            websiteUrl: refSelect.websiteUrl,
            logoId: refSelect.logoId,
            logoAlt: refSelect.logoAlt,
            sortOrder: refSelect.sortOrder,
            createdAt: refSelect.createdAt,
            updatedAt: refSelect.updatedAt,
            logoFileName: file.fileName,
          })
          .from(reference)
          .leftJoin(file, eq(reference.logoId, file.id))
          .where(whereCondition)
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),
        ctx.db.select({ count: count() }).from(reference).where(whereCondition),
      ])

      return paginatedListResponse(
        rows.map((row) => toAdminRow(row)),
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  listReorderScope: rbacProcedure(SCOPES.REFERENCE, PERMISSIONS.READ).query(
    async ({ ctx }) =>
      ctx.db
        .select({ id: reference.id })
        .from(reference)
        .where(excludeDeleted(reference))
        .orderBy(...referenceListOrder)
  ),

  getById: rbacProcedure(SCOPES.REFERENCE, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: refSelect.id,
          name: refSelect.name,
          sector: refSelect.sector,
          description: refSelect.description,
          summary: refSelect.summary,
          websiteUrl: refSelect.websiteUrl,
          logoId: refSelect.logoId,
          logoAlt: refSelect.logoAlt,
          sortOrder: refSelect.sortOrder,
          createdAt: refSelect.createdAt,
          updatedAt: refSelect.updatedAt,
          logoFileName: file.fileName,
        })
        .from(reference)
        .leftJoin(file, eq(reference.logoId, file.id))
        .where(and(eq(reference.id, input.id), excludeDeleted(reference)))
        .limit(1)

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Referans yok' })
      }

      return toAdminRow(row)
    }),

  create: rbacProcedure(SCOPES.REFERENCE, PERMISSIONS.CREATE)
    .input(referenceFormInput)
    .mutation(async ({ ctx, input }) => {
      const [agg] = await ctx.db
        .select({ m: max(reference.sortOrder) })
        .from(reference)
        .where(excludeDeleted(reference))

      const nextSort = (agg?.m ?? -1) + 1

      const [inserted] = await ctx.db
        .insert(reference)
        .values({
          name: input.name,
          sector: input.sector,
          description: input.description ?? null,
          summary: input.summary ?? null,
          websiteUrl: input.websiteUrl,
          logoId: input.logoId ?? null,
          logoAlt: input.logoAlt?.trim() || null,
          sortOrder: nextSort,
        })
        .returning({ id: reference.id })

      if (!inserted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Kayıt oluşmadı',
        })
      }

      return { id: inserted.id }
    }),

  update: rbacProcedure(SCOPES.REFERENCE, PERMISSIONS.UPDATE)
    .input(
      referenceFormInput.extend({
        id: uuidZ,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: reference.id })
        .from(reference)
        .where(and(eq(reference.id, input.id), excludeDeleted(reference)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Referans yok' })
      }

      await ctx.db
        .update(reference)
        .set({
          name: input.name,
          sector: input.sector,
          description: input.description ?? null,
          summary: input.summary ?? null,
          websiteUrl: input.websiteUrl,
          logoId: input.logoId ?? null,
          logoAlt: input.logoAlt?.trim() || null,
        })
        .where(eq(reference.id, input.id))

      return { id: input.id }
    }),

  delete: rbacProcedure(SCOPES.REFERENCE, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: reference.id })
        .from(reference)
        .where(and(eq(reference.id, input.id), excludeDeleted(reference)))
        .limit(1)
        .then((r) => r[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Referans yok' })
      }

      await ctx.db
        .update(reference)
        .set(ctx.audit.softDelete(reference))
        .where(eq(reference.id, input.id))

      return { ok: true as const }
    }),

  reorder: rbacProcedure(SCOPES.REFERENCE, PERMISSIONS.UPDATE)
    .input(
      z.object({
        orderedIds: z.array(uuidZ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: reference.id })
        .from(reference)
        .where(excludeDeleted(reference))

      if (existing.length !== input.orderedIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesi tüm referansları içermelidir',
        })
      }

      const existingIds = new Set(existing.map((row) => row.id))
      if (!input.orderedIds.every((id) => existingIds.has(id))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sıralama listesinde geçersiz id var',
        })
      }

      await ctx.db.transaction(async (tx) => {
        for (const [idx, id] of input.orderedIds.entries()) {
          await tx
            .update(reference)
            .set({ sortOrder: idx })
            .where(eq(reference.id, id))
        }
      })

      return { ok: true as const }
    }),
})
