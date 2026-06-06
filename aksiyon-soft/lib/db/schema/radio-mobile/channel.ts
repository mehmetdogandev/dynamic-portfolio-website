import { pgEnum, pgTable, text, boolean } from 'drizzle-orm/pg-core'
import { timestamps, auditMeta } from '../../utils'

export const radioMobileChannelEnum = pgEnum('radio_mobile_channel', [
  'android_release',
  'android_debug',
  'ios_release',
  'ios_debug',
])

export const radioMobileChannelConfig = pgTable('radio_mobile_channel_config', {
  channel: radioMobileChannelEnum('channel').primaryKey(),
  isPublicPage: boolean('is_public_page').default(false).notNull(),
  publicUrlPath: text('public_url_path').notNull(),
  ...timestamps,
  ...auditMeta,
})

export type RadioMobileChannel =
  (typeof radioMobileChannelEnum.enumValues)[number]
