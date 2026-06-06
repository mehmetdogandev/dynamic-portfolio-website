import { sendMail } from '@/lib/mail'
import { logSentEmail } from '@/lib/mail/email-logger'
import { uploadEmailHtmlContent } from '@/lib/email/email-html-storage'
import { buildCCListForUser } from '@/lib/jobs/shared/cc-list-builder'
import {
  renderContactAutoReplyHtml,
  renderContactNotificationToTeamHtml,
  renderVisitNotificationHtml,
} from '@/lib/mail/website-templates'
import { getWebsiteVisitRecipientEmails } from '@/lib/mail/website-visit-recipients'
import { logger } from '@/lib/logger'

function defaultFromAddress(): string {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return (
      process.env.SMTP_FROM?.trim() ||
      process.env.SMTP_USER?.trim() ||
      'no-reply@aksiyonsoft.com'
    )
  }
  return 'no-reply@aksiyonsoft.com'
}

function defaultFromName(): string {
  return process.env.SMTP_FROM_NAME?.trim() || 'Aksiyon Soft'
}

async function getWebsiteContactOperationRecipients(): Promise<string[]> {
  const raw = process.env.WEBSITE_CONTACT_RECIPIENTS
  if (raw?.trim()) {
    return [
      ...new Set(
        raw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      ),
    ]
  }
  return buildCCListForUser('website-contact')
}

async function logWebsiteSentHtml(params: {
  to: string[]
  subject: string
  html: string
  emailType: 'WEBSITE_CONTACT' | 'WEBSITE_VISIT'
}): Promise<void> {
  const { url: htmlContentUrl } = await uploadEmailHtmlContent(params.html, {})
  const senderEmail = defaultFromAddress()
  const senderName = defaultFromName()
  await logSentEmail({
    emailType: params.emailType,
    recipientEmails: params.to,
    senderEmail,
    senderName,
    subject: params.subject,
    htmlContent: htmlContentUrl,
    textContent: undefined,
    status: 'SENT',
    sentAt: new Date(),
  })
}

export async function sendWebsiteContactFlow(input: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<void> {
  const recipients = await getWebsiteContactOperationRecipients()
  if (recipients.length === 0) {
    logger.warn('WEBSITE_CONTACT: no recipient e-mails configured; skip send')
    return
  }

  const teamHtml = renderContactNotificationToTeamHtml(input)
  const teamSubject = `İletişim formu: ${input.name}`

  await sendMail({
    to: recipients,
    subject: teamSubject,
    html: teamHtml,
  })
  await logWebsiteSentHtml({
    to: recipients,
    subject: teamSubject,
    html: teamHtml,
    emailType: 'WEBSITE_CONTACT',
  })

  const autoHtml = renderContactAutoReplyHtml({ name: input.name })
  const autoSubject = 'Bilgilerinizi aldık — Aksiyon Soft'
  await sendMail({
    to: input.email,
    subject: autoSubject,
    html: autoHtml,
  })
  await logWebsiteSentHtml({
    to: [input.email],
    subject: autoSubject,
    html: autoHtml,
    emailType: 'WEBSITE_CONTACT',
  })
}

export async function sendWebsiteVisitNotification(input: {
  ip: string
  userAgent: string
}): Promise<void> {
  const recipients = await getWebsiteVisitRecipientEmails()
  if (recipients.length === 0) {
    logger.info(
      'WEBSITE_VISIT: no users with MAIL/MAIL_LOG ACCESS; skip visit e-mail'
    )
    return
  }

  const atIso = new Date().toISOString()
  const html = renderVisitNotificationHtml({
    ip: input.ip,
    userAgent: input.userAgent || '-',
    atIso,
  })
  const subject = 'Web sitesi ziyareti'
  await sendMail({
    to: recipients,
    subject,
    html,
  })
  await logWebsiteSentHtml({
    to: recipients,
    subject,
    html,
    emailType: 'WEBSITE_VISIT',
  })
}
