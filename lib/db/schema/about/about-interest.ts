import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../../utils'

export const aboutInterest = pgTable('about_interest', {
  id,
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})
