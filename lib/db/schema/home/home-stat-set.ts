import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../../utils'
import { sliderGroupStatusEnum } from '../slider'

export const homeStatSet = pgTable(
  'home_stat_set',
  {
    id,
    name: text('name').notNull(),
    status: sliderGroupStatusEnum('status').notNull().default('DRAFT'),
    stat1Value: text('stat1_value').notNull(),
    stat1Label: text('stat1_label').notNull(),
    stat2Value: text('stat2_value').notNull(),
    stat2Label: text('stat2_label').notNull(),
    stat3Value: text('stat3_value').notNull(),
    stat3Label: text('stat3_label').notNull(),
    stat4Value: text('stat4_value').notNull(),
    stat4Label: text('stat4_label').notNull(),
    publishedAt: timestamp('published_at'),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_home_stat_set_single_published')
      .on(table.status)
      .where(
        sql`${table.status} = 'PUBLISHED' AND ${table.deletedAt} IS NULL`
      ),
  ]
)
