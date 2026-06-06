import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../../utils'
import { file } from '../file'

export const aboutExperience = pgTable('about_experience', {
  id,
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  description: text('description'),
  fileId: uuid('file_id').references(() => file.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
  ...auditMeta,
})
