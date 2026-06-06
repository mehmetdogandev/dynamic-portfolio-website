import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { id, timestamps, auditMeta } from '../../utils'
import { file } from '../file'
import { radioMobileChannelEnum } from './channel'

export const radioMobileBuild = pgTable(
  'radio_mobile_build',
  {
    id,
    channel: radioMobileChannelEnum('channel').notNull(),
    versionMajor: integer('version_major').notNull(),
    versionPatch: integer('version_patch').notNull(),
    versionName: text('version_name').notNull(),
    versionCode: integer('version_code').notNull(),
    displayName: text('display_name').notNull(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => file.id, { onDelete: 'restrict' }),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    isStable: boolean('is_stable').default(false).notNull(),
    isPublicOnSite: boolean('is_public_on_site').default(false).notNull(),
    reactNativeVersion: text('react_native_version'),
    minSdk: integer('min_sdk'),
    targetSdk: integer('target_sdk'),
    buildToolchain: text('build_toolchain'),
    notes: text('notes'),
    publishedAt: timestamp('published_at').defaultNow().notNull(),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_radio_mobile_build_version')
      .on(table.channel, table.versionMajor, table.versionPatch)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex('unique_radio_mobile_build_version_code')
      .on(table.channel, table.versionCode)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)
