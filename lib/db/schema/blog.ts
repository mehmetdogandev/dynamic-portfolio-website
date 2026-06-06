import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  foreignKey,
  jsonb,
} from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../utils'
import { file } from './file'

export const blogCategory = pgTable(
  'blog_category',
  {
    id,
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    parentCategoryId: uuid('parent_category_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
    ...auditMeta,
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.parentCategoryId],
      foreignColumns: [table.id],
    }).onDelete('cascade'),
  })
)

export const blog = pgTable('blog', {
  id,
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: jsonb('content').notNull(),
  categoryId: uuid('category_id').references(() => blogCategory.id, {
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

export const blogTag = pgTable('blog_tag', {
  id,
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
})

export const blogTagRelation = pgTable('blog_tag_relation', {
  blogId: uuid('blog_id').references(() => blog.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').references(() => blogTag.id, { onDelete: 'cascade' }),
})
