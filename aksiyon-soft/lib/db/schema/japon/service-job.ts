import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  numeric,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../../utils'
import { japonCustomer } from './customer'
import { japonCar } from './car'
import { japonFormen } from './formen'
import { japonService } from './services'

/**
 * One service visit / job for a given customer + car. Mirrors a single
 * paper "ARAÇ KABUL VE TEKLİF FORMU" sheet.
 */
export const japonServiceJob = pgTable('japon_service_jobs', {
  id,
  customerId: uuid('customer_id')
    .notNull()
    .references(() => japonCustomer.id, { onDelete: 'cascade' }),
  carId: uuid('car_id')
    .notNull()
    .references(() => japonCar.id, { onDelete: 'cascade' }),
  formenId: uuid('formen_id').references(() => japonFormen.id, {
    onDelete: 'set null',
  }),
  kmAtVisit: integer('km_at_visit').notNull().default(0),
  notes: text('notes'),
  isCompleted: boolean('is_completed').notNull().default(false),
  isCancelled: boolean('is_cancelled').notNull().default(false),
  serviceFee: numeric('service_fee', { precision: 12, scale: 2 }),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  /**
   * Historical snapshot fields captured at job creation time.
   * They protect reporting/UI from future customer/car profile changes.
   */
  customerNameSnapshot: text('customer_name_snapshot'),
  customerSurnameSnapshot: text('customer_surname_snapshot'),
  customerNoSnapshot: text('customer_no_snapshot'),
  carPlateSnapshot: text('car_plate_snapshot'),
  ...timestamps,
  ...auditMeta,
})

/** M-N link between a service job and the services performed within it. */
export const japonServiceJobService = pgTable(
  'japon_service_job_services',
  {
    serviceJobId: uuid('service_job_id')
      .notNull()
      .references(() => japonServiceJob.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => japonService.id, { onDelete: 'restrict' }),
  },
  (table) => [primaryKey({ columns: [table.serviceJobId, table.serviceId] })]
)

/** Parts (parça) consumed within a single service job. */
export const japonPart = pgTable('japon_parts', {
  id,
  serviceJobId: uuid('service_job_id')
    .notNull()
    .references(() => japonServiceJob.id, { onDelete: 'cascade' }),
  brand: text('brand'),
  partNo: text('part_no'),
  partName: text('part_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})
