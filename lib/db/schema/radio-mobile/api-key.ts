import {
  pgTable,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { id, timestamps, auditMeta } from '../../utils'

export const radioMobileApiKey = pgTable(
  'radio_mobile_api_key',
  {
    id,
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    canAndroidRelease: boolean('can_android_release').default(false).notNull(),
    canAndroidDebug: boolean('can_android_debug').default(false).notNull(),
    canIosRelease: boolean('can_ios_release').default(false).notNull(),
    canIosDebug: boolean('can_ios_debug').default(false).notNull(),
    expiresAt: timestamp('expires_at'),
    lastUsedAt: timestamp('last_used_at'),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_radio_mobile_api_key_hash')
      .on(table.keyHash)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)
