import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../../utils'

/** Singleton Hakkımda sayfa profili (tek aktif kayıt). */
export const aboutPageProfile = pgTable(
  'about_page_profile',
  {
    id,
    lead: text('lead').notNull(),
    intro: text('intro').notNull(),
    introPart2: text('intro_part2'),
    introPart3: text('intro_part3'),
    introPart4: text('intro_part4'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    robotsIndex: boolean('robots_index').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_about_page_profile_single_active')
      .on(sql`(1)`)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)
