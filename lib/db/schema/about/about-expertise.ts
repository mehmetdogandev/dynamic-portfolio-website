import { sql } from 'drizzle-orm'
import { integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../../utils'

export const aboutExpertise = pgTable('about_expertise', {
  id,
  title: text('title').notNull(),
  description: text('description').notNull(),
  keywords: jsonb('keywords')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})
