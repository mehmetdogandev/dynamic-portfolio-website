import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import { id, timestamps, auditMeta } from '../utils'
import { file } from './file'

export const sliderTypeEnum = pgEnum('slider_type', [
  'DEFAULT',
  'SPLIT_LEFT',
  'SPLIT_RIGHT',
  'THUMB_STRIP',
  'MINIMAL_DOTS',
  'CINEMATIC',
  'PEEK_CARDS',
  'STACK',
])

export const sliderGroupStatusEnum = pgEnum('slider_group_status', [
  'DRAFT',
  'PUBLISHED',
])

export const sliderGroup = pgTable(
  'slider_group',
  {
    id,
    name: text('name').notNull(),
    description: text('description'),
    type: sliderTypeEnum('type').notNull(),
    autoplayInterval: integer('autoplay_interval'),
    status: sliderGroupStatusEnum('status').notNull().default('DRAFT'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    index('idx_slider_group_type_status').on(table.type, table.status),
  ]
)

/** One slide within a slider group (image or video via `files`). */
export const slider = pgTable(
  'slider',
  {
    id,
    groupId: uuid('group_id')
      .notNull()
      .references(() => sliderGroup.id, { onDelete: 'restrict' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => file.id, { onDelete: 'restrict' }),
    sortOrder: integer('sort_order').notNull().default(0),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    imageAlt: text('image_alt'),
    showPrimaryButton: boolean('show_primary_button').notNull().default(true),
    showSecondaryButton: boolean('show_secondary_button')
      .notNull()
      .default(true),
    primaryLabel: text('primary_label'),
    primaryHref: text('primary_href'),
    secondaryLabel: text('secondary_label'),
    secondaryHref: text('secondary_href'),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [index('idx_slider_group_id').on(table.groupId)]
)
