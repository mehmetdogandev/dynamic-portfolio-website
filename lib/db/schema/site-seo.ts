import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { id } from '../utils'
import { file } from './file'

/** Tek satırlık site geneli SEO / kurumsal ayarlar (singleton). */
export const siteSeo = pgTable('site_seo', {
  id,
  defaultMetaDescription: text('default_meta_description'),
  defaultOgImageFileId: uuid('default_og_image_file_id').references(
    () => file.id,
    { onDelete: 'set null' }
  ),
  organizationName: text('organization_name'),
  sameAsJson: jsonb('same_as_json')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  twitterSite: text('twitter_site'),
  googleSiteVerification: text('google_site_verification'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})
