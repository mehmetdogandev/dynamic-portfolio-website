import { and, count, eq, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  japonCar,
  japonCarOwnership,
  japonCustomer,
  japonServiceJob,
} from '@/lib/db/schema'
import { allocateCustomerNoAt } from '@/lib/japon/customer-number'
import { openCarOwnership } from '@/lib/japon/ownership'

/**
 * Backfill customerNo and ownership rows for existing data after schema upgrade.
 */
export async function seed() {
  const customersNeedingCustomerNoFix = await db
    .select({
      id: japonCustomer.id,
      createdAt: japonCustomer.createdAt,
    })
    .from(japonCustomer)
    .where(
      and(
        isNull(japonCustomer.deletedAt),
        or(
          sql`${japonCustomer.customerNo} IS NULL`,
          sql`${japonCustomer.customerNo} = ''`,
          sql`NOT (${japonCustomer.customerNo} ~ '^CT\\.[0-9]{6}\\.[0-9]{4}$')`
        )
      )
    )

  for (const row of customersNeedingCustomerNoFix) {
    await db.transaction(async (tx) => {
      const customerNo = await allocateCustomerNoAt(tx, row.createdAt)
      await tx
        .update(japonCustomer)
        .set({ customerNo })
        .where(eq(japonCustomer.id, row.id))
    })
  }

  if (customersNeedingCustomerNoFix.length > 0) {
    console.log(
      `✓ Backfilled customerNo format for ${customersNeedingCustomerNoFix.length} customer(s)`
    )
  }

  const jobsMissingSnapshot = await db
    .select({
      id: japonServiceJob.id,
      customerId: japonServiceJob.customerId,
      carId: japonServiceJob.carId,
    })
    .from(japonServiceJob)
    .where(
      and(
        isNull(japonServiceJob.deletedAt),
        or(
          sql`${japonServiceJob.customerNameSnapshot} IS NULL`,
          sql`${japonServiceJob.customerSurnameSnapshot} IS NULL`,
          sql`${japonServiceJob.customerNoSnapshot} IS NULL`,
          sql`${japonServiceJob.carPlateSnapshot} IS NULL`
        )
      )
    )

  for (const job of jobsMissingSnapshot) {
    const [customer, car] = await Promise.all([
      db
        .select({
          name: japonCustomer.name,
          surname: japonCustomer.surname,
          customerNo: japonCustomer.customerNo,
        })
        .from(japonCustomer)
        .where(
          and(
            eq(japonCustomer.id, job.customerId),
            isNull(japonCustomer.deletedAt)
          )
        )
        .limit(1)
        .then((rows) => rows[0]),
      db
        .select({ plate: japonCar.plate })
        .from(japonCar)
        .where(and(eq(japonCar.id, job.carId), isNull(japonCar.deletedAt)))
        .limit(1)
        .then((rows) => rows[0]),
    ])

    if (!customer || !car) continue

    await db
      .update(japonServiceJob)
      .set({
        customerNameSnapshot: customer.name,
        customerSurnameSnapshot: customer.surname,
        customerNoSnapshot: customer.customerNo,
        carPlateSnapshot: car.plate,
      })
      .where(eq(japonServiceJob.id, job.id))
  }

  if (jobsMissingSnapshot.length > 0) {
    console.log(
      `✓ Backfilled operation snapshot for ${jobsMissingSnapshot.length} job(s)`
    )
  }

  const cars = await db
    .select({
      id: japonCar.id,
      customerId: japonCar.customerId,
      createdAt: japonCar.createdAt,
    })
    .from(japonCar)
    .where(isNull(japonCar.deletedAt))

  let ownershipCreated = 0
  for (const car of cars) {
    const [existing] = await db
      .select({ n: count() })
      .from(japonCarOwnership)
      .where(
        and(
          eq(japonCarOwnership.carId, car.id),
          isNull(japonCarOwnership.deletedAt)
        )
      )

    if ((existing?.n ?? 0) > 0) continue

    await openCarOwnership(db, {
      carId: car.id,
      customerId: car.customerId,
      startedAt: car.createdAt,
    })
    ownershipCreated += 1
  }

  if (ownershipCreated > 0) {
    console.log(`✓ Backfilled ${ownershipCreated} car ownership row(s)`)
  }

  if (
    customersNeedingCustomerNoFix.length === 0 &&
    ownershipCreated === 0 &&
    jobsMissingSnapshot.length === 0
  ) {
    console.log('Skip japon-backfill: nothing to backfill')
  }
}
