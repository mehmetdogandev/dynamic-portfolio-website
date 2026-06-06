import type { db as DbType } from '@/lib/db'
import { INITIAL_CARS } from './fixtures'
import {
  buildJobTemplate,
  insertServiceJob,
  spreadDatesInRange,
} from './helpers'
import { carTimelineByPlate } from './phase-2-cars'
import type { SeedContext } from './types'

type Db = typeof DbType

const STORY_JOBS_PER_FIRST_PERIOD = 5

export async function seedPhase3InitialJobs(
  database: Db,
  ctx: SeedContext
): Promise<void> {
  const { serviceIdByName, formenIdByFullName } = ctx

  for (const fixture of INITIAL_CARS) {
    const meta = carTimelineByPlate.get(fixture.plate)
    const carId = ctx.carIdByPlate.get(fixture.plate)
    const customerId = ctx.customerIdByKey.get(fixture.ownerKey)
    if (!meta || !carId || !customerId) continue

    if (meta.isStoryPlate) {
      const periodStart = meta.periodStarts[0]!
      const periodEnd = meta.periodStarts[1] ?? new Date()
      const jobDates = spreadDatesInRange(
        periodStart,
        periodEnd,
        STORY_JOBS_PER_FIRST_PERIOD
      )

      let km = meta.initialKm
      for (let j = 0; j < STORY_JOBS_PER_FIRST_PERIOD; j++) {
        km += 800 + j * 120
        const template = buildJobTemplate(j, 0, false)
        const { partCount } = await insertServiceJob(database, {
          customerId,
          carId,
          kmAtVisit: km,
          template,
          jobDate: jobDates[j]!,
          serviceIdByName,
          formenIdByFullName,
        })
        ctx.stats.jobs += 1
        ctx.stats.parts += partCount
      }
      continue
    }

    const plateHash = fixture.plate.length + fixture.plate.charCodeAt(0)
    if (plateHash % 3 === 0) {
      continue
    }

    const jobDate = new Date(
      meta.firstOwnerStartedAt.getTime() + 20 * 86_400_000
    )
    const template = buildJobTemplate(0, 0, false)
    const { partCount } = await insertServiceJob(database, {
      customerId,
      carId,
      kmAtVisit: meta.initialKm + 500,
      template,
      jobDate,
      serviceIdByName,
      formenIdByFullName,
    })
    ctx.stats.jobs += 1
    ctx.stats.parts += partCount
  }
}
