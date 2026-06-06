import { eq } from 'drizzle-orm'
import type { db as DbType } from '@/lib/db'
import { japonCar } from '@/lib/db/schema'
import { STORY_PLATES, TRANSFER_CUSTOMERS } from './fixtures'
import {
  addMonths,
  allocateAndInsertCustomer,
  buildJobTemplate,
  closeOpenOwnership,
  insertServiceJob,
  openOwnershipPeriod,
  spreadDatesInRange,
} from './helpers'
import { carTimelineByPlate } from './phase-2-cars'
import type { SeedContext } from './types'

type Db = typeof DbType

const TRANSFER_ITERATIONS = 5
const JOBS_PER_PERIOD = 5

/** Owner key sequence per story plate (6 owners = initial + 5 transfers). */
const STORY_OWNER_KEYS: Record<(typeof STORY_PLATES)[number], string[]> = {
  '68 DEMO 001': ['ali', 'ayse', 'mehmet', 'fatma', 'hasan', 'zeynep'],
  '34 DEMO 002': [
    'ayse',
    'mehmet',
    'fatma',
    'hasan',
    'transfer_1',
    'transfer_2',
  ],
  '06 DEMO 003': [
    'mehmet',
    'fatma',
    'hasan',
    'transfer_3',
    'transfer_4',
    'transfer_5',
  ],
}

export async function seedPhase4OwnershipChains(
  database: Db,
  ctx: SeedContext
): Promise<void> {
  const { serviceIdByName, formenIdByFullName } = ctx
  const now = new Date()

  for (const plate of STORY_PLATES) {
    const meta = carTimelineByPlate.get(plate)
    if (!meta?.isStoryPlate) continue

    const ownerKeys = STORY_OWNER_KEYS[plate]

    for (let transfer = 0; transfer < TRANSFER_ITERATIONS; transfer++) {
      const periodIndex = transfer + 1
      const periodStart = meta.periodStarts[periodIndex]!
      const periodEnd =
        meta.periodStarts[periodIndex + 1] ?? addMonths(periodStart, 6)
      const ownerKey = ownerKeys[periodIndex]
      if (!ownerKey) {
        throw new Error(`japon demo seed phase-4: missing owner for ${plate}`)
      }

      await closeOpenOwnership(database, meta.carId, periodStart)

      let customerId = ctx.customerIdByKey.get(ownerKey)
      if (!customerId) {
        const transferFixture = TRANSFER_CUSTOMERS.find(
          (c) => c.key === ownerKey
        )
        if (!transferFixture) {
          throw new Error(
            `japon demo seed phase-4: unknown transfer customer ${ownerKey}`
          )
        }
        const inserted = await allocateAndInsertCustomer(database, {
          name: transferFixture.name,
          surname: transferFixture.surname,
          phone: transferFixture.phone,
          address: transferFixture.address,
          notes: transferFixture.notes ?? null,
          registeredAt: periodStart,
        })
        customerId = inserted.id
        ctx.customerIdByKey.set(ownerKey, customerId)
        ctx.stats.customers += 1
      }

      await openOwnershipPeriod(database, {
        carId: meta.carId,
        customerId,
        startedAt: periodStart,
      })
      ctx.stats.ownershipRows += 1

      const isCurrentPeriod = periodIndex === ownerKeys.length - 1
      const jobDates = spreadDatesInRange(
        periodStart,
        periodEnd,
        JOBS_PER_PERIOD
      )
      let km = meta.initialKm + periodIndex * 5_000 + transfer * 800

      for (let j = 0; j < JOBS_PER_PERIOD; j++) {
        km += 600 + j * 90
        const template = buildJobTemplate(j, periodIndex, isCurrentPeriod)
        const jobDate = jobDates[j]!
        const safeDate = jobDate > now ? addMonths(periodStart, 1) : jobDate

        const { partCount } = await insertServiceJob(database, {
          customerId,
          carId: meta.carId,
          kmAtVisit: km,
          template,
          jobDate: safeDate,
          serviceIdByName,
          formenIdByFullName,
        })
        ctx.stats.jobs += 1
        ctx.stats.parts += partCount
      }

      if (isCurrentPeriod) {
        await database
          .update(japonCar)
          .set({ km, updatedAt: now })
          .where(eq(japonCar.id, meta.carId))
      }
    }
  }
}
