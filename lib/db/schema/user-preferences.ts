import {
  pgTable,
  text,
  boolean,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { id, timestamps, auditMeta } from '../utils'
import { user } from './auth'

export const userPreferences = pgTable(
  'user_preferences',
  {
    id,
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    notificationSoundEnabled: boolean('notification_sound_enabled')
      .notNull()
      .default(true),
    notificationSoundVolume: numeric('notification_sound_volume', {
      precision: 3,
      scale: 2,
    })
      .notNull()
      .default('0.5'), // 0.00 to 1.00
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    // Partial unique index: User ID must be unique only for non-deleted preferences
    uniqueIndex('unique_user_preferences_user_id')
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)
