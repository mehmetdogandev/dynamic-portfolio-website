import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../../utils'

export const homeHighlight = pgTable('home_highlight', {
  id,
  title: text('title').notNull(),
  description: text('description').notNull(),
  iconKey: text('icon_key').notNull().default('code2'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})
