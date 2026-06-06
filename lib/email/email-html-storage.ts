/**
 * Upload email HTML content to MinIO and create a files table record.
 * Used by email jobs so that email_logs.html_content stores a URL instead of raw HTML.
 */
import { uploadFile } from '@/lib/s3/utils'

const DEFAULT_PREFIX = 'email-logs'
const DEFAULT_ORIGINAL_NAME = 'content.html'

export interface UploadEmailHtmlOptions {
  /** S3/key prefix (default: 'email-logs') */
  prefix?: string
}

export interface UploadEmailHtmlResult {
  /** URL to use in email_logs.html_content (e.g. api/files/{id}/view) */
  url: string
  /** File record id in files table */
  fileId: string
}

/**
 * Upload HTML string to MinIO and create a record in the files table.
 * Returns the URL to store in email_logs.html_content.
 */
export async function uploadEmailHtmlContent(
  html: string,
  options: UploadEmailHtmlOptions = {}
): Promise<UploadEmailHtmlResult> {
  const buffer = Buffer.from(html, 'utf-8')
  const prefix = options.prefix ?? DEFAULT_PREFIX

  const result = await uploadFile(buffer, DEFAULT_ORIGINAL_NAME, 'text/html', {
    prefix,
  })

  return {
    url: result.url,
    fileId: result.id,
  }
}
