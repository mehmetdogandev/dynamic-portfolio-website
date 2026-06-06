import { sql } from 'drizzle-orm'
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { auditMeta, id, timestamps } from '../../utils'
import { sliderGroupStatusEnum } from '../slider'

export const homeStatValueSourceEnum = pgEnum('home_stat_value_source', [
  'MANUAL',
  'AUTO_EXPERIENCE_COUNT',
  'AUTO_REFERENCE_COUNT',
])

export const homeStatSet = pgTable(
  'home_stat_set',
  {
    id,
    name: text('name').notNull(),
    status: sliderGroupStatusEnum('status').notNull().default('DRAFT'),
    yearsExperienceValue: text('years_experience_value').notNull(),
    yearsExperienceLabel: text('years_experience_label').notNull(),
    yearsExperienceHref: text('years_experience_href'),
    experienceCountValue: text('experience_count_value').notNull().default('0'),
    experienceCountLabel: text('experience_count_label').notNull(),
    experienceCountHref: text('experience_count_href'),
    experienceCountSource: homeStatValueSourceEnum('experience_count_source')
      .notNull()
      .default('AUTO_EXPERIENCE_COUNT'),
    companyCountValue: text('company_count_value').notNull().default('0'),
    companyCountLabel: text('company_count_label').notNull(),
    companyCountHref: text('company_count_href'),
    companyCountSource: homeStatValueSourceEnum('company_count_source')
      .notNull()
      .default('AUTO_REFERENCE_COUNT'),
    studentsTaughtValue: text('students_taught_value').notNull(),
    studentsTaughtLabel: text('students_taught_label').notNull(),
    studentsTaughtHref: text('students_taught_href'),
    publishedAt: timestamp('published_at'),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    uniqueIndex('unique_home_stat_set_single_published')
      .on(table.status)
      .where(sql`${table.status} = 'PUBLISHED' AND ${table.deletedAt} IS NULL`),
  ]
)
