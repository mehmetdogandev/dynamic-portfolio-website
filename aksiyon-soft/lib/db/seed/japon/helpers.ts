import { and, eq, isNull } from 'drizzle-orm'
import type { db as DbType } from '@/lib/db'
import {
  japonCar,
  japonCarOwnership,
  japonCustomer,
  japonFormen,
  japonPart,
  japonService,
  japonServiceJob,
  japonServiceJobService,
} from '@/lib/db/schema'
import { allocateCustomerNoAt } from '@/lib/japon/customer-number'
import { FORMEN_NAMES, PART_CATALOG, SERVICE_NAMES } from './fixtures'
import type { JobSeedTemplate, PartSeed } from './types'

type Db = typeof DbType

const MS_PER_DAY = 86_400_000

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

/** Linear interpolation between start (inclusive) and end (exclusive-ish). */
export function dateAtFraction(start: Date, end: Date, fraction: number): Date {
  const t = Math.min(1, Math.max(0, fraction))
  return new Date(start.getTime() + (end.getTime() - start.getTime()) * t)
}

/** Spread `count` dates evenly inside [start, end]. */
export function spreadDatesInRange(
  start: Date,
  end: Date,
  count: number
): Date[] {
  if (count <= 0) return []
  if (count === 1) return [dateAtFraction(start, end, 0.5)]
  return Array.from({ length: count }, (_, i) =>
    dateAtFraction(start, end, i / (count - 1))
  )
}

export async function loadCatalogMaps(database: Db): Promise<{
  serviceIdByName: Map<string, string>
  formenIdByFullName: Map<string, string>
}> {
  const services = await database
    .select({ id: japonService.id, name: japonService.name })
    .from(japonService)
    .where(isNull(japonService.deletedAt))
  const serviceIdByName = new Map(services.map((s) => [s.name, s.id]))

  const formens = await database
    .select({
      id: japonFormen.id,
      name: japonFormen.name,
      surname: japonFormen.surname,
    })
    .from(japonFormen)
    .where(isNull(japonFormen.deletedAt))
  const formenIdByFullName = new Map(
    formens.map((f) => [f.surname ? `${f.name} ${f.surname}` : f.name, f.id])
  )

  return { serviceIdByName, formenIdByFullName }
}

export function pickParts(seed: number, count: number): PartSeed[] {
  const n = Math.min(5, Math.max(4, count))
  return Array.from({ length: n }, (_, i) => {
    const catalog = PART_CATALOG[(seed + i) % PART_CATALOG.length]!
    return {
      brand: catalog.brand,
      partNo: catalog.partNo,
      partName: catalog.partName,
      quantity: 1 + (i % 2),
      unitPrice: catalog.unitPrice,
    }
  })
}

export function buildJobTemplate(
  jobIndex: number,
  periodIndex: number,
  isCurrentPeriod: boolean
): JobSeedTemplate {
  const formen = FORMEN_NAMES[jobIndex % FORMEN_NAMES.length] ?? null
  const serviceA = SERVICE_NAMES[jobIndex % SERVICE_NAMES.length]!
  const serviceB = SERVICE_NAMES[(jobIndex + 2) % SERVICE_NAMES.length]!
  const parts = pickParts(periodIndex * 10 + jobIndex, 4 + (jobIndex % 2))

  let status: JobSeedTemplate['status'] = 'completed'
  if (isCurrentPeriod && jobIndex === 4) {
    status = 'in_progress'
  } else if (!isCurrentPeriod && periodIndex === 2 && jobIndex === 3) {
    status = 'cancelled'
  }

  return {
    formen,
    serviceNames: [serviceA, serviceB],
    parts,
    notes:
      status === 'in_progress'
        ? 'Parça bekleniyor — işlem devam ediyor.'
        : status === 'cancelled'
          ? 'Müşteri randevuyu iptal etti.'
          : undefined,
    status,
  }
}

export type InsertServiceJobParams = {
  customerId: string
  carId: string
  kmAtVisit: number
  template: JobSeedTemplate
  jobDate: Date
  serviceIdByName: Map<string, string>
  formenIdByFullName: Map<string, string>
}

export async function insertServiceJob(
  database: Db,
  params: InsertServiceJobParams
): Promise<{ jobId: string; partCount: number }> {
  const {
    customerId,
    carId,
    kmAtVisit,
    template,
    jobDate,
    serviceIdByName,
    formenIdByFullName,
  } = params

  const status = template.status ?? 'completed'
  const isCompleted = status === 'completed'
  const isCancelled = status === 'cancelled'
  const isInProgress = status === 'in_progress'

  const formenId = template.formen
    ? (formenIdByFullName.get(template.formen) ?? null)
    : null

  const partTotal = template.parts.reduce(
    (sum, p) => sum + Number(p.unitPrice) * p.quantity,
    0
  )
  const serviceFee = isCompleted
    ? (Math.round(partTotal * 0.1 * 100) / 100).toFixed(2)
    : null

  const [customerSnapshot, carSnapshot] = await Promise.all([
    database
      .select({
        name: japonCustomer.name,
        surname: japonCustomer.surname,
        customerNo: japonCustomer.customerNo,
      })
      .from(japonCustomer)
      .where(
        and(eq(japonCustomer.id, customerId), isNull(japonCustomer.deletedAt))
      )
      .limit(1)
      .then((rows) => rows[0]),
    database
      .select({ plate: japonCar.plate })
      .from(japonCar)
      .where(and(eq(japonCar.id, carId), isNull(japonCar.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]),
  ])

  if (!customerSnapshot || !carSnapshot) {
    throw new Error('japon demo seed: snapshot source not found')
  }

  const startedAt =
    isInProgress || (isCompleted && template.serviceNames.length > 0)
      ? addDays(jobDate, -1)
      : null
  const completedAt = isCompleted ? jobDate : null

  const [newJob] = await database
    .insert(japonServiceJob)
    .values({
      customerId,
      carId,
      formenId,
      kmAtVisit,
      notes: template.notes ?? null,
      isCompleted,
      isCancelled,
      serviceFee,
      startedAt,
      completedAt,
      customerNameSnapshot: customerSnapshot.name,
      customerSurnameSnapshot: customerSnapshot.surname,
      customerNoSnapshot: customerSnapshot.customerNo,
      carPlateSnapshot: carSnapshot.plate,
      createdAt: jobDate,
      updatedAt: jobDate,
    })
    .returning({ id: japonServiceJob.id })

  if (!newJob) {
    throw new Error('japon demo seed: service job insert failed')
  }

  for (const serviceName of template.serviceNames) {
    const serviceId = serviceIdByName.get(serviceName)
    if (!serviceId) {
      throw new Error(`japon demo seed: service not found (${serviceName})`)
    }
    await database.insert(japonServiceJobService).values({
      serviceJobId: newJob.id,
      serviceId,
    })
  }

  let partCount = 0
  for (const [index, part] of template.parts.entries()) {
    await database.insert(japonPart).values({
      serviceJobId: newJob.id,
      brand: part.brand,
      partNo: part.partNo,
      partName: part.partName,
      quantity: part.quantity,
      unitPrice: part.unitPrice,
      sortOrder: index,
      createdAt: jobDate,
      updatedAt: jobDate,
    })
    partCount += 1
  }

  return { jobId: newJob.id, partCount }
}

export async function closeOpenOwnership(
  database: Db,
  carId: string,
  endedAt: Date
): Promise<void> {
  await database
    .update(japonCarOwnership)
    .set({ endedAt, updatedAt: endedAt })
    .where(
      and(eq(japonCarOwnership.carId, carId), isNull(japonCarOwnership.endedAt))
    )
}

export async function openOwnershipPeriod(
  database: Db,
  params: {
    carId: string
    customerId: string
    startedAt: Date
  }
): Promise<void> {
  const { carId, customerId, startedAt } = params
  await database.insert(japonCarOwnership).values({
    carId,
    customerId,
    startedAt,
    endedAt: null,
    createdAt: startedAt,
    updatedAt: startedAt,
  })

  await database
    .update(japonCar)
    .set({
      customerId,
      updatedAt: startedAt,
    })
    .where(eq(japonCar.id, carId))
}

export async function allocateAndInsertCustomer(
  database: Db,
  params: {
    name: string
    surname: string
    phone: string
    address: string | null
    notes?: string | null
    registeredAt: Date
  }
): Promise<{ id: string; customerNo: string }> {
  const customerNo = await database.transaction(async (tx) =>
    allocateCustomerNoAt(tx, params.registeredAt)
  )

  const [row] = await database
    .insert(japonCustomer)
    .values({
      customerNo,
      name: params.name,
      surname: params.surname,
      phone: params.phone,
      address: params.address,
      notes: params.notes ?? null,
      createdAt: params.registeredAt,
      updatedAt: params.registeredAt,
    })
    .returning({ id: japonCustomer.id, customerNo: japonCustomer.customerNo })

  if (!row) {
    throw new Error('japon demo seed: customer insert failed')
  }

  return { id: row.id, customerNo: row.customerNo }
}

export { allocateCustomerNoAt }
