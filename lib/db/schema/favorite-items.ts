import { pgTable, text, uuid, boolean, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { auditMeta, timestamps } from '../utils'
import { user } from '.'

export const userFavoriteItems = pgTable(
  'user_favorite_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    href: text('href').notNull(),

    isDeleted: boolean('is_deleted').notNull().default(false),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    // Partial unique index: User ID and href combination must be unique only for non-deleted items
    uniqueIndex('unique_user_favorite_items_user_href')
      .on(table.userId, table.href)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)
