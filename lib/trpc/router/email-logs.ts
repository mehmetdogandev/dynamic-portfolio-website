import {
  router,
  rbacWithColumnAccessProcedure,
  createAdminListSchema,
} from '../index'
import { paginatedListResponse } from '../admin-list'
import { getTableColumnNames } from '@/lib/utils/table-utils'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import {
  emailLogs,
  EMAIL_JOB_TYPE_VALUES,
  EMAIL_JOB_LABELS,
  type EmailJobType,
  SCOPES,
  PERMISSIONS,
} from '@/lib/db/schema'
import { eq, and, desc, asc, count, or, notInArray, sql } from 'drizzle-orm'
import {
  applyColumnFilters,
  excludeDeleted,
  createLocaleInsensitiveSearch,
} from '@/lib/db/utils'

function getJobNameForEmailType(emailType: string): string {
  return EMAIL_JOB_LABELS[emailType as EmailJobType] ?? emailType
}

export const emailLogsRouter = router({
  /**
   * List email logs (excluding MANUAL and SENT types)
   */
  list: rbacWithColumnAccessProcedure(
    SCOPES.MAIL_LOG,
    PERMISSIONS.READ,
    getTableColumnNames(emailLogs)
  )
    .input(
      createAdminListSchema([
        'subject',
        'emailType',
        'status',
        'createdAt',
      ]).extend({
        emailType: z.enum(EMAIL_JOB_TYPE_VALUES).optional(),
        status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, search, sortBy, sortOrder, columnFilters } = input
      const offset = (page - 1) * limit

      const conditions: ReturnType<typeof sql>[] = [
        excludeDeleted(emailLogs),
        // Exclude MANUAL and SENT email types
        notInArray(emailLogs.emailType, ['MANUAL', 'SENT']),
      ]

      if (input.status) {
        conditions.push(eq(emailLogs.status, input.status))
      }

      if (input.emailType) {
        conditions.push(eq(emailLogs.emailType, input.emailType))
      }

      if (search) {
        conditions.push(
          or(
            createLocaleInsensitiveSearch(emailLogs.subject, search),
            createLocaleInsensitiveSearch(emailLogs.senderEmail, search),
            createLocaleInsensitiveSearch(emailLogs.recipientEmails, search)
          )!
        )
      }

      applyColumnFilters(
        conditions,
        columnFilters,
        {
          subject: emailLogs.subject,
          emailType: emailLogs.emailType,
          status: emailLogs.status,
          createdAt: emailLogs.createdAt,
        },
        { exactKeys: ['emailType', 'status'] }
      )

      const orderBy = sortOrder === 'asc' ? asc : desc
      let sortColumn:
        | typeof emailLogs.createdAt
        | typeof emailLogs.subject
        | typeof emailLogs.emailType
        | typeof emailLogs.status = emailLogs.createdAt

      if (sortBy === 'subject') sortColumn = emailLogs.subject
      if (sortBy === 'emailType') sortColumn = emailLogs.emailType
      if (sortBy === 'status') sortColumn = emailLogs.status

      const [data, total] = await Promise.all([
        ctx.db
          .select({
            id: emailLogs.id,
            emailType: emailLogs.emailType,
            recipientEmails: emailLogs.recipientEmails,
            ccEmails: emailLogs.ccEmails,
            bccEmails: emailLogs.bccEmails,
            senderEmail: emailLogs.senderEmail,
            senderName: emailLogs.senderName,
            subject: emailLogs.subject,
            htmlContent: emailLogs.htmlContent,
            textContent: emailLogs.textContent,
            attachments: emailLogs.attachments,
            status: emailLogs.status,
            retryCount: emailLogs.retryCount,
            lastRetryAt: emailLogs.lastRetryAt,
            sentAt: emailLogs.sentAt,
            errorMessage: emailLogs.errorMessage,
            createdAt: emailLogs.createdAt,
            updatedAt: emailLogs.updatedAt,
          })
          .from(emailLogs)
          .where(and(...conditions))
          .orderBy(orderBy(sortColumn))
          .limit(limit)
          .offset(offset),

        ctx.db
          .select({ count: count() })
          .from(emailLogs)
          .where(and(...conditions)),
      ])

      // Add job name to each record
      const dataWithJobNames = data.map((item) => ({
        ...item,
        jobName: getJobNameForEmailType(item.emailType),
      }))

      return paginatedListResponse(
        dataWithJobNames,
        total[0]?.count ?? 0,
        page,
        limit
      )
    }),

  /**
   * Get email log by ID
   */
  getById: rbacWithColumnAccessProcedure(
    SCOPES.MAIL_LOG,
    PERMISSIONS.READ,
    getTableColumnNames(emailLogs)
  )
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      const emailLog = await ctx.db
        .select({
          id: emailLogs.id,
          emailType: emailLogs.emailType,
          recipientEmails: emailLogs.recipientEmails,
          ccEmails: emailLogs.ccEmails,
          bccEmails: emailLogs.bccEmails,
          senderEmail: emailLogs.senderEmail,
          senderName: emailLogs.senderName,
          subject: emailLogs.subject,
          htmlContent: emailLogs.htmlContent,
          textContent: emailLogs.textContent,
          attachmentPath: emailLogs.attachmentPath,
          attachments: emailLogs.attachments,
          status: emailLogs.status,
          retryCount: emailLogs.retryCount,
          lastRetryAt: emailLogs.lastRetryAt,
          sentAt: emailLogs.sentAt,
          errorMessage: emailLogs.errorMessage,
          isRead: emailLogs.isRead,
          isDraft: emailLogs.isDraft,
          threadId: emailLogs.threadId,
          inReplyTo: emailLogs.inReplyTo,
          createdAt: emailLogs.createdAt,
          updatedAt: emailLogs.updatedAt,
        })
        .from(emailLogs)
        .where(and(eq(emailLogs.id, input.id), excludeDeleted(emailLogs)))
        .limit(1)

      if (!emailLog.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email log not found',
        })
      }

      const log = emailLog[0]

      return {
        ...log,
        jobName: getJobNameForEmailType(log.emailType),
      }
    }),
})
