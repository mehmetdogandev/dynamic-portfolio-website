import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../../utils'
import { japonCar } from './car'
import { japonCustomer } from './customer'

/**
 * Historical and current vehicle ownership. `endedAt` null = current owner.
 * `japon_cars.customer_id` is denormalized current owner for fast joins.
 */
export const japonCarOwnership = pgTable('japon_car_ownership', {
  id,
  carId: uuid('car_id')
    .notNull()
    .references(() => japonCar.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => japonCustomer.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  ...timestamps,
  ...auditMeta,
})
