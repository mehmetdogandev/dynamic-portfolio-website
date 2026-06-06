import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, inArray, max, or, sql } from 'drizzle-orm'
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
import { allocateCustomerNo } from '@/lib/japon/customer-number'
import type { DB } from '@/lib/db'
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
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'

const uuidZ = z.uuid()

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))

const customerCoreInput = z.object({
  name: z.string().trim().min(1, 'Ad gerekli'),
  surname: z.string().trim().min(1, 'Soyad gerekli'),
  phone: z.string().trim().min(1, 'Telefon gerekli'),
  address: optionalTrimmed,
  notes: optionalTrimmed,
})

async function buildCustomerListSearchCondition(db: DB, search: string) {
  const customerTextSearch = createMultiColumnSearch(
    [
      japonCustomer.name,
      japonCustomer.surname,
      japonCustomer.phone,
      japonCustomer.customerNo,
    ],
    search
  )

  const matchingCars = await db
    .selectDistinct({ customerId: japonCar.customerId })
    .from(japonCar)
    .where(
      and(
        excludeDeleted(japonCar),
        createLocaleInsensitiveSearch(japonCar.plate, search)
      )
    )

  const plateCustomerIds = matchingCars.map((row) => row.customerId)

  if (plateCustomerIds.length === 0) {
    return customerTextSearch
  }

  return or(customerTextSearch, inArray(japonCustomer.id, plateCustomerIds))
}

export const japonCustomerRouter = router({
  /**
   * Paginated list of customers with rolled-up car/visit counts and latest visit.
   * Customer page table feeds from this endpoint.
   */
  list: rbacProcedure(SCOPES.JAPON_OTO_CUSTOMER, PERMISSIONS.READ)
    .input(
      createAdminListSchema([
        'name',
        'surname',
        'createdAt',
        'phone',
        'customerNo',
      ])
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input

      const conditions = [excludeDeleted(japonCustomer)]

      if (search) {
        const searchCondition = await buildCustomerListSearchCondition(
          ctx.db,
          search
        )
        if (searchCondition) {
          conditions.push(searchCondition)
        }
      }

      applyColumnFilters(conditions, columnFilters, {
        name: japonCustomer.name,
        surname: japonCustomer.surname,
        phone: japonCustomer.phone,
        customerNo: japonCustomer.customerNo,
        createdAt: japonCustomer.createdAt,
      })

      const whereCondition = and(...conditions)

      const totalRow = await ctx.db
        .select({ total: count() })
        .from(japonCustomer)
        .where(whereCondition)
        .limit(1)
        .then((rows) => rows[0] ?? { total: 0 })
      const total = totalRow.total

      const sortColumn = {
        name: japonCustomer.name,
        surname: japonCustomer.surname,
        createdAt: japonCustomer.createdAt,
        phone: japonCustomer.phone,
        customerNo: japonCustomer.customerNo,
      }[sortBy]
      const orderFn = sortOrder === 'asc' ? asc : desc

      const rows = await ctx.db
        .select({
          id: japonCustomer.id,
          customerNo: japonCustomer.customerNo,
          name: japonCustomer.name,
          surname: japonCustomer.surname,
          phone: japonCustomer.phone,
          address: japonCustomer.address,
          createdAt: japonCustomer.createdAt,
          updatedAt: japonCustomer.updatedAt,
        })
        .from(japonCustomer)
        .where(whereCondition)
        .orderBy(orderFn(sortColumn), desc(japonCustomer.createdAt))
        .limit(limit)
        .offset((page - 1) * limit)

      if (rows.length === 0) {
        return paginatedListResponse([], total, page, limit)
      }

      const customerIds = rows.map((r) => r.id)
      const carCounts = await ctx.db
        .select({
          customerId: japonCar.customerId,
          carCount: count(japonCar.id),
        })
        .from(japonCar)
        .where(
          and(
            excludeDeleted(japonCar),
            sql`${japonCar.customerId} IN ${customerIds}`
          )
        )
        .groupBy(japonCar.customerId)

      const jobAggregates = await ctx.db
        .select({
          customerId: japonServiceJob.customerId,
          jobCount: count(japonServiceJob.id),
          lastVisit: max(japonServiceJob.createdAt),
        })
        .from(japonServiceJob)
        .where(
          and(
            excludeDeleted(japonServiceJob),
            sql`${japonServiceJob.customerId} IN ${customerIds}`
          )
        )
        .groupBy(japonServiceJob.customerId)

      // Latest job per customer (for "Servis Durumu" column).
      const allJobs = await ctx.db
        .select({
          id: japonServiceJob.id,
          customerId: japonServiceJob.customerId,
          isCompleted: japonServiceJob.isCompleted,
          isCancelled: japonServiceJob.isCancelled,
          startedAt: japonServiceJob.startedAt,
          createdAt: japonServiceJob.createdAt,
        })
        .from(japonServiceJob)
        .where(
          and(
            excludeDeleted(japonServiceJob),
            sql`${japonServiceJob.customerId} IN ${customerIds}`
          )
        )
        .orderBy(desc(japonServiceJob.createdAt))

      const latestJobByCustomer = new Map<
        string,
        {
          id: string
          isCompleted: boolean
          isCancelled: boolean
          startedAt: Date | null
        }
      >()
      for (const j of allJobs) {
        if (!latestJobByCustomer.has(j.customerId)) {
          latestJobByCustomer.set(j.customerId, {
            id: j.id,
            isCompleted: j.isCompleted,
            isCancelled: j.isCancelled,
            startedAt: j.startedAt,
          })
        }
      }

      const latestJobIds = [...latestJobByCustomer.values()].map((j) => j.id)
      const serviceCountsByJob = new Map<string, number>()
      if (latestJobIds.length > 0) {
        const serviceCounts = await ctx.db
          .select({
            serviceJobId: japonServiceJobService.serviceJobId,
            total: count(),
          })
          .from(japonServiceJobService)
          .where(sql`${japonServiceJobService.serviceJobId} IN ${latestJobIds}`)
          .groupBy(japonServiceJobService.serviceJobId)
        for (const row of serviceCounts) {
          serviceCountsByJob.set(row.serviceJobId, row.total)
        }
      }

      const latestJobStatusByCustomer = new Map<string, JaponJobStatus | null>()
      for (const [customerId, job] of latestJobByCustomer) {
        latestJobStatusByCustomer.set(
          customerId,
          getJaponJobStatus({
            isCompleted: job.isCompleted,
            isCancelled: job.isCancelled,
            startedAt: job.startedAt,
            servicesCount: serviceCountsByJob.get(job.id) ?? 0,
          })
        )
      }

      const carCountById = new Map(
        carCounts.map((r) => [r.customerId, r.carCount])
      )
      const jobAggById = new Map(
        jobAggregates.map((r) => [
          r.customerId,
          { jobCount: r.jobCount, lastVisit: r.lastVisit },
        ])
      )

      // Get a representative plate per customer (newest car) for table display
      const cars = await ctx.db
        .select({
          customerId: japonCar.customerId,
          plate: japonCar.plate,
          vehicleType: japonCar.vehicleType,
          createdAt: japonCar.createdAt,
        })
        .from(japonCar)
        .where(
          and(
            excludeDeleted(japonCar),
            sql`${japonCar.customerId} IN ${customerIds}`
          )
        )
        .orderBy(desc(japonCar.createdAt))
      const primaryCarByCustomer = new Map<
        string,
        { plate: string; vehicleType: string }
      >()
      for (const c of cars) {
        if (!primaryCarByCustomer.has(c.customerId)) {
          primaryCarByCustomer.set(c.customerId, {
            plate: c.plate,
            vehicleType: c.vehicleType,
          })
        }
      }

      const data = rows.map((r) => {
        const agg = jobAggById.get(r.id)
        const primaryCar = primaryCarByCustomer.get(r.id) ?? null
        const latestJobStatus = latestJobStatusByCustomer.get(r.id) ?? null
        const activePlates = cars
          .filter((car) => car.customerId === r.id)
          .map((car) => car.plate)
        return {
          ...r,
          carCount: carCountById.get(r.id) ?? 0,
          activePlates,
          jobCount: agg?.jobCount ?? 0,
          lastVisitAt: agg?.lastVisit ?? null,
          primaryPlate: primaryCar?.plate ?? null,
          primaryVehicleType: primaryCar?.vehicleType ?? null,
          latestJobStatus,
          latestJobIsCompleted:
            latestJobStatus === 'completed'
              ? true
              : latestJobStatus === null
                ? null
                : false,
        }
      })

      return paginatedListResponse(data, total, page, limit)
    }),

  /** Lightweight search for the wizard "existing customer" autocomplete. */
  searchSimple: rbacProcedure(SCOPES.JAPON_OTO_CUSTOMER, PERMISSIONS.READ)
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const baseCondition = excludeDeleted(japonCustomer)
      const whereCondition = input.search
        ? and(
            baseCondition,
            createMultiColumnSearch(
              [
                japonCustomer.name,
                japonCustomer.surname,
                japonCustomer.phone,
                japonCustomer.customerNo,
              ],
              input.search
            )
          )
        : baseCondition

      return ctx.db
        .select({
          id: japonCustomer.id,
          customerNo: japonCustomer.customerNo,
          name: japonCustomer.name,
          surname: japonCustomer.surname,
          phone: japonCustomer.phone,
          address: japonCustomer.address,
        })
        .from(japonCustomer)
        .where(whereCondition)
        .orderBy(asc(japonCustomer.name), asc(japonCustomer.surname))
        .limit(input.limit)
    }),

  searchForOperation: rbacProcedure(
    SCOPES.JAPON_OTO_OPERATIONS,
    PERMISSIONS.READ
  )
    .input(
      z.object({
        search: z.string().trim().min(1),
        limit: z.number().int().min(1).max(30).default(15),
      })
    )
    .query(async ({ ctx, input }) => {
      const searchCondition = await buildCustomerListSearchCondition(
        ctx.db,
        input.search
      )

      return ctx.db
        .select({
          id: japonCustomer.id,
          customerNo: japonCustomer.customerNo,
          name: japonCustomer.name,
          surname: japonCustomer.surname,
          phone: japonCustomer.phone,
          address: japonCustomer.address,
        })
        .from(japonCustomer)
        .where(and(excludeDeleted(japonCustomer), searchCondition))
        .orderBy(asc(japonCustomer.name), asc(japonCustomer.surname))
        .limit(input.limit)
    }),

  /** Full customer detail with cars, jobs, services per job and parts. */
  getById: rbacProcedure(SCOPES.JAPON_OTO_CUSTOMER, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.db
        .select()
        .from(japonCustomer)
        .where(
          and(eq(japonCustomer.id, input.id), excludeDeleted(japonCustomer))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Müşteri bulunamadı',
        })
      }

      const ownershipRows = await ctx.db
        .select({
          ownership: japonCarOwnership,
          car: japonCar,
        })
        .from(japonCarOwnership)
        .innerJoin(japonCar, eq(japonCar.id, japonCarOwnership.carId))
        .where(
          and(
            eq(japonCarOwnership.customerId, input.id),
            excludeDeleted(japonCarOwnership),
            excludeDeleted(japonCar)
          )
        )
        .orderBy(desc(japonCarOwnership.startedAt))

      const currentCars = ownershipRows
        .filter((row) => row.ownership.endedAt === null)
        .map((row) => row.car)

      const pastCars = ownershipRows
        .filter((row) => row.ownership.endedAt !== null)
        .map((row) => ({
          ...row.car,
          ownershipStartedAt: row.ownership.startedAt,
          ownershipEndedAt: row.ownership.endedAt,
        }))

      const jobs = await ctx.db
        .select({
          job: japonServiceJob,
          formenName: japonFormen.name,
          formenSurname: japonFormen.surname,
          plate: japonCar.plate,
          vehicleType: japonCar.vehicleType,
        })
        .from(japonServiceJob)
        .innerJoin(japonCar, eq(japonCar.id, japonServiceJob.carId))
        .leftJoin(japonFormen, eq(japonFormen.id, japonServiceJob.formenId))
        .where(
          and(
            eq(japonServiceJob.customerId, input.id),
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

      return {
        customer,
        currentCars,
        pastCars,
        jobs: jobs.map(
          ({ job, formenName, formenSurname, plate, vehicleType }) => ({
            ...job,
            plate,
            vehicleType,
            formenLabel: formenName
              ? `${formenName}${formenSurname ? ' ' + formenSurname : ''}`
              : null,
            services: servicesByJob.get(job.id) ?? [],
            parts: partsByJob.get(job.id) ?? [],
          })
        ),
      }
    }),

  /** Create customer only; customerNo is allocated automatically. */
  create: rbacProcedure(SCOPES.JAPON_OTO_CUSTOMER, PERMISSIONS.CREATE)
    .input(customerCoreInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const customerNo = await allocateCustomerNo(tx)
        const [newCustomer] = await tx
          .insert(japonCustomer)
          .values({
            customerNo,
            name: input.name.trim(),
            surname: input.surname.trim(),
            phone: input.phone.trim(),
            address: input.address,
            notes: input.notes,
          })
          .returning({
            id: japonCustomer.id,
            customerNo: japonCustomer.customerNo,
          })

        if (!newCustomer) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Müşteri oluşturulamadı',
          })
        }

        return newCustomer
      })
    }),

  /** Update only the customer's own fields. Cars/jobs handled by their own routers. */
  update: rbacProcedure(SCOPES.JAPON_OTO_CUSTOMER, PERMISSIONS.UPDATE)
    .input(
      customerCoreInput
        .extend({ id: uuidZ })
        .strict()
        .refine((data) => !('customerNo' in data), {
          message: 'Müşteri numarası düzenlenemez',
        })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: japonCustomer.id })
        .from(japonCustomer)
        .where(
          and(eq(japonCustomer.id, input.id), excludeDeleted(japonCustomer))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Müşteri bulunamadı',
        })
      }

      await ctx.db
        .update(japonCustomer)
        .set({
          name: input.name.trim(),
          surname: input.surname.trim(),
          phone: input.phone.trim(),
          address: input.address,
          notes: input.notes,
        })
        .where(eq(japonCustomer.id, input.id))

      return { id: input.id }
    }),

  /** Soft-delete cascade: customer + all cars + all jobs + all parts. */
  delete: rbacProcedure(SCOPES.JAPON_OTO_CUSTOMER, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: japonCustomer.id })
        .from(japonCustomer)
        .where(
          and(eq(japonCustomer.id, input.id), excludeDeleted(japonCustomer))
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Müşteri bulunamadı',
        })
      }

      await ctx.db.transaction(async (tx) => {
        const cars = await tx
          .select({ id: japonCar.id })
          .from(japonCar)
          .where(
            and(eq(japonCar.customerId, input.id), excludeDeleted(japonCar))
          )
        const carIds = cars.map((c) => c.id)

        const jobs = carIds.length
          ? await tx
              .select({ id: japonServiceJob.id })
              .from(japonServiceJob)
              .where(
                and(
                  sql`${japonServiceJob.carId} IN ${carIds}`,
                  excludeDeleted(japonServiceJob)
                )
              )
          : []
        const jobIds = jobs.map((j) => j.id)

        if (jobIds.length > 0) {
          await tx
            .update(japonPart)
            .set(ctx.audit.softDelete(japonPart))
            .where(
              and(
                sql`${japonPart.serviceJobId} IN ${jobIds}`,
                excludeDeleted(japonPart)
              )
            )
          await tx
            .update(japonServiceJob)
            .set(ctx.audit.softDelete(japonServiceJob))
            .where(sql`${japonServiceJob.id} IN ${jobIds}`)
        }
        if (carIds.length > 0) {
          await tx
            .update(japonCar)
            .set(ctx.audit.softDelete(japonCar))
            .where(sql`${japonCar.id} IN ${carIds}`)
        }
        await tx
          .update(japonCustomer)
          .set(ctx.audit.softDelete(japonCustomer))
          .where(eq(japonCustomer.id, input.id))
      })

      return { ok: true as const }
    }),
})
