import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../utils'
import { file } from './file'

export const reference = pgTable('reference', {
  id,
  name: text('name').notNull(),
  logoId: uuid('logo_id').references(() => file.id, { onDelete: 'set null' }),
  websiteUrl: text('website_url'),
  description: text('description'),
  /** Uzun metin (kart arkası / flip) */
  summary: text('summary'),
  sector: text('sector').notNull(),
  logoAlt: text('logo_alt'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})
