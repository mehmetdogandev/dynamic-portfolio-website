import { sql } from 'drizzle-orm'
import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../../utils'

export const japonCustomer = pgTable(
  'japon_customers',
  {
    id,
    /** Immutable id format: CT.MMDDYY.0001 */
    customerNo: text('customer_no').notNull(),
    name: text('name').notNull(),
    surname: text('surname').notNull(),
    address: text('address'),
    phone: text('phone').notNull(),
    notes: text('notes'),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_japon_customer_no_active')
      .on(table.customerNo)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)
