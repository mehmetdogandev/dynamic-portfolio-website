import {
  pgTable,
  text,
  uuid,
  foreignKey,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../utils'
import { file } from './file'

export const mediaTypeEnum = pgEnum('media_type', [
  'ACTIVITY',
  'PROJECT',
  'COMMUNITY',
  'NEWS',
  'EVENT',
  'REPORT',
  'DOCUMENT',
  'OTHER',
])

export const mediaGroup = pgTable(
  'media_group',
  {
    id,
    name: text('name').notNull(),
    description: text('description'),
    parentMediaGroupId: uuid('parent_media_group_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
    ...auditMeta,
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.parentMediaGroupId],
      foreignColumns: [table.id],
    }).onDelete('cascade'),
  })
)

export const media = pgTable(
  'media',
  {
    id,
    mediaGroupId: uuid('media_group_id').references(() => mediaGroup.id, {
      onDelete: 'cascade',
    }),
    fileId: uuid('file_id').references(() => file.id, { onDelete: 'cascade' }),
    type: mediaTypeEnum('type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    imageAlt: text('image_alt'),

    parentMediaId: uuid('parent_media_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
    ...auditMeta,
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.parentMediaId],
      foreignColumns: [table.id],
    }).onDelete('cascade'),
  })
)
