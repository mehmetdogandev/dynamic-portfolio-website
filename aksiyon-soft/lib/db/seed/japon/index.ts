import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { japonCustomer } from '@/lib/db/schema'
import { loadCatalogMaps } from './helpers'
import { seedPhase1Customers } from './phase-1-customers'
import { carTimelineByPlate, seedPhase2Cars } from './phase-2-cars'
import { seedPhase3InitialJobs } from './phase-3-initial-jobs'
import { seedPhase4OwnershipChains } from './phase-4-ownership-chains'
import type { SeedContext } from './types'

function createSeedContext(
  serviceIdByName: Map<string, string>,
  formenIdByFullName: Map<string, string>
): SeedContext {
  return {
    customerIdByKey: new Map(),
    carIdByPlate: new Map(),
    serviceIdByName,
    formenIdByFullName,
    stats: {
      customers: 0,
      cars: 0,
      jobs: 0,
      parts: 0,
      ownershipRows: 0,
    },
  }
}

export async function runJaponDemoSeed(): Promise<void> {
  const [row] = await db
    .select({ n: count() })
    .from(japonCustomer)
    .where(isNull(japonCustomer.deletedAt))

  if ((row?.n ?? 0) > 0) {
    console.log('Skip japon demo seed: japon_customers table already populated')
    return
  }

  const { serviceIdByName, formenIdByFullName } = await loadCatalogMaps(db)
  const ctx = createSeedContext(serviceIdByName, formenIdByFullName)

  carTimelineByPlate.clear()

  await seedPhase1Customers(db, ctx)
  await seedPhase2Cars(db, ctx)
  await seedPhase3InitialJobs(db, ctx)
  await seedPhase4OwnershipChains(db, ctx)

  console.log(
    `✓ Japon demo seed: ${ctx.stats.customers} customers, ${ctx.stats.cars} cars, ` +
      `${ctx.stats.ownershipRows} ownership rows, ${ctx.stats.jobs} jobs, ${ctx.stats.parts} parts`
  )
}
