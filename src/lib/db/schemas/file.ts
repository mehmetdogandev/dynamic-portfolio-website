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
  import { thisProjectAuditMeta, thisProjectTimestamps } from '../utils'
  
  export const file = pgTable(
    'files',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      fileName: text('file_name').notNull(),
      originalName: text('original_name').notNull(),
      mimeType: text('mime_type').notNull(), // Bu sütun bir dosyanın MIME türünü belirtir. Örneğin: "image/jpeg"
      size: integer('size').notNull(), // Bu sütun bir dosyanın boyutunu belirtir. Örneğin: 1000
      bucket: text('bucket').notNull(), // Bu sütun bir dosyanın bulunduğu bucket'ı belirtir. Örneğin: "my-bucket"
      url: text('url').notNull(), // Bu sütun bir dosyanın URL'sini belirtir. Örneğin: "https://my-bucket.s3.amazonaws.com/my-file.jpg"
      etag: text('etag').notNull(), // Bu sütun bir dosyanın birincil kimliğini belirtir. Örneğin: "1234567890"
      prefix: text('prefix'), // Bu sütun bir dosyanın prefix'ini belirtir. Örneğin: "my-prefix"
      uploadedBy: text('uploaded_by'), // Bu sütun bir dosyanın yükleyen kullanıcının ID'sini belirtir. Örneğin: "1234567890"
      isPublic: boolean('is_public').default(false).notNull(), // Bu sütun bir dosyanın herkese açık olup olmadığını belirtir. Örneğin: true
      isDeleted: boolean('is_deleted').default(false).notNull(), // Bu sütun bir dosyanın silinip silinmediğini belirtir. Örneğin: false
      ...thisProjectTimestamps, // Bu sütun bir dosyanın oluşturulma, güncellenme ve silinme tarihlerini belirtir. Örneğin: 2021-01-01
      ...thisProjectAuditMeta, // Bu sütun bir dosyanın oluşturulma, güncellenme ve silinme tarihlerini belirtir. Örneğin: 2021-01-01
    },
    (table) => [
      // Partial unique index: File name must be unique per bucket only for non-deleted files
      uniqueIndex('unique_file_per_bucket')
        .on(table.fileName, table.bucket)
        .where(sql`${table.isDeleted} = false`),
  
      index('idx_files_original_name').on(table.originalName),
      
      index('idx_files_uploaded_by').on(table.uploadedBy, table.isDeleted),
  
      index('idx_files_public').on(table.isPublic, table.isDeleted),
  
      index('idx_files_cleanup')
        .on(table.isDeleted, table.deletedAt)
        .where(sql`${table.isDeleted} = true`),
    ]
  )