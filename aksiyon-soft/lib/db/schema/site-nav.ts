import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { FOOTER_SOCIAL_PLATFORMS } from '@/lib/website/footer-social-platform-constants'
import { file } from './file'
import { auditMeta, id, timestamps } from '../utils'

export const siteNavPlacementEnum = pgEnum('site_nav_placement', [
  'HEADER',
  'FOOTER',
])

export const footerSocialPlatformEnum = pgEnum('footer_social_platform', [
  ...FOOTER_SOCIAL_PLATFORMS,
])

export const siteNavLink = pgTable('site_nav_link', {
  id,
  placement: siteNavPlacementEnum('placement').notNull(),
  label: text('label').notNull(),
  href: text('href').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  openInNewTab: boolean('open_in_new_tab').notNull().default(false),
  ...timestamps,
  ...auditMeta,
})

export const socialIconTypeEnum = pgEnum('social_icon_type', ['ICON', 'IMAGE'])

export const footerSocialLink = pgTable(
  'footer_social_link',
  {
    id,
    platform: footerSocialPlatformEnum('platform').notNull(),
    customLabel: text('custom_label'),
    url: text('url').notNull(),
    type: socialIconTypeEnum('type').notNull().default('ICON'),
    iconFileId: uuid('icon_file_id').references(() => file.id, {
      onDelete: 'set null',
    }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(false),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_footer_social_platform_active')
      .on(table.platform, sql`coalesce(${table.customLabel}, '')`)
      .where(sql`${table.isActive} = true AND ${table.deletedAt} IS NULL`),
  ]
)
