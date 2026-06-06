// Only enforce server-only in Next.js environment (not in seed scripts or CLI tools)
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only')
}
import { s3Client } from './index'
import { file as fileTable } from '../db/schema'
import { getDbConnection } from '../db'
import { eq, and, inArray } from 'drizzle-orm'
import { logger } from '../logger'

/**
 * Configuration for S3 operations
 */
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'uploads'
const S3_REGION = process.env.S3_REGION || 'us-east-1'

/**
 * Supported file types and their MIME types
 */
export const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/tiff': '.tiff,.tif',
  'image/avif': '.avif',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  // videos
  'video/mp4': '.mp4',
  'video/mpeg': '.mpeg',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'video/x-ms-wmv': '.wmv',
  // documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    '.pptx',
  // audio
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/3gpp': '.3gp',
  'audio/3gpp2': '.3g2',
  // text
  'text/plain': '.txt',
  'text/csv': '.csv',
  'text/html': '.html',
  'text/css': '.css',
  'text/javascript': '.js',
  'text/xml': '.xml',
  'text/markdown': '.md',
  'text/vcard': '.vcf',
  'text/vcalendar': '.vcs',
  'text/calendar': '.ics',
  // Mobile builds
  'application/vnd.android.package-archive': '.apk',
  'application/octet-stream': '.apk,.bin',
} as const

export type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES

/**
 * Upload file configuration
 */
export interface UploadConfig {
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number
  /** Allowed MIME types (default: all supported types) */
  allowedTypes?: AllowedMimeType[]
  /** Custom bucket name (default: configured bucket) */
  bucket?: string
  /** Custom file prefix for organization */
  prefix?: string
}

const ICO_MIME_TYPES = [
  'image/x-icon',
  'image/vnd.microsoft.icon',
] as const satisfies readonly AllowedMimeType[]

/** Footer sosyal özel ikon yüklemesi — yalnızca .ico */
export const FOOTER_SOCIAL_ICON_UPLOAD_CONFIG: UploadConfig = {
  maxSize: 256 * 1024,
  allowedTypes: [...ICO_MIME_TYPES],
  prefix: 'footer-social-icon',
}

/**
 * File upload result
 */
export interface UploadResult {
  /** Generated filename in S3 */
  fileName: string
  /** Original filename provided by user */
  originalName: string
  /** File size in bytes */
  size: number
  /** MIME type */
  mimeType: string
  /** S3 bucket name */
  bucket: string
  /** File URL (if public) */
  url: string
  /** ETag from S3 */
  etag: string
  /** Database record ID */
  id: string
  /** File ID */
  fileId: string
}

/**
 * File upload options with database integration
 */
export interface UploadFileOptions extends UploadConfig {
  /** User ID who uploaded the file */
  uploadedBy?: string
  /** Organization ID for multi-tenancy */
  organizationId?: string
  /** Whether file is publicly accessible */
  isPublic?: boolean
  /** Optional default alt text for images (stored on `file.alt_text`) */
  altText?: string | null
}

/**
 * Signed URL options
 */
export interface SignedUrlOptions {
  /** Expiration time in seconds (default: 3600 = 1 hour) */
  expiry?: number
  /** Custom bucket name */
  bucket?: string
  /** Request headers for upload URLs */
  headers?: Record<string, string>
  /** Maximum file size for upload URLs (default: 10MB) */
  maxSize?: number
  /** Force HTTPS to prevent mixed content errors */
  forceHttps?: boolean
}

/**
 * Generate a unique filename with UUID
 */
function generateFileName(originalName: string, prefix?: string): string {
  const uuid = crypto.randomUUID()
  const extension = originalName.substring(originalName.lastIndexOf('.'))

  return prefix ? `${prefix}/${uuid}${extension}` : `${uuid}${extension}`
}

function isAllowedMimeType(
  mimeType: string,
  config: UploadConfig = {}
): mimeType is AllowedMimeType {
  const allowedTypes =
    config.allowedTypes ||
    (Object.keys(ALLOWED_FILE_TYPES) as AllowedMimeType[])
  return allowedTypes.includes(mimeType as AllowedMimeType)
}

/**
 * Validate file type and size
 */
function validateFile(
  file: Buffer | Uint8Array,
  mimeType: string,
  originalName: string,
  config: UploadConfig = {}
): void {
  const maxSize = config.maxSize || 100 * 1024 * 1024 // 100MB default
  // Check file size
  if (file.length > maxSize) {
    throw new Error(
      `File size (${file.length} bytes) exceeds maximum allowed size (${maxSize} bytes)`
    )
  }

  // Check MIME type
  if (!isAllowedMimeType(mimeType, config)) {
    throw new Error(`File type "${mimeType}" is not allowed.`)
  }

  // Validate file extension matches MIME type
  const extension = originalName
    .substring(originalName.lastIndexOf('.'))
    .toLowerCase()
  const expectedExtensions = ALLOWED_FILE_TYPES[mimeType]
  if (expectedExtensions && !expectedExtensions.includes(extension)) {
    throw new Error(
      `File extension "${extension}" does not match MIME type "${mimeType}"`
    )
  }
}

/**
 * Upload a single file to S3 and create database record
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string,
  config: UploadFileOptions & { customFileName?: string } = {}
): Promise<UploadResult> {
  try {
    // Validate file
    validateFile(file, mimeType, originalName, config)

    const bucket = config.bucket || S3_BUCKET
    const fileName =
      config.customFileName || generateFileName(originalName, config.prefix)

    // Ensure bucket exists
    const bucketExists = await s3Client.bucketExists(bucket)
    if (!bucketExists) {
      await s3Client.makeBucket(bucket, S3_REGION)
    }

    // Convert Uint8Array to Buffer if needed
    const fileBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file)

    // Upload file
    const uploadResult = await s3Client.putObject(
      bucket,
      fileName,
      fileBuffer,
      fileBuffer.length,
      {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`,
      }
    )

    const db = getDbConnection()

    // Create database record first
    const [fileRecord] = await db
      .insert(fileTable)
      .values({
        fileName,
        originalName,
        mimeType,
        size: fileBuffer.length,
        bucket,
        url: '', // Will be updated after getting the ID
        etag: uploadResult.etag,
        prefix: config.prefix,
        uploadedBy: config.uploadedBy,
        organizationId: config.organizationId,
        isPublic: config.isPublic || false,
        altText: config.altText?.trim() || null,
      })
      .returning({ id: fileTable.id })

    // Update URL with the actual file ID
    const url = `api/files/${fileRecord.id}/view` // API endpoint for viewing

    // Update the record with the correct URL
    await db
      .update(fileTable)
      .set({ url })
      .where(eq(fileTable.id, fileRecord.id))

    return {
      fileName,
      originalName,
      size: fileBuffer.length,
      mimeType,
      bucket,
      url,
      etag: uploadResult.etag,
      id: fileRecord.id,
      fileId: fileRecord.id,
    }
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        fileName: originalName,
        mimeType,
        bucket: config.bucket || S3_BUCKET,
      },
      'Failed to upload file'
    )

    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Upload multiple files to S3 and create database records
 */
export async function uploadFiles(
  files: Array<{
    file: Buffer | Uint8Array
    originalName: string
    mimeType: string
  }>,
  config: UploadFileOptions = {}
): Promise<UploadResult[]> {
  try {
    // Upload files in parallel
    const uploadPromises = files.map(({ file, originalName, mimeType }) =>
      uploadFile(file, originalName, mimeType, config)
    )

    return await Promise.all(uploadPromises)
  } catch (error) {
    throw new Error(
      `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get a file from S3
 */
export async function getFile(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<Buffer> {
  try {
    const stream = await s3Client.getObject(bucket, fileName)
    const chunks: Buffer[] = []

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  } catch (error) {
    throw new Error(
      `Failed to get file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get multiple files from S3
 */
export async function getFiles(
  fileNames: string[],
  bucket: string = S3_BUCKET
): Promise<Array<{ fileName: string; data: Buffer }>> {
  try {
    const filePromises = fileNames.map(async (fileName) => ({
      fileName,
      data: await getFile(fileName, bucket),
    }))

    return await Promise.all(filePromises)
  } catch (error) {
    throw new Error(
      `Failed to get files: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Delete a file from S3 and database (hard delete only)
 */
export async function deleteFile(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<void> {
  try {
    const db = getDbConnection()
    // Hard delete: remove from S3 and database
    await s3Client.removeObject(bucket, fileName)
    await db
      .delete(fileTable)
      .where(
        and(eq(fileTable.fileName, fileName), eq(fileTable.bucket, bucket))
      )
  } catch (error) {
    throw new Error(
      `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Delete multiple files from S3 and database (hard delete only)
 */
export async function deleteFiles(
  fileNames: string[],
  bucket: string = S3_BUCKET
): Promise<void> {
  try {
    const db = getDbConnection()
    await s3Client.removeObjects(bucket, fileNames)
    await db
      .delete(fileTable)
      .where(
        and(
          inArray(fileTable.fileName, fileNames),
          eq(fileTable.bucket, bucket)
        )
      )
  } catch (error) {
    throw new Error(
      `Failed to delete files: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Convert URL to protocol-relative format to avoid mixed content issues
 * http://example.com/path -> //example.com/path
 * https://example.com/path -> //example.com/path
 */
function makeProtocolRelative(url: string): string {
  // If URL already starts with //, return as is
  if (url.startsWith('//')) {
    return url
  }

  // Replace http:// or https:// with //
  return url.replace(/^https?:\/\//, '//')
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getSignedDownloadUrl(
  fileName: string,
  options: SignedUrlOptions = {}
): Promise<string> {
  try {
    const bucket = options.bucket || S3_BUCKET
    const expiry = options.expiry || 3600 // 1 hour default

    const url = await s3Client.presignedGetObject(bucket, fileName, expiry)
    // Convert to protocol-relative to avoid mixed content issues
    return makeProtocolRelative(url)
  } catch (error) {
    throw new Error(
      `Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate a presigned URL for uploading a file
 */
export async function getSignedUploadUrl(
  fileName: string,
  mimeType: string,
  options: SignedUrlOptions = {}
): Promise<string> {
  try {
    const bucket = options.bucket || S3_BUCKET
    const expiry = options.expiry || 3600 // 1 hour default

    // For MinIO/S3 presigned PUT, we use the simpler approach
    const url = await s3Client.presignedPutObject(bucket, fileName, expiry)

    // Convert to protocol-relative to avoid mixed content issues
    return makeProtocolRelative(url)
  } catch (error) {
    throw new Error(
      `Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate presigned URLs for multiple files
 */
export async function getSignedUrls(
  fileNames: string[],
  type: 'download' | 'upload' = 'download',
  mimeType?: string,
  options: SignedUrlOptions = {}
): Promise<Array<{ fileName: string; url: string }>> {
  try {
    const urlPromises = fileNames.map(async (fileName) => {
      const url =
        type === 'upload' && mimeType
          ? await getSignedUploadUrl(fileName, mimeType, options)
          : await getSignedDownloadUrl(fileName, options)

      return { fileName, url }
    })

    return await Promise.all(urlPromises)
  } catch (error) {
    throw new Error(
      `Failed to generate URLs: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<boolean> {
  try {
    await s3Client.statObject(bucket, fileName)
    return true
  } catch {
    return false
  }
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<{
  size: number
  lastModified: Date
  etag: string
  contentType: string
}> {
  try {
    const stat = await s3Client.statObject(bucket, fileName)
    return {
      size: stat.size,
      lastModified: stat.lastModified,
      etag: stat.etag,
      contentType:
        stat.metaData?.['content-type'] || 'application/octet-stream',
    }
  } catch (error) {
    throw new Error(
      `Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * List files in a bucket with optional prefix
 */
export async function listFiles(
  bucket: string = S3_BUCKET,
  prefix?: string,
  maxFiles: number = 1000
): Promise<
  Array<{
    name: string
    size: number
    lastModified: Date
    etag: string
  }>
> {
  try {
    const files: Array<{
      name: string
      size: number
      lastModified: Date
      etag: string
    }> = []

    return new Promise((resolve, reject) => {
      const stream = s3Client.listObjects(bucket, prefix, false)

      stream.on('data', (obj) => {
        if (files.length < maxFiles) {
          files.push({
            name: obj.name!,
            size: obj.size!,
            lastModified: obj.lastModified!,
            etag: obj.etag!,
          })
        }
      })

      stream.on('end', () => resolve(files))
      stream.on('error', reject)
    })
  } catch (error) {
    throw new Error(
      `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Copy a file within S3 or between buckets
 */
export async function copyFile(
  sourceFileName: string,
  destFileName: string,
  sourceBucket: string = S3_BUCKET,
  destBucket: string = S3_BUCKET
): Promise<void> {
  try {
    await s3Client.copyObject(
      destBucket,
      destFileName,
      `${sourceBucket}/${sourceFileName}`
    )
  } catch (error) {
    throw new Error(
      `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get file record from database by ID
 */
export async function getFileRecord(
  fileId: string
): Promise<typeof fileTable.$inferSelect | null> {
  try {
    const db = getDbConnection()
    const [fileRecord] = await db
      .select()
      .from(fileTable)
      .where(and(eq(fileTable.id, fileId), eq(fileTable.isDeleted, false)))
      .limit(1)

    return fileRecord || null
  } catch (error) {
    throw new Error(
      `Failed to get file record: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get file record from database by fileName and bucket
 */
export async function getFileRecordByName(
  fileName: string,
  bucket: string = S3_BUCKET
): Promise<typeof fileTable.$inferSelect | null> {
  try {
    const db = getDbConnection()
    const [fileRecord] = await db
      .select()
      .from(fileTable)
      .where(
        and(
          eq(fileTable.fileName, fileName),
          eq(fileTable.bucket, bucket),
          eq(fileTable.isDeleted, false)
        )
      )
      .limit(1)

    return fileRecord || null
  } catch (error) {
    throw new Error(
      `Failed to get file record: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get file with access logging
 */
export async function getFileWithLogging(
  fileName: string,
  bucket: string = S3_BUCKET,
  _accessType: string = 'download'
): Promise<Buffer> {
  try {
    // Get file record first
    const fileRecord = await getFileRecordByName(fileName, bucket)
    if (!fileRecord) {
      throw new Error('File record not found')
    }

    // // Log access
    // await logFileAccess(fileRecord.id, accessType, userId, ipAddress, userAgent, year)

    // Get file from S3
    return await getFile(fileName, bucket)
  } catch (error) {
    throw new Error(
      `Failed to get file with logging: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * List files with database records
 */
export async function listFilesWithRecords(
  organizationId?: string,
  uploadedBy?: string,
  isPublic?: boolean,
  limit: number = 100
): Promise<Array<typeof fileTable.$inferSelect>> {
  try {
    const db = getDbConnection()
    const conditions = [eq(fileTable.isDeleted, false)]

    if (organizationId) {
      conditions.push(eq(fileTable.organizationId, organizationId))
    }
    if (uploadedBy) {
      conditions.push(eq(fileTable.uploadedBy, uploadedBy))
    }
    if (isPublic !== undefined) {
      conditions.push(eq(fileTable.isPublic, isPublic))
    }

    return await db
      .select()
      .from(fileTable)
      .where(and(...conditions))
      .orderBy(fileTable.createdAt)
      .limit(limit)
  } catch (error) {
    throw new Error(
      `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get file directly from S3 as Buffer
 */
export async function getFileFromS3(
  fileName: string,
  bucket?: string
): Promise<Buffer> {
  try {
    const bucketName = bucket || S3_BUCKET

    const stream = await s3Client.getObject(bucketName, fileName)

    // Convert stream to Buffer
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  } catch (error) {
    throw new Error(
      `Failed to get file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
