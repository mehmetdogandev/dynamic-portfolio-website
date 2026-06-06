import type { db as DbType } from '@/lib/db'
import { japonCustomer } from '@/lib/db/schema'
import { allocateCustomerNoAt } from '@/lib/japon/customer-number'
import { BASE_CUSTOMERS } from './fixtures'
import { addDays, addMonths } from './helpers'
import type { SeedContext } from './types'

type Db = typeof DbType

const CUSTOMER_SPACING_DAYS = 14

export async function seedPhase1Customers(
  database: Db,
  ctx: SeedContext
): Promise<void> {
  const anchor = addMonths(new Date(), -22)

  for (const [index, fixture] of BASE_CUSTOMERS.entries()) {
    const registeredAt = addDays(anchor, index * CUSTOMER_SPACING_DAYS)

    const customerNo = await database.transaction(async (tx) =>
      allocateCustomerNoAt(tx, registeredAt)
    )

    const [row] = await database
      .insert(japonCustomer)
      .values({
        customerNo,
        name: fixture.name,
        surname: fixture.surname,
        phone: fixture.phone,
        address: fixture.address,
        notes: fixture.notes ?? null,
        createdAt: registeredAt,
        updatedAt: registeredAt,
      })
      .returning({ id: japonCustomer.id })

    if (!row) {
      throw new Error(
        `japon demo seed phase-1: insert failed for ${fixture.key}`
      )
    }

    ctx.customerIdByKey.set(fixture.key, row.id)
    ctx.stats.customers += 1
  }
}
