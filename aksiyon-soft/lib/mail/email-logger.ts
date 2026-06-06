import { getDbConnection } from '@/lib/db/database-utils'
import { emailLogs, type EmailLogType } from '@/lib/db/schema'
import { logger } from '../logger'
import { eq } from 'drizzle-orm'

export interface AttachmentMetadata {
  fileName: string
  originalName: string
  path: string
  size: number
  mimeType: string
  url?: string
  bucket?: string // Optional bucket name for MinIO
  fileId?: string // File ID for preview URL generation
  /** CID for inline images (used by replaceCidWithAttachmentUrls) */
  cid?: string
}

export interface LogEmailOptions {
  emailType: EmailLogType
  recipientEmails: string[]
  ccEmails?: string[]
  bccEmails?: string[]
  senderEmail: string
  senderName: string
  subject: string
  htmlContent?: string
  textContent?: string
  attachments?: AttachmentMetadata[]
  status?: 'PENDING' | 'SENT' | 'FAILED'
  sentAt?: Date
  errorMessage?: string
  threadId?: string
  inReplyTo?: string
  createdBy?: string
}

/**
 * Log sent email to email_logs table
 */
export async function logSentEmail(options: LogEmailOptions): Promise<string> {
  try {
    const db = getDbConnection()

    // Use first recipient email for backward compatibility with recipientEmail field
    const recipientEmail = options.recipientEmails[0] || ''

    const [emailLog] = await db
      .insert(emailLogs)
      .values({
        emailType: options.emailType,
        recipientEmails:
          options.recipientEmails.length > 0
            ? options.recipientEmails
            : [recipientEmail],
        ccEmails: options.ccEmails || [],
        bccEmails: options.bccEmails || [],
        senderEmail: options.senderEmail,
        senderName: options.senderName,
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
        attachments: options.attachments || [],
        status: options.status || 'PENDING',
        sentAt: options.sentAt,
        errorMessage: options.errorMessage,
        threadId: options.threadId,
        inReplyTo: options.inReplyTo,
        createdBy: options.createdBy,
        isDraft: false,
        isRead: false,
      })
      .returning({ id: emailLogs.id })

    logger.info(
      {
        emailLogId: emailLog.id,
        emailType: options.emailType,
        recipientCount: options.recipientEmails.length,
        subject: options.subject,
      },
      'Email logged successfully'
    )

    return emailLog.id
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        options,
      },
      'Failed to log email'
    )
    throw error
  }
}

/**
 * Update email log status
 */
export async function updateEmailLogStatus(
  emailLogId: string,
  status: 'PENDING' | 'SENT' | 'FAILED',
  sentAt?: Date,
  errorMessage?: string,
  _year?: string
): Promise<void> {
  try {
    const db = getDbConnection()

    await db
      .update(emailLogs)
      .set({
        status,
        sentAt: sentAt || new Date(),
        errorMessage,
      })
      .where(eq(emailLogs.id, emailLogId))

    logger.info(
      {
        emailLogId,
        status,
        sentAt,
      },
      'Email log status updated'
    )
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        emailLogId,
        status,
      },
      'Failed to update email log status'
    )
    throw error
  }
}
