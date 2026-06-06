import {
  router,
  rbacWithColumnAccessProcedure,
  createPaginationSchema,
} from '../index'
import { z } from 'zod'
import { sendMail } from '@/lib/mail'
import { TRPCError } from '@trpc/server'
import { emailLogs, user, SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { getTableColumnNames } from '@/lib/utils/table-utils'
import { eq, and, desc, asc, count, or, sql, isNotNull } from 'drizzle-orm'
import { excludeDeleted, createLocaleInsensitiveSearch } from '@/lib/db/utils'
import { logSentEmail, type AttachmentMetadata } from '@/lib/mail/email-logger'
import { uploadFile, getFileFromS3 } from '@/lib/s3/utils'
import { uploadEmailHtmlContent } from '@/lib/email/email-html-storage'
import { logger } from '@/lib/logger'

const attachmentSchema = z.object({
  fileName: z.string(),
  originalName: z.string(),
  path: z.string(),
  size: z.number(),
  mimeType: z.string(),
  url: z.string().optional(),
  bucket: z.string().optional(),
})

const inlineImageSchema = z.object({
  cid: z.string(),
  fileName: z.string(),
  originalName: z.string(),
  path: z.string(),
  size: z.number(),
  mimeType: z.string(),
  bucket: z.string().optional(),
  fileId: z.string().optional(),
  url: z.string().optional(),
})

export const mailRouter = router({
  send: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.CREATE,
    getTableColumnNames(emailLogs)
  )
    .input(
      z.object({
        to: z.array(z.string()).min(1, 'At least one recipient is required'),
        cc: z.array(z.string()).optional(),
        bcc: z.array(z.string()).optional(),
        subject: z.string().min(1, 'Subject is required'),
        body: z.string().min(1, 'Body is required'),
        htmlBody: z.string().optional(),
        attachments: z.array(attachmentSchema).optional(),
        inlineImages: z.array(inlineImageSchema).optional(),
        threadId: z.string().uuid().optional(),
        inReplyTo: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const senderEmail = 'no-reply@aksiyonsoft.com'
        const senderName = 'Aksiyon Soft Admin'

        // Prepare attachments for nodemailer - read from MinIO
        let nodemailerAttachments: Array<{
          filename: string
          content: Buffer
          contentType?: string
          cid?: string
        }> = []

        // Process regular attachments
        if (input.attachments && input.attachments.length > 0) {
          try {
            const regularAttachments = await Promise.all(
              input.attachments.map(async (att) => {
                try {
                  // Read file from MinIO
                  const fileBuffer = await getFileFromS3(
                    att.path,
                    att.bucket // Use bucket from metadata if available
                  )
                  return {
                    filename: att.originalName,
                    content: fileBuffer,
                    contentType: att.mimeType,
                  }
                } catch (error) {
                  logger.error(
                    {
                      error:
                        error instanceof Error ? error.message : String(error),
                      attachmentPath: att.path,
                      fileName: att.originalName,
                    },
                    'Failed to read attachment from MinIO'
                  )
                  throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed to read attachment: ${att.originalName}`,
                    cause: error,
                  })
                }
              })
            )
            nodemailerAttachments.push(...regularAttachments)
          } catch (error) {
            logger.error(
              {
                error: error instanceof Error ? error.message : String(error),
                attachmentCount: input.attachments.length,
              },
              'Failed to prepare attachments'
            )
            throw error
          }
        }

        // Process inline images (CID attachments)
        if (input.inlineImages && input.inlineImages.length > 0) {
          try {
            const inlineAttachments = await Promise.all(
              input.inlineImages.map(async (img) => {
                try {
                  // Read file from MinIO
                  const fileBuffer = await getFileFromS3(img.path, img.bucket)
                  return {
                    filename: img.originalName,
                    content: fileBuffer,
                    contentType: img.mimeType,
                    cid: img.cid, // CID for inline attachment
                  }
                } catch (error) {
                  logger.error(
                    {
                      error:
                        error instanceof Error ? error.message : String(error),
                      attachmentPath: img.path,
                      fileName: img.originalName,
                      cid: img.cid,
                    },
                    'Failed to read inline image from MinIO'
                  )
                  throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed to read inline image: ${img.originalName}`,
                    cause: error,
                  })
                }
              })
            )
            nodemailerAttachments.push(...inlineAttachments)
          } catch (error) {
            logger.error(
              {
                error: error instanceof Error ? error.message : String(error),
                inlineImageCount: input.inlineImages.length,
              },
              'Failed to prepare inline images'
            )
            throw error
          }
        }

        // Send email
        const info = await sendMail({
          to: input.to,
          cc: input.cc,
          bcc: input.bcc,
          subject: input.subject,
          html: input.htmlBody || input.body,
          attachments:
            nodemailerAttachments.length > 0
              ? nodemailerAttachments
              : undefined,
        })

        // Merge attachments and inline images for logging (inline images need cid + url for display)
        const allAttachments: AttachmentMetadata[] = [
          ...(input.attachments || []),
          ...(input.inlineImages || []).map((img) => ({
            fileName: img.fileName,
            originalName: img.originalName,
            path: img.path,
            size: img.size,
            mimeType: img.mimeType,
            bucket: img.bucket,
            url:
              img.url ||
              (img.fileId ? `/api/files/${img.fileId}/view` : undefined),
            cid: img.cid,
          })),
        ]

        // Upload HTML to S3 (email-logs prefix, same as jobs)
        const { url: htmlContentUrl } = await uploadEmailHtmlContent(
          input.htmlBody || input.body,
          {}
        )

        // Log email to database
        const emailLogId = await logSentEmail({
          emailType: 'MANUAL',
          recipientEmails: input.to,
          ccEmails: input.cc,
          bccEmails: input.bcc,
          senderEmail,
          senderName,
          subject: input.subject,
          htmlContent: htmlContentUrl,
          textContent: input.body,
          attachments: allAttachments,
          status: 'SENT',
          sentAt: new Date(),
          threadId: input.threadId,
          inReplyTo: input.inReplyTo,
          createdBy: ctx.session.user.id,
        })

        return {
          success: true,
          emailLogId,
          messageId: info.messageId,
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send email',
          cause: error,
        })
      }
    }),

  listSent: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.READ,
    getTableColumnNames(emailLogs)
  )
    .input(
      createPaginationSchema(['subject', 'senderEmail', 'createdAt']).extend({
        search: z.string().optional(),
        status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
        isDraft: z.boolean().optional(),
        trashOnly: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, search, sortBy, sortOrder } = input
      const offset = (page - 1) * limit

      const conditions: ReturnType<typeof sql>[] = []

      if (input.status) {
        conditions.push(eq(emailLogs.status, input.status))
      }

      if (input.isDraft !== undefined) {
        conditions.push(eq(emailLogs.isDraft, input.isDraft))
      }

      // Filter by email type (MANUAL or SENT)
      conditions.push(
        or(eq(emailLogs.emailType, 'MANUAL'), eq(emailLogs.emailType, 'SENT'))!
      )

      // Filter deleted: trash shows only deleted, sent/drafts exclude deleted
      if (input.trashOnly) {
        conditions.push(isNotNull(emailLogs.deletedAt))
      } else {
        conditions.push(excludeDeleted(emailLogs))
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

      const orderBy = sortOrder === 'asc' ? asc : desc
      let sortColumn:
        | typeof emailLogs.createdAt
        | typeof emailLogs.subject
        | typeof emailLogs.senderEmail = emailLogs.createdAt
      if (sortBy === 'subject') sortColumn = emailLogs.subject
      if (sortBy === 'senderEmail') sortColumn = emailLogs.senderEmail

      const [data, total] = await Promise.all([
        ctx.db
          .select({
            id: emailLogs.id,
            emailType: emailLogs.emailType,
            recipientEmails: emailLogs.recipientEmails,
            ccEmails: emailLogs.ccEmails,
            senderEmail: emailLogs.senderEmail,
            senderName: emailLogs.senderName,
            subject: emailLogs.subject,
            htmlContent: emailLogs.htmlContent,
            textContent: emailLogs.textContent,
            attachments: emailLogs.attachments,
            status: emailLogs.status,
            sentAt: emailLogs.sentAt,
            isRead: emailLogs.isRead,
            isDraft: emailLogs.isDraft,
            threadId: emailLogs.threadId,
            createdAt: emailLogs.createdAt,
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

      return {
        data,
        pagination: {
          page,
          limit,
          total: total[0].count,
          totalPages: Math.ceil(total[0].count / limit),
        },
      }
    }),

  getById: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.READ,
    getTableColumnNames(emailLogs)
  )
    .input(
      z.object({
        id: z.string().uuid(),
        includeDeleted: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const conditions = [eq(emailLogs.id, input.id)]
      if (!input.includeDeleted) {
        conditions.push(excludeDeleted(emailLogs))
      }

      const email = await ctx.db
        .select()
        .from(emailLogs)
        .where(and(...conditions))
        .limit(1)

      if (!email.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email not found',
        })
      }

      return { type: 'sent' as const, data: email[0] }
    }),

  markAsRead: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.UPDATE,
    getTableColumnNames(emailLogs)
  )
    .input(
      z.object({
        id: z.string().uuid(),
        isRead: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(emailLogs)
        .set({ isRead: input.isRead })
        .where(eq(emailLogs.id, input.id))

      return { success: true }
    }),

  delete: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.DELETE,
    getTableColumnNames(emailLogs)
  )
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(emailLogs)
        .set({ deletedAt: new Date(), deletedBy: ctx.session.user.id })
        .where(eq(emailLogs.id, input.id))

      return { success: true }
    }),

  restore: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.UPDATE,
    getTableColumnNames(emailLogs)
  )
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [updated] = await ctx.db
        .update(emailLogs)
        .set({ deletedAt: null, deletedBy: null })
        .where(and(eq(emailLogs.id, input.id), isNotNull(emailLogs.deletedAt)))
        .returning({ id: emailLogs.id })

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email not found or not deleted',
        })
      }

      return { success: true }
    }),

  getUsers: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.READ,
    getTableColumnNames(user)
  )
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const conditions = [excludeDeleted(user)]

      if (input.search) {
        conditions.push(
          or(
            createLocaleInsensitiveSearch(user.name, input.search),
            createLocaleInsensitiveSearch(user.email, input.search),
            createLocaleInsensitiveSearch(user.lastName, input.search)
          )!
        )
      }

      const users = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
        })
        .from(user)
        .where(and(...conditions))
        .limit(input.limit)

      return users.filter(
        (u) => u.email && u.email !== 'default@aksiyonsoft.com'
      )
    }),

  uploadAttachment: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.CREATE,
    getTableColumnNames(emailLogs)
  )
    .input(
      z.object({
        file: z.string(), // Base64 encoded file
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Decode base64 file
        const fileBuffer = Buffer.from(input.file, 'base64')

        // Upload to MinIO
        const uploadResult = await uploadFile(
          fileBuffer,
          input.fileName,
          input.mimeType,
          {
            prefix: 'mail-attachments',
            uploadedBy: ctx.session.user.id,
          }
        )

        const attachmentMetadata: AttachmentMetadata = {
          fileName: uploadResult.fileName,
          originalName: uploadResult.originalName,
          path: uploadResult.fileName,
          size: uploadResult.size,
          mimeType: uploadResult.mimeType,
          url: uploadResult.url,
          bucket: uploadResult.bucket,
          fileId: uploadResult.id || uploadResult.fileId,
        }

        return attachmentMetadata
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload attachment',
          cause: error,
        })
      }
    }),

  saveDraft: rbacWithColumnAccessProcedure(
    SCOPES.MAIL,
    PERMISSIONS.CREATE,
    getTableColumnNames(emailLogs)
  )
    .input(
      z.object({
        id: z.string().uuid().optional(),
        to: z.array(z.string()),
        cc: z.array(z.string()).optional(),
        bcc: z.array(z.string()).optional(),
        subject: z.string(),
        body: z.string(),
        htmlBody: z.string().optional(),
        attachments: z.array(attachmentSchema).optional(),
        inlineImages: z.array(inlineImageSchema).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const senderEmail = 'no-reply@aksiyonsoft.com'
      const senderName = 'Aksiyon Soft Admin'

      // Store inline images in metadata or attachments field
      // We'll store them in attachments array with a special marker
      const allAttachments = [
        ...(input.attachments || []),
        ...(input.inlineImages || []).map((img) => ({
          ...img,
          isInline: true,
        })),
      ]

      if (input.id) {
        // Update existing draft
        await ctx.db
          .update(emailLogs)
          .set({
            recipientEmails: input.to,
            ccEmails: input.cc || [],
            bccEmails: input.bcc || [],
            subject: input.subject,
            htmlContent: input.htmlBody || input.body,
            textContent: input.body,
            attachments: allAttachments,
            isDraft: true,
            lastUpdatedBy: ctx.session.user.id,
          })
          .where(eq(emailLogs.id, input.id))

        return { id: input.id }
      } else {
        // Create new draft
        const [draft] = await ctx.db
          .insert(emailLogs)
          .values({
            emailType: 'MANUAL',
            recipientEmails: input.to,
            ccEmails: input.cc || [],
            bccEmails: input.bcc || [],
            senderEmail,
            senderName,
            subject: input.subject,
            htmlContent: input.htmlBody || input.body,
            textContent: input.body,
            attachments: allAttachments,
            status: 'PENDING',
            isDraft: true,
            isRead: false,
            createdBy: ctx.session.user.id,
          })
          .returning({ id: emailLogs.id })

        return { id: draft.id }
      }
    }),
})
