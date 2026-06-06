import { sql } from 'drizzle-orm'
import { pgTable, text, uuid, integer, uniqueIndex } from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../../utils'
import { japonCustomer } from './customer'

/**
 * Vehicle records. `plate` is unique per soft-delete: only active (non-deleted)
 * rows are constrained, so a deleted plate can be re-used by a fresh entry.
 */
export const japonCar = pgTable(
  'japon_cars',
  {
    id,
    customerId: uuid('customer_id')
      .notNull()
      .references(() => japonCustomer.id, { onDelete: 'cascade' }),
    plate: text('plate').notNull(),
    vehicleType: text('vehicle_type').notNull(),
    color: text('color').notNull(),
    km: integer('km').notNull().default(0),
    notes: text('notes'),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_japon_car_plate_active')
      .on(table.plate)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)
