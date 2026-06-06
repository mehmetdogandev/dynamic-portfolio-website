import { and, eq, isNull } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import type { DB } from '@/lib/db'
import { japonCar, japonCarOwnership, japonCustomer } from '@/lib/db/schema'
import { excludeDeleted } from '@/lib/db/utils'

type OwnershipTx = Pick<DB, 'insert' | 'update' | 'select'>

export async function openCarOwnership(
  tx: OwnershipTx,
  params: { carId: string; customerId: string; startedAt?: Date }
): Promise<void> {
  await tx.insert(japonCarOwnership).values({
    carId: params.carId,
    customerId: params.customerId,
    startedAt: params.startedAt ?? new Date(),
    endedAt: null,
  })
}

/**
 * Ends current ownership, opens a new row, updates denormalized car.customerId.
 */
export async function transferCarOwnership(
  tx: OwnershipTx,
  params: { carId: string; newCustomerId: string }
): Promise<void> {
  const car = await tx
    .select({ id: japonCar.id, customerId: japonCar.customerId })
    .from(japonCar)
    .where(and(eq(japonCar.id, params.carId), excludeDeleted(japonCar)))
    .limit(1)
    .then((rows) => rows[0])

  if (!car) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Araç bulunamadı' })
  }

  if (car.customerId === params.newCustomerId) {
    return
  }

  const newCustomer = await tx
    .select({ id: japonCustomer.id })
    .from(japonCustomer)
    .where(
      and(
        eq(japonCustomer.id, params.newCustomerId),
        excludeDeleted(japonCustomer)
      )
    )
    .limit(1)
    .then((rows) => rows[0])

  if (!newCustomer) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Müşteri bulunamadı' })
  }

  const now = new Date()

  await tx
    .update(japonCarOwnership)
    .set({ endedAt: now })
    .where(
      and(
        eq(japonCarOwnership.carId, params.carId),
        isNull(japonCarOwnership.endedAt),
        excludeDeleted(japonCarOwnership)
      )
    )

  await openCarOwnership(tx, {
    carId: params.carId,
    customerId: params.newCustomerId,
    startedAt: now,
  })

  await tx
    .update(japonCar)
    .set({ customerId: params.newCustomerId })
    .where(eq(japonCar.id, params.carId))
}
