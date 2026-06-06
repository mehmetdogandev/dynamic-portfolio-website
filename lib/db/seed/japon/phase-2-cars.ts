import { and, eq, isNull } from 'drizzle-orm'
import type { db as DbType } from '@/lib/db'
import { japonCar, japonCarOwnership } from '@/lib/db/schema'
import { INITIAL_CARS, STORY_PLATES } from './fixtures'
import { addDays, addMonths } from './helpers'
import type { SeedContext } from './types'

type Db = typeof DbType

const STORY_PERIOD_MONTHS = 6
const STORY_OWNER_COUNT = 6

/** Car registration shortly after owner's customer registration. */
const CAR_OFFSET_DAYS = 7

export type CarTimelineMeta = {
  plate: string
  carId: string
  isStoryPlate: boolean
  initialKm: number
  /** First ownership period start (also car createdAt). */
  firstOwnerStartedAt: Date
  /** For story plates: 6 period boundaries [start0..start5, end=now]. */
  periodStarts: Date[]
}

export const carTimelineByPlate = new Map<string, CarTimelineMeta>()

export async function seedPhase2Cars(
  database: Db,
  ctx: SeedContext
): Promise<void> {
  const now = new Date()
  const storyHistoryStart = addMonths(
    now,
    -(STORY_PERIOD_MONTHS * (STORY_OWNER_COUNT - 1))
  )

  for (const fixture of INITIAL_CARS) {
    const ownerId = ctx.customerIdByKey.get(fixture.ownerKey)
    if (!ownerId) {
      throw new Error(
        `japon demo seed phase-2: unknown owner key ${fixture.ownerKey}`
      )
    }

    const existing = await database
      .select({ id: japonCar.id })
      .from(japonCar)
      .where(and(eq(japonCar.plate, fixture.plate), isNull(japonCar.deletedAt)))
      .limit(1)
    if (existing.length > 0) {
      console.log(`Skip duplicate plate ${fixture.plate}`)
      continue
    }

    const isStory =
      fixture.isStoryPlate ??
      (STORY_PLATES as readonly string[]).includes(fixture.plate)
    let firstOwnerStartedAt: Date

    if (isStory) {
      firstOwnerStartedAt = storyHistoryStart
    } else {
      const ownerIndex = [...ctx.customerIdByKey.keys()].indexOf(
        fixture.ownerKey
      )
      firstOwnerStartedAt = addDays(
        addMonths(now, -22),
        Math.max(0, ownerIndex) * 14 + CAR_OFFSET_DAYS
      )
    }

    const [newCar] = await database
      .insert(japonCar)
      .values({
        customerId: ownerId,
        plate: fixture.plate,
        vehicleType: fixture.vehicleType,
        color: fixture.color,
        km: fixture.initialKm,
        notes: fixture.notes ?? null,
        createdAt: firstOwnerStartedAt,
        updatedAt: firstOwnerStartedAt,
      })
      .returning({ id: japonCar.id })

    if (!newCar) {
      throw new Error(
        `japon demo seed phase-2: car insert failed (${fixture.plate})`
      )
    }

    await database.insert(japonCarOwnership).values({
      carId: newCar.id,
      customerId: ownerId,
      startedAt: firstOwnerStartedAt,
      endedAt: null,
      createdAt: firstOwnerStartedAt,
      updatedAt: firstOwnerStartedAt,
    })

    ctx.stats.cars += 1
    ctx.stats.ownershipRows += 1
    ctx.carIdByPlate.set(fixture.plate, newCar.id)

    const periodStarts: Date[] = []
    if (isStory) {
      for (let p = 0; p < STORY_OWNER_COUNT; p++) {
        periodStarts.push(addMonths(storyHistoryStart, STORY_PERIOD_MONTHS * p))
      }
    }

    carTimelineByPlate.set(fixture.plate, {
      plate: fixture.plate,
      carId: newCar.id,
      isStoryPlate: isStory,
      initialKm: fixture.initialKm,
      firstOwnerStartedAt,
      periodStarts,
    })
  }
}
