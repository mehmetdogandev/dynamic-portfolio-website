import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import {
  PERMISSIONS,
  SCOPES,
  japonCar,
  japonCarOwnership,
  japonCustomer,
  japonFormen,
  japonPart,
  japonService,
  japonServiceJob,
  japonServiceJobService,
} from '@/lib/db/schema'
import {
  applyColumnFilters,
  createLocaleInsensitiveSearch,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import {
  getJaponJobStatus,
  type JaponJobStatus,
} from '@/lib/japon/service-job-status'
import { openCarOwnership, transferCarOwnership } from '@/lib/japon/ownership'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))

const carFieldsInput = z.object({
  plate: z.string().trim().min(1, 'Plaka gerekli'),
  vehicleType: z.string().trim().min(1, 'Araç tipi gerekli'),
  color: z.string().trim().min(1, 'Renk gerekli'),
  km: z.number().int().min(0).default(0),
  notes: optionalTrimmed,
})

const normalizePlate = (plate: string) =>
  plate.replace(/\s+/g, '').toUpperCase()

const plateMatchCondition = (plate: string) =>
  sql`UPPER(REPLACE(${japonCar.plate}, ' ', '')) = ${normalizePlate(plate)}`

export const japonCarRouter = router({
  list: rbacProcedure(SCOPES.JAPON_OTO_CAR, PERMISSIONS.READ)
    .input(
      createAdminListSchema(['plate', 'vehicleType', 'createdAt', 'color'])
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(japonCar)]

      if (search) {
        conditions.push(
          or(
            createLocaleInsensitiveSearch(japonCar.plate, search),
            createMultiColumnSearch(
              [
                japonCustomer.name,
                japonCustomer.surname,
                japonCustomer.customerNo,
              ],
              search
            )
          )!
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        plate: japonCar.plate,
        vehicleType: japonCar.vehicleType,
        color: japonCar.color,
        createdAt: japonCar.createdAt,
      })

      const whereCondition = and(...conditions)
      const orderFn = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        plate: japonCar.plate,
        vehicleType: japonCar.vehicleType,
        createdAt: japonCar.createdAt,
        color: japonCar.color,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: japonCar.id,
            plate: japonCar.plate,
            vehicleType: japonCar.vehicleType,
            color: japonCar.color,
            km: japonCar.km,
            notes: japonCar.notes,
            customerId: japonCar.customerId,
            createdAt: japonCar.createdAt,
            updatedAt: japonCar.updatedAt,
            ownerName: japonCustomer.name,
            ownerSurname: japonCustomer.surname,
            ownerCustomerNo: japonCustomer.customerNo,
          })
          .from(japonCar)
          .innerJoin(japonCustomer, eq(japonCustomer.id, japonCar.customerId))
          .where(whereCondition)
          .orderBy(orderFn(sortColumn), desc(japonCar.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(japonCar)
          .innerJoin(japonCustomer, eq(japonCustomer.id, japonCar.customerId))
          .where(whereCondition),
      ])

      return paginatedListResponse(
        rows,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  listByCustomer: rbacProcedure(SCOPES.JAPON_OTO_CAR, PERMISSIONS.READ)
    .input(z.object({ customerId: uuidZ }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(japonCar)
        .where(
          and(
            eq(japonCar.customerId, input.customerId),
            excludeDeleted(japonCar)
          )
        )
        .orderBy(asc(japonCar.createdAt))
    }),

  searchForOperation: rbacProcedure(
    SCOPES.JAPON_OTO_OPERATIONS,
    PERMISSIONS.READ
  )
    .input(
      z.object({
        search: z.string().trim().min(1),
        customerId: uuidZ.optional(),
        limit: z.number().int().min(1).max(30).default(15),
      })
    )
    .query(async ({ ctx, input }) => {
      const plateCondition = createLocaleInsensitiveSearch(
        japonCar.plate,
        input.search
      )

      const conditions = [excludeDeleted(japonCar), plateCondition]

      if (input.customerId) {
        conditions.push(eq(japonCar.customerId, input.customerId))
      }

      const rows = await ctx.db
        .select({
          id: japonCar.id,
          plate: japonCar.plate,
          vehicleType: japonCar.vehicleType,
          color: japonCar.color,
          km: japonCar.km,
          customerId: japonCar.customerId,
          ownerName: japonCustomer.name,
          ownerSurname: japonCustomer.surname,
          ownerCustomerNo: japonCustomer.customerNo,
        })
        .from(japonCar)
        .innerJoin(japonCustomer, eq(japonCustomer.id, japonCar.customerId))
        .where(and(...conditions))
        .orderBy(asc(japonCar.plate))
        .limit(input.limit)

      return rows.map((row) => ({
        ...row,
        ownerLabel: `${row.ownerName} ${row.ownerSurname}`,
        isOwnedBySelectedCustomer: input.customerId
          ? row.customerId === input.customerId
          : null,
      }))
    }),

  getById: rbacProcedure(SCOPES.JAPON_OTO_CAR, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const car = await ctx.db
        .select()
        .from(japonCar)
        .where(and(eq(japonCar.id, input.id), excludeDeleted(japonCar)))
        .limit(1)
        .then((rows) => rows[0])

      if (!car) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Araç bulunamadı' })
      }

      const ownershipTimeline = await ctx.db
        .select({
          id: japonCarOwnership.id,
          customerId: japonCarOwnership.customerId,
          startedAt: japonCarOwnership.startedAt,
          endedAt: japonCarOwnership.endedAt,
          customerName: japonCustomer.name,
          customerSurname: japonCustomer.surname,
          customerNo: japonCustomer.customerNo,
        })
        .from(japonCarOwnership)
        .innerJoin(
          japonCustomer,
          eq(japonCustomer.id, japonCarOwnership.customerId)
        )
        .where(
          and(
            eq(japonCarOwnership.carId, input.id),
            excludeDeleted(japonCarOwnership)
          )
        )
        .orderBy(asc(japonCarOwnership.startedAt))

      const jobs = await ctx.db
        .select({
          job: japonServiceJob,
          formenName: japonFormen.name,
          formenSurname: japonFormen.surname,
        })
        .from(japonServiceJob)
        .leftJoin(japonFormen, eq(japonFormen.id, japonServiceJob.formenId))
        .where(
          and(
            eq(japonServiceJob.carId, input.id),
            excludeDeleted(japonServiceJob)
          )
        )
        .orderBy(desc(japonServiceJob.createdAt))

      const jobIds = jobs.map((j) => j.job.id)

      const serviceLinks = jobIds.length
        ? await ctx.db
            .select({
              serviceJobId: japonServiceJobService.serviceJobId,
              serviceId: japonService.id,
              serviceName: japonService.name,
            })
            .from(japonServiceJobService)
            .innerJoin(
              japonService,
              eq(japonService.id, japonServiceJobService.serviceId)
            )
            .where(sql`${japonServiceJobService.serviceJobId} IN ${jobIds}`)
        : []

      const parts = jobIds.length
        ? await ctx.db
            .select()
            .from(japonPart)
            .where(
              and(
                sql`${japonPart.serviceJobId} IN ${jobIds}`,
                excludeDeleted(japonPart)
              )
            )
            .orderBy(asc(japonPart.sortOrder), asc(japonPart.createdAt))
        : []

      const servicesByJob = new Map<
        string,
        Array<{ id: string; name: string }>
      >()
      for (const link of serviceLinks) {
        const arr = servicesByJob.get(link.serviceJobId) ?? []
        arr.push({ id: link.serviceId, name: link.serviceName })
        servicesByJob.set(link.serviceJobId, arr)
      }

      const partsByJob = new Map<string, typeof parts>()
      for (const p of parts) {
        const arr = partsByJob.get(p.serviceJobId) ?? []
        arr.push(p)
        partsByJob.set(p.serviceJobId, arr)
      }

      const jobsWithDetails = jobs.map(({ job, formenName, formenSurname }) => {
        const servicesCount = servicesByJob.get(job.id)?.length ?? 0
        const status: JaponJobStatus = getJaponJobStatus({
          isCompleted: job.isCompleted,
          isCancelled: job.isCancelled,
          startedAt: job.startedAt,
          servicesCount,
        })
        return {
          ...job,
          status,
          formenLabel: formenName
            ? `${formenName}${formenSurname ? ' ' + formenSurname : ''}`
            : null,
          services: servicesByJob.get(job.id) ?? [],
          parts: partsByJob.get(job.id) ?? [],
        }
      })

      const jobsByPeriod = ownershipTimeline.map((period) => {
        const periodStart = period.startedAt
        const periodEnd = period.endedAt ?? new Date()
        const periodJobs = jobsWithDetails.filter((job) => {
          const at = job.createdAt
          return at >= periodStart && at <= periodEnd
        })
        return {
          ownership: period,
          jobs: periodJobs,
        }
      })

      return {
        car,
        ownershipTimeline,
        jobsByPeriod,
        allJobs: jobsWithDetails,
      }
    }),

  create: rbacProcedure(SCOPES.JAPON_OTO_CAR, PERMISSIONS.CREATE)
    .input(carFieldsInput.extend({ customerId: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const customerExists = await ctx.db
        .select({ id: japonCustomer.id })
        .from(japonCustomer)
        .where(
          and(
            eq(japonCustomer.id, input.customerId),
            excludeDeleted(japonCustomer)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!customerExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Müşteri bulunamadı',
        })
      }

      const plateClash = await ctx.db
        .select({ id: japonCar.id })
        .from(japonCar)
        .where(and(excludeDeleted(japonCar), plateMatchCondition(input.plate)))
        .limit(1)

      if (plateClash.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Bu araç plakası zaten kayıtlı',
        })
      }

      return await ctx.db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(japonCar)
          .values({
            customerId: input.customerId,
            plate: input.plate.trim().toUpperCase(),
            vehicleType: input.vehicleType.trim(),
            color: input.color.trim(),
            km: input.km,
            notes: input.notes,
          })
          .returning({ id: japonCar.id })

        if (!inserted) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Araç oluşturulamadı',
          })
        }

        await openCarOwnership(tx, {
          carId: inserted.id,
          customerId: input.customerId,
        })

        return { id: inserted.id }
      })
    }),

  update: rbacProcedure(SCOPES.JAPON_OTO_CAR, PERMISSIONS.UPDATE)
    .input(carFieldsInput.extend({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: japonCar.id })
        .from(japonCar)
        .where(and(eq(japonCar.id, input.id), excludeDeleted(japonCar)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Araç bulunamadı' })
      }

      const plateClash = await ctx.db
        .select({ id: japonCar.id })
        .from(japonCar)
        .where(
          and(
            excludeDeleted(japonCar),
            plateMatchCondition(input.plate),
            sql`${japonCar.id} <> ${input.id}`
          )
        )
        .limit(1)

      if (plateClash.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Bu araç plakası zaten kayıtlı',
        })
      }

      await ctx.db
        .update(japonCar)
        .set({
          plate: input.plate.trim().toUpperCase(),
          vehicleType: input.vehicleType.trim(),
          color: input.color.trim(),
          km: input.km,
          notes: input.notes,
        })
        .where(eq(japonCar.id, input.id))

      return { id: input.id }
    }),

  transferOwnership: rbacProcedure(SCOPES.JAPON_OTO_CAR, PERMISSIONS.UPDATE)
    .input(z.object({ carId: uuidZ, newCustomerId: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await transferCarOwnership(tx, {
          carId: input.carId,
          newCustomerId: input.newCustomerId,
        })
      })
      return { ok: true as const }
    }),

  delete: rbacProcedure(SCOPES.JAPON_OTO_CAR, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: japonCar.id })
        .from(japonCar)
        .where(and(eq(japonCar.id, input.id), excludeDeleted(japonCar)))
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Araç bulunamadı' })
      }

      await ctx.db
        .update(japonCar)
        .set(ctx.audit.softDelete(japonCar))
        .where(eq(japonCar.id, input.id))

      return { ok: true as const }
    }),

  checkPlate: rbacProcedure(SCOPES.JAPON_OTO_CAR, PERMISSIONS.READ)
    .input(
      z.object({
        plate: z.string().trim().min(1),
        ignoreCarId: uuidZ.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: japonCar.id,
          customerId: japonCar.customerId,
          plate: japonCar.plate,
        })
        .from(japonCar)
        .where(and(excludeDeleted(japonCar), plateMatchCondition(input.plate)))
        .limit(2)

      const match = rows.find((r) => r.id !== input.ignoreCarId)
      return {
        exists: Boolean(match),
        carId: match?.id ?? null,
        customerId: match?.customerId ?? null,
        plate: match?.plate ?? null,
      }
    }),
})
