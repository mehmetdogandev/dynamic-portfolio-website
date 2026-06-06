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

export const projectTechnology = pgTable('project_technologies', {
  id,
  name: text('name').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})

export const projectGroup = pgTable('project_groups', {
  id,
  name: text('name').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})

export const project = pgTable('projects', {
  id,
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: jsonb('content').notNull(),
  groupId: uuid('group_id').references(() => projectGroup.id, {
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

export const projectTechnologyLink = pgTable(
  'project_technology_link',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    technologyId: uuid('technology_id')
      .notNull()
      .references(() => projectTechnology.id, { onDelete: 'restrict' }),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.technologyId] })]
)
