import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, isNotNull, isNull, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import {
  PERMISSIONS,
  SCOPES,
  japonCar,
  japonCustomer,
  japonFormen,
  japonPart,
  japonService,
  japonServiceJob,
  japonServiceJobService,
} from '@/lib/db/schema'
import {
  applyColumnFilters,
  createMultiColumnSearch,
  excludeDeleted,
} from '@/lib/db/utils'
import { transferCarOwnership } from '@/lib/japon/ownership'
import { paginatedListResponse } from '../admin-list'
import { createAdminListSchema, rbacProcedure, router } from '../index'
import type { DB } from '@/lib/db'
import {
  getJaponJobStatus,
  PRICE_REGEX,
  type JaponJobStatus,
} from '@/lib/japon/service-job-status'
const uuidZ = z.uuid()

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))

export const japonPartInput = z.object({
  brand: optionalTrimmed,
  partNo: optionalTrimmed,
  partName: z.string().trim().min(1, 'Parça adı gerekli'),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.string().regex(PRICE_REGEX, 'Geçersiz fiyat'),
})

const operationJobInput = z.object({
  customerId: uuidZ,
  carId: uuidZ,
  transferOwnership: z.boolean().default(false),
  formenId: uuidZ.nullable().optional(),
  kmAtVisit: z.number().int().min(0).default(0),
  notes: optionalTrimmed,
  isCompleted: z.boolean().default(false),
  serviceIds: z.array(uuidZ).default([]),
  parts: z.array(japonPartInput).default([]),
})

const jobCoreInput = z.object({
  customerId: uuidZ,
  carId: uuidZ,
  formenId: uuidZ.nullable().optional(),
  kmAtVisit: z.number().int().min(0).default(0),
  notes: optionalTrimmed,
  isCompleted: z.boolean().default(false),
})

const LOCKED_JOB_MESSAGE = 'Tamamlanmış veya iptal edilmiş kayıt düzenlenemez'

async function getJobContext(ctx: { db: DB }, jobId: string) {
  const job = await ctx.db
    .select()
    .from(japonServiceJob)
    .where(and(eq(japonServiceJob.id, jobId), excludeDeleted(japonServiceJob)))
    .limit(1)
    .then((rows) => rows[0])

  if (!job) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Servis kaydı bulunamadı',
    })
  }

  const servicesCountRow = await ctx.db
    .select({ total: count() })
    .from(japonServiceJobService)
    .where(eq(japonServiceJobService.serviceJobId, jobId))
    .limit(1)
    .then((rows) => rows[0] ?? { total: 0 })

  const status = getJaponJobStatus({
    isCompleted: job.isCompleted,
    isCancelled: job.isCancelled,
    startedAt: job.startedAt,
    servicesCount: servicesCountRow.total,
  })

  return { job, servicesCount: servicesCountRow.total, status }
}

function assertJobEditable(job: {
  isCompleted: boolean
  isCancelled: boolean
}) {
  if (job.isCompleted || job.isCancelled) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: LOCKED_JOB_MESSAGE,
    })
  }
}

export const japonServiceJobRouter = router({
  list: rbacProcedure(SCOPES.JAPON_OTO_OPERATIONS, PERMISSIONS.READ)
    .input(createAdminListSchema(['createdAt', 'completedAt', 'startedAt']))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: SQL[] = [excludeDeleted(japonServiceJob)]
      const statusFilter = columnFilters?.status?.trim()
      const formenFilter = columnFilters?.formen?.trim()

      if (search) {
        conditions.push(
          or(
            createMultiColumnSearch(
              [
                japonCustomer.name,
                japonCustomer.surname,
                japonCustomer.customerNo,
              ],
              search
            ),
            createMultiColumnSearch([japonCar.plate], search)
          )!
        )
      }

      if (statusFilter) {
        if (statusFilter === 'completed') {
          conditions.push(eq(japonServiceJob.isCompleted, true))
        } else if (statusFilter === 'cancelled') {
          conditions.push(eq(japonServiceJob.isCancelled, true))
        } else if (statusFilter === 'in_progress') {
          conditions.push(
            and(
              eq(japonServiceJob.isCompleted, false),
              eq(japonServiceJob.isCancelled, false),
              isNotNull(japonServiceJob.startedAt)
            )!
          )
        } else if (statusFilter === 'none') {
          conditions.push(
            and(
              eq(japonServiceJob.isCompleted, false),
              eq(japonServiceJob.isCancelled, false),
              isNull(japonServiceJob.startedAt)
            )!
          )
        }
      }

      if (formenFilter) {
        conditions.push(
          createMultiColumnSearch(
            [japonFormen.name, japonFormen.surname],
            formenFilter
          )
        )
      }

      applyColumnFilters(conditions, columnFilters, {
        createdAt: japonServiceJob.createdAt,
        completedAt: japonServiceJob.completedAt,
        startedAt: japonServiceJob.startedAt,
      })

      const whereCondition = and(...conditions)
      const orderFn = sortOrder === 'asc' ? asc : desc
      const sortColumn = {
        createdAt: japonServiceJob.createdAt,
        completedAt: japonServiceJob.completedAt,
        startedAt: japonServiceJob.startedAt,
      }[sortBy]

      const [rows, totalResult] = await Promise.all([
        ctx.db
          .select({
            id: japonServiceJob.id,
            customerId: japonServiceJob.customerId,
            carId: japonServiceJob.carId,
            kmAtVisit: japonServiceJob.kmAtVisit,
            isCompleted: japonServiceJob.isCompleted,
            isCancelled: japonServiceJob.isCancelled,
            serviceFee: japonServiceJob.serviceFee,
            startedAt: japonServiceJob.startedAt,
            completedAt: japonServiceJob.completedAt,
            createdAt: japonServiceJob.createdAt,
            customerNameSnapshot: japonServiceJob.customerNameSnapshot,
            customerSurnameSnapshot: japonServiceJob.customerSurnameSnapshot,
            customerNoSnapshot: japonServiceJob.customerNoSnapshot,
            carPlateSnapshot: japonServiceJob.carPlateSnapshot,
            customerName: japonCustomer.name,
            customerSurname: japonCustomer.surname,
            customerNo: japonCustomer.customerNo,
            plate: japonCar.plate,
            formenName: japonFormen.name,
            formenSurname: japonFormen.surname,
          })
          .from(japonServiceJob)
          .innerJoin(
            japonCustomer,
            eq(japonCustomer.id, japonServiceJob.customerId)
          )
          .innerJoin(japonCar, eq(japonCar.id, japonServiceJob.carId))
          .leftJoin(japonFormen, eq(japonFormen.id, japonServiceJob.formenId))
          .where(whereCondition)
          .orderBy(orderFn(sortColumn), desc(japonServiceJob.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: count() })
          .from(japonServiceJob)
          .innerJoin(
            japonCustomer,
            eq(japonCustomer.id, japonServiceJob.customerId)
          )
          .innerJoin(japonCar, eq(japonCar.id, japonServiceJob.carId))
          .where(whereCondition),
      ])

      const data = await Promise.all(
        rows.map(async (row) => {
          const servicesCountRow = await ctx.db
            .select({ total: count() })
            .from(japonServiceJobService)
            .where(eq(japonServiceJobService.serviceJobId, row.id))
            .limit(1)
            .then((r) => r[0] ?? { total: 0 })

          const status = getJaponJobStatus({
            isCompleted: row.isCompleted,
            isCancelled: row.isCancelled,
            startedAt: row.startedAt,
            servicesCount: servicesCountRow.total,
          })

          return {
            ...row,
            customerName: row.customerNameSnapshot ?? row.customerName,
            customerSurname: row.customerSurnameSnapshot ?? row.customerSurname,
            customerNo: row.customerNoSnapshot ?? row.customerNo,
            plate: row.carPlateSnapshot ?? row.plate,
            status,
            formenLabel: row.formenName
              ? `${row.formenName}${row.formenSurname ? ' ' + row.formenSurname : ''}`
              : null,
          }
        })
      )

      return paginatedListResponse(
        data,
        totalResult[0]?.count ?? 0,
        page,
        limit
      )
    }),

  listByCustomer: rbacProcedure(SCOPES.JAPON_OTO_CUSTOMER, PERMISSIONS.READ)
    .input(z.object({ customerId: uuidZ }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: japonServiceJob.id,
          carId: japonServiceJob.carId,
          plate: japonCar.plate,
          formenId: japonServiceJob.formenId,
          formenName: japonFormen.name,
          formenSurname: japonFormen.surname,
          kmAtVisit: japonServiceJob.kmAtVisit,
          notes: japonServiceJob.notes,
          isCompleted: japonServiceJob.isCompleted,
          isCancelled: japonServiceJob.isCancelled,
          serviceFee: japonServiceJob.serviceFee,
          startedAt: japonServiceJob.startedAt,
          completedAt: japonServiceJob.completedAt,
          createdAt: japonServiceJob.createdAt,
        })
        .from(japonServiceJob)
        .innerJoin(japonCar, eq(japonCar.id, japonServiceJob.carId))
        .leftJoin(japonFormen, eq(japonFormen.id, japonServiceJob.formenId))
        .where(
          and(
            eq(japonServiceJob.customerId, input.customerId),
            excludeDeleted(japonServiceJob)
          )
        )
        .orderBy(desc(japonServiceJob.createdAt))
    }),

  getById: rbacProcedure(SCOPES.JAPON_OTO_OPERATIONS, PERMISSIONS.READ)
    .input(z.object({ id: uuidZ }))
    .query(async ({ ctx, input }) => {
      const { job, servicesCount, status } = await getJobContext(ctx, input.id)

      const services = await ctx.db
        .select({
          id: japonService.id,
          name: japonService.name,
        })
        .from(japonServiceJobService)
        .innerJoin(
          japonService,
          eq(japonService.id, japonServiceJobService.serviceId)
        )
        .where(eq(japonServiceJobService.serviceJobId, input.id))

      const parts = await ctx.db
        .select()
        .from(japonPart)
        .where(
          and(eq(japonPart.serviceJobId, input.id), excludeDeleted(japonPart))
        )
        .orderBy(asc(japonPart.sortOrder), asc(japonPart.createdAt))

      return { job, services, parts, servicesCount, status }
    }),

  createFromOperation: rbacProcedure(
    SCOPES.JAPON_OTO_OPERATIONS,
    PERMISSIONS.CREATE
  )
    .input(operationJobInput)
    .mutation(async ({ ctx, input }) => {
      const car = await ctx.db
        .select({
          id: japonCar.id,
          customerId: japonCar.customerId,
          plate: japonCar.plate,
        })
        .from(japonCar)
        .where(and(eq(japonCar.id, input.carId), excludeDeleted(japonCar)))
        .limit(1)
        .then((rows) => rows[0])

      if (!car) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Araç bulunamadı',
        })
      }

      const customer = await ctx.db
        .select({
          id: japonCustomer.id,
          name: japonCustomer.name,
          surname: japonCustomer.surname,
          customerNo: japonCustomer.customerNo,
        })
        .from(japonCustomer)
        .where(
          and(
            eq(japonCustomer.id, input.customerId),
            excludeDeleted(japonCustomer)
          )
        )
        .limit(1)
        .then((rows) => rows[0])

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Müşteri bulunamadı',
        })
      }

      if (car.customerId !== input.customerId) {
        if (!input.transferOwnership) {
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'Bu plaka başka bir müşteriye kayıtlı. Sahiplik devri onayı gerekli.',
          })
        }
      }

      const startedAt = input.serviceIds.length > 0 ? new Date() : null

      return await ctx.db.transaction(async (tx) => {
        if (car.customerId !== input.customerId) {
          await transferCarOwnership(tx, {
            carId: input.carId,
            newCustomerId: input.customerId,
          })
        }

        const [newJob] = await tx
          .insert(japonServiceJob)
          .values({
            customerId: input.customerId,
            carId: input.carId,
            formenId: input.formenId ?? null,
            kmAtVisit: input.kmAtVisit,
            notes: input.notes,
            isCompleted: input.isCompleted,
            startedAt,
            customerNameSnapshot: customer.name,
            customerSurnameSnapshot: customer.surname,
            customerNoSnapshot: customer.customerNo,
            carPlateSnapshot: car.plate,
          })
          .returning({ id: japonServiceJob.id })

        if (!newJob) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'İşlem kaydı oluşturulamadı',
          })
        }

        if (input.serviceIds.length > 0) {
          await tx.insert(japonServiceJobService).values(
            input.serviceIds.map((serviceId) => ({
              serviceJobId: newJob.id,
              serviceId,
            }))
          )
        }

        if (input.parts.length > 0) {
          await tx.insert(japonPart).values(
            input.parts.map((p, index) => ({
              serviceJobId: newJob.id,
              brand: p.brand,
              partNo: p.partNo,
              partName: p.partName.trim(),
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              sortOrder: index,
            }))
          )
        }

        return { id: newJob.id }
      })
    }),

  create: rbacProcedure(SCOPES.JAPON_OTO_OPERATIONS, PERMISSIONS.CREATE)
    .input(
      jobCoreInput.extend({
        serviceIds: z.array(uuidZ).default([]),
        parts: z.array(japonPartInput).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const car = await ctx.db
        .select({
          id: japonCar.id,
          customerId: japonCar.customerId,
          plate: japonCar.plate,
        })
        .from(japonCar)
        .where(and(eq(japonCar.id, input.carId), excludeDeleted(japonCar)))
        .limit(1)
        .then((rows) => rows[0])
      if (!car || car.customerId !== input.customerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Geçersiz müşteri/araç kombinasyonu',
        })
      }

      const customer = await ctx.db
        .select({
          id: japonCustomer.id,
          name: japonCustomer.name,
          surname: japonCustomer.surname,
          customerNo: japonCustomer.customerNo,
        })
        .from(japonCustomer)
        .where(
          and(
            eq(japonCustomer.id, input.customerId),
            excludeDeleted(japonCustomer)
          )
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Müşteri bulunamadı',
        })
      }

      const startedAt = input.serviceIds.length > 0 ? new Date() : null

      return await ctx.db.transaction(async (tx) => {
        const [newJob] = await tx
          .insert(japonServiceJob)
          .values({
            customerId: input.customerId,
            carId: input.carId,
            formenId: input.formenId ?? null,
            kmAtVisit: input.kmAtVisit,
            notes: input.notes,
            isCompleted: input.isCompleted,
            startedAt,
            customerNameSnapshot: customer.name,
            customerSurnameSnapshot: customer.surname,
            customerNoSnapshot: customer.customerNo,
            carPlateSnapshot: car.plate,
          })
          .returning({ id: japonServiceJob.id })
        if (!newJob) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Servis kaydı oluşturulamadı',
          })
        }
        if (input.serviceIds.length > 0) {
          await tx.insert(japonServiceJobService).values(
            input.serviceIds.map((serviceId) => ({
              serviceJobId: newJob.id,
              serviceId,
            }))
          )
        }
        if (input.parts.length > 0) {
          await tx.insert(japonPart).values(
            input.parts.map((p, index) => ({
              serviceJobId: newJob.id,
              brand: p.brand,
              partNo: p.partNo,
              partName: p.partName.trim(),
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              sortOrder: index,
            }))
          )
        }
        return { id: newJob.id }
      })
    }),

  update: rbacProcedure(SCOPES.JAPON_OTO_OPERATIONS, PERMISSIONS.UPDATE)
    .input(
      jobCoreInput
        .partial({ customerId: true, carId: true })
        .extend({ id: uuidZ })
    )
    .mutation(async ({ ctx, input }) => {
      const { job } = await getJobContext(ctx, input.id)
      assertJobEditable(job)

      await ctx.db
        .update(japonServiceJob)
        .set({
          formenId: input.formenId ?? null,
          kmAtVisit: input.kmAtVisit,
          notes: input.notes,
        })
        .where(eq(japonServiceJob.id, input.id))

      return { id: input.id }
    }),

  transitionStatus: rbacProcedure(
    SCOPES.JAPON_OTO_OPERATIONS,
    PERMISSIONS.UPDATE
  )
    .input(
      z.object({
        jobId: uuidZ,
        action: z.enum(['continue', 'complete', 'cancel']),
        serviceFee: z
          .string()
          .regex(PRICE_REGEX, 'Geçersiz hizmet ücreti')
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { status } = await getJobContext(ctx, input.jobId)

      if (status === 'completed' || status === 'cancelled') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: LOCKED_JOB_MESSAGE,
        })
      }

      if (input.action === 'continue') {
        if (status !== 'none') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Bu kayıt zaten devam ediyor',
          })
        }
        await ctx.db
          .update(japonServiceJob)
          .set({ startedAt: new Date() })
          .where(eq(japonServiceJob.id, input.jobId))
        return { id: input.jobId, status: 'in_progress' as JaponJobStatus }
      }

      if (input.action === 'cancel') {
        if (status !== 'in_progress') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Yalnızca devam eden kayıtlar iptal edilebilir',
          })
        }
        await ctx.db
          .update(japonServiceJob)
          .set({ isCancelled: true })
          .where(eq(japonServiceJob.id, input.jobId))
        return { id: input.jobId, status: 'cancelled' as JaponJobStatus }
      }

      if (status !== 'none' && status !== 'in_progress') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Bu kayıt tamamlanamaz',
        })
      }

      if (!input.serviceFee) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Hizmet ücreti gerekli',
        })
      }

      await ctx.db
        .update(japonServiceJob)
        .set({
          isCompleted: true,
          serviceFee: input.serviceFee,
          completedAt: new Date(),
        })
        .where(eq(japonServiceJob.id, input.jobId))

      return { id: input.jobId, status: 'completed' as JaponJobStatus }
    }),

  setServices: rbacProcedure(SCOPES.JAPON_OTO_OPERATIONS, PERMISSIONS.UPDATE)
    .input(z.object({ jobId: uuidZ, serviceIds: z.array(uuidZ) }))
    .mutation(async ({ ctx, input }) => {
      const { job } = await getJobContext(ctx, input.jobId)
      assertJobEditable(job)

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(japonServiceJobService)
          .where(eq(japonServiceJobService.serviceJobId, input.jobId))
        if (input.serviceIds.length > 0) {
          await tx.insert(japonServiceJobService).values(
            input.serviceIds.map((serviceId) => ({
              serviceJobId: input.jobId,
              serviceId,
            }))
          )
        }
      })
      return { ok: true as const }
    }),

  setParts: rbacProcedure(SCOPES.JAPON_OTO_OPERATIONS, PERMISSIONS.UPDATE)
    .input(
      z.object({
        jobId: uuidZ,
        parts: z.array(japonPartInput),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { job } = await getJobContext(ctx, input.jobId)
      assertJobEditable(job)

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(japonPart)
          .set(ctx.audit.softDelete(japonPart))
          .where(
            and(
              eq(japonPart.serviceJobId, input.jobId),
              excludeDeleted(japonPart)
            )
          )
        if (input.parts.length > 0) {
          await tx.insert(japonPart).values(
            input.parts.map((p, index) => ({
              serviceJobId: input.jobId,
              brand: p.brand,
              partNo: p.partNo,
              partName: p.partName.trim(),
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              sortOrder: index,
            }))
          )
        }
      })
      return { ok: true as const }
    }),

  delete: rbacProcedure(SCOPES.JAPON_OTO_OPERATIONS, PERMISSIONS.DELETE)
    .input(z.object({ id: uuidZ }))
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db
        .select({ id: japonServiceJob.id })
        .from(japonServiceJob)
        .where(
          and(eq(japonServiceJob.id, input.id), excludeDeleted(japonServiceJob))
        )
        .limit(1)
        .then((rows) => rows[0])
      if (!exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Servis kaydı bulunamadı',
        })
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(japonPart)
          .set(ctx.audit.softDelete(japonPart))
          .where(
            and(eq(japonPart.serviceJobId, input.id), excludeDeleted(japonPart))
          )
        await tx
          .update(japonServiceJob)
          .set(ctx.audit.softDelete(japonServiceJob))
          .where(eq(japonServiceJob.id, input.id))
      })

      return { ok: true as const }
    }),
})
