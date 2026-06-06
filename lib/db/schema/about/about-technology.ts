import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../../utils'

export const aboutTechnology = pgTable('about_technology', {
  id,
  category: text('category').notNull(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})
