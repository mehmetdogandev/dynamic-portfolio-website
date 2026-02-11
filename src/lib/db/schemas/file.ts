import {
    pgTable,
    text,
    timestamp,
    integer,
    uuid,
    index,
    boolean,
    uniqueIndex,
  } from 'drizzle-orm/pg-core'
  import { sql } from 'drizzle-orm'
  import { thisProjectAuditMeta } from '../utils'
  
  export const file = pgTable(
    'files',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      fileName: text('file_name').notNull(),
      originalName: text('original_name').notNull(),
      mimeType: text('mime_type').notNull(),
      size: integer('size').notNull(),
      bucket: text('bucket').notNull(),
      url: text('url').notNull(),
      etag: text('etag').notNull(),
      prefix: text('prefix'),
      uploadedBy: text('uploaded_by'),
      organizationId: text('organization_id'),
      isPublic: boolean('is_public').default(false).notNull(),
      isDeleted: boolean('is_deleted').default(false).notNull(),
      deletedAt: timestamp('deleted_at'),
      syncSource: text('sync_source'),
      syncedAt: timestamp('synced_at'),
      createdAt: timestamp('created_at').notNull().defaultNow(),
      updatedAt: timestamp('updated_at').notNull().defaultNow(),
      year: text('year').notNull(),
      ...thisProjectAuditMeta,
    },
    (table) => [
      // Partial unique index: File name must be unique per bucket only for non-deleted files
      uniqueIndex('unique_file_per_bucket')
        .on(table.fileName, table.bucket)
        .where(sql`${table.isDeleted} = false`),
  
      index('idx_files_original_name').on(table.originalName),
  
      index('idx_files_organization').on(table.organizationId, table.isDeleted),
  
      index('idx_files_uploaded_by').on(table.uploadedBy, table.isDeleted),
  
      index('idx_files_public').on(table.isPublic, table.isDeleted),
  
      index('idx_files_sync').on(table.year, table.createdAt),
  
      index('idx_files_cleanup')
        .on(table.isDeleted, table.deletedAt)
        .where(sql`${table.isDeleted} = true`),
    ]
  )