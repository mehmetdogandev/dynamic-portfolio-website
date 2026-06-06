import { pgTable, text, boolean } from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../../utils'

export const japonFormen = pgTable('japon_formen', {
  id,
  name: text('name').notNull(),
  surname: text('surname'),
  phone: text('phone'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
  ...auditMeta,
})
