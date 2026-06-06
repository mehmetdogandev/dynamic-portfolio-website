import {
  pgTable,
  text,
  uuid,
  jsonb,
  boolean,
  integer,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../utils'
import { file } from './file'

export const solutionTechnology = pgTable('solution_technologies', {
  id,
  name: text('name').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})

export const solutionGroup = pgTable('solution_groups', {
  id,
  name: text('name').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})

export const solution = pgTable('solutions', {
  id,
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: jsonb('content').notNull(),
  groupId: uuid('group_id').references(() => solutionGroup.id, {
    onDelete: 'restrict',
  }),
  fileId: uuid('file_id').references(() => file.id, {
    onDelete: 'set null',
  }),
  isPublished: boolean('is_published').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(false),
  viewCount: integer('view_count').notNull().default(0),
  publishedAt: timestamp('published_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  robotsIndex: boolean('robots_index').notNull().default(true),
  ...timestamps,
  ...auditMeta,
})

export const solutionTechnologyLink = pgTable(
  'solution_technology_link',
  {
    solutionId: uuid('solution_id')
      .notNull()
      .references(() => solution.id, { onDelete: 'cascade' }),
    technologyId: uuid('technology_id')
      .notNull()
      .references(() => solutionTechnology.id, { onDelete: 'restrict' }),
  },
  (table) => [primaryKey({ columns: [table.solutionId, table.technologyId] })]
)
