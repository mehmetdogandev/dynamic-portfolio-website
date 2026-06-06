import { text } from 'drizzle-orm/pg-core'
import { user } from './user'

/** Shared audit columns referencing `user` (must live outside `lib/db/utils.ts` to avoid circular imports). */
export const auditMeta = {
  createdBy: text('created_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  lastUpdatedBy: text('last_updated_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  deletedBy: text('deleted_by').references(() => user.id, {
    onDelete: 'set null',
  }),
}
