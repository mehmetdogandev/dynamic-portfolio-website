import { pgTable, text, boolean } from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../../utils'

export const japonService = pgTable('japon_services', {
  id,
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
  ...auditMeta,
})
