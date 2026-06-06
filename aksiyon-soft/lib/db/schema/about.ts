import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../utils'

export const about = pgTable(
  'about',
  {
    id,
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    content: jsonb('content').notNull(),
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    robotsIndex: boolean('robots_index').notNull().default(true),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_about_single_published')
      .on(table.isPublished)
      .where(sql`${table.isPublished} = true AND ${table.deletedAt} IS NULL`),
  ]
)
