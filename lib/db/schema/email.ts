import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { id, auditMeta, timestamps } from '@/lib/db/utils'
import { user } from './auth'

/** All values persisted in `email_logs.email_type` (manual UI + transactional + scheduled jobs). */
export const emailTypeEnum = pgEnum('email_type', [
  'MANUAL',
  'SENT',
  'DAILY_EMAIL_OPERATIONS_SUMMARY',
  'UNREAD_MESSAGES_CONTROL_EMAIL',
  'WEBSITE_CONTACT',
  'WEBSITE_VISIT',
])

export type EmailLogType = (typeof emailTypeEnum.enumValues)[number]

/** Scheduled / automation email types (single source for admin UI filters and Zod). */
export const EMAIL_JOB_TYPE_VALUES = [
  'DAILY_EMAIL_OPERATIONS_SUMMARY',
  'UNREAD_MESSAGES_CONTROL_EMAIL',
  'WEBSITE_CONTACT',
  'WEBSITE_VISIT',
] as const satisfies readonly EmailLogType[]

export type EmailJobType = (typeof EMAIL_JOB_TYPE_VALUES)[number]

/** Turkish labels for automation email types (admin email logs UI and API job name). */
export const EMAIL_JOB_LABELS = {
  DAILY_EMAIL_OPERATIONS_SUMMARY: 'Günlük e-posta işlemleri özeti',
  UNREAD_MESSAGES_CONTROL_EMAIL: 'Okunmamış mesaj bildirimi',
  WEBSITE_CONTACT: 'Web sitesi iletişim formu',
  WEBSITE_VISIT: 'Web sitesi ziyaret bildirimi',
} as const satisfies Record<EmailJobType, string>

export const emailStatusEnum = pgEnum('email_status', [
  'PENDING',
  'SENT',
  'FAILED',
])

export const emailLogs = pgTable(
  'email_logs',
  {
    id,
    emailType: emailTypeEnum('email_type').notNull(),
    userId: text('user_id').references(() => user.id, {
      onDelete: 'cascade',
    }),
    recipientEmails: text('recipient_emails').array().default([]), // multiple recipients (To)
    ccEmails: text('cc_emails').array().default([]),
    bccEmails: text('bcc_emails').array().default([]),
    senderEmail: text('sender_email'),
    senderName: text('sender_name'),
    subject: text('subject').notNull(),
    htmlContent: text('html_content'),
    textContent: text('text_content'),
    attachmentPath: text('attachment_path'), // MinIO path (deprecated, use attachments)
    attachments: jsonb('attachments').default([]), // New: array of attachment metadata
    status: emailStatusEnum('status').default('PENDING').notNull(),
    retryCount: integer('retry_count').default(0).notNull(),
    lastRetryAt: timestamp('last_retry_at'),
    sentAt: timestamp('sent_at'),
    errorMessage: text('error_message'),
    isRead: boolean('is_read').default(false).notNull(),
    isDraft: boolean('is_draft').default(false).notNull(),
    threadId: uuid('thread_id'),
    inReplyTo: uuid('in_reply_to'),
    ...timestamps,
    ...auditMeta,
  },
  (table) => [
    index('idx_email_logs_sender').on(table.senderEmail, table.createdAt),
    index('idx_email_logs_status').on(table.status, table.createdAt),
    index('idx_email_logs_type').on(table.emailType, table.createdAt),
    index('idx_email_logs_thread').on(table.threadId),
    index('idx_email_logs_draft').on(table.isDraft, table.createdAt),
    index('idx_email_logs_read').on(table.isRead, table.createdAt),
  ]
)
