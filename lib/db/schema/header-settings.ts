import { boolean, pgTable, timestamp } from 'drizzle-orm/pg-core'
import { id } from '../utils'

/** Tek satırlık site geneli header davranış ayarları (singleton). */
export const headerSettings = pgTable('header_settings', {
  id,
  stickyHeaderEnabled: boolean('sticky_header_enabled')
    .notNull()
    .default(false),
  scrollProgressBarEnabled: boolean('scroll_progress_bar_enabled')
    .notNull()
    .default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})
