import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { ReactNode } from 'react'
import { render } from '@react-email/render'
import { logger } from '../logger'

// Cache transporter to reuse Ethereal test account in development
let cachedTransporter: Promise<Transporter> | null = null

function createTransporter(): Promise<Transporter> {
  const hasCredentials =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  const isProduction = process.env.NODE_ENV === 'production'

  if (hasCredentials) {
    const port = Number(process.env.SMTP_PORT)
    // 465 = implicit TLS (SMTPS); 587 = STARTTLS (secure: false, upgrade)
    const secure =
      port === 465 ||
      process.env.SMTP_SECURE === 'true' ||
      process.env.SMTP_SECURE === '1'
    // Production: create new transporter each time (no cache needed)
    return Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    )
  } else {
    if (isProduction) {
      throw new Error('SMTP environment variables are not set')
    }

    // Development: cache Ethereal transporter to reuse test account
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTestAccount().then((testAccount) => {
        logger.info(
          {
            user: testAccount.user,
          },
          'Created new Ethereal test account for email sending'
        )
        return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })
      })
    }

    return cachedTransporter
  }
}

function isValidEmail(email: string) {
  // is email valid: no-reply@aksiyonsoft.com => true
  // is email valid: @ => false
  // is email valid: no-reply@aksiyonsoft.com => true
  // is email valid: no-reply@aksiyonsoft => false
  // is email valid: no-reply@aksiyonsoft.com.com => true
  const emailRegex =
    // eslint-disable-next-line no-control-regex
    /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/
  return emailRegex.test(email)
}

function smtpCredentialsConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

function defaultFromAddress(): string {
  if (smtpCredentialsConfigured()) {
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

export async function sendMail(options: nodemailer.SendMailOptions) {
  const transporter = await createTransporter()
  const usingSmtp = smtpCredentialsConfigured()
  const fromAddress = defaultFromAddress()
  const fromName = defaultFromName()

  // Dev (Ethereal): önceki davranış — göndericiyi CC’ye eklemek test için yardımcı olabiliyor.
  // Prod SMTP: göndericiyi otomatik CC’ye ekleme.
  const cc = new Set<string>()
  if (!usingSmtp) {
    cc.add(fromAddress)
  }

  if (options.cc) {
    if (Array.isArray(options.cc)) {
      options.cc.forEach((email) => {
        if (typeof email === 'string') {
          cc.add(email)
        } else {
          cc.add(email.address)
        }
      })
    } else {
      if (typeof options.cc === 'string') {
        cc.add(options.cc)
      } else {
        cc.add(options.cc.address)
      }
    }
  }

  const validCCs = new Set<string>()
  // loop every email in cc and check if it is valid
  for (const email of cc) {
    if (isValidEmail(email)) {
      validCCs.add(email)
    }
  }

  // Validate BCC emails if provided
  const validBCCs = new Set<string>()
  if (options.bcc) {
    const bccList = Array.isArray(options.bcc) ? options.bcc : [options.bcc]
    for (const email of bccList) {
      const emailStr = typeof email === 'string' ? email : email.address
      if (isValidEmail(emailStr)) {
        validBCCs.add(emailStr)
      }
    }
  }

  const mailOptions: nodemailer.SendMailOptions = {
    ...options,
    from: {
      name: fromName,
      address: fromAddress,
    },
    replyTo: {
      name: fromName,
      address: fromAddress,
    },
    cc: validCCs.size > 0 ? Array.from(validCCs) : undefined,
  }

  // Add BCC if there are valid BCC emails
  if (validBCCs.size > 0) {
    mailOptions.bcc = Array.from(validBCCs)
  }

  const info = await transporter.sendMail(mailOptions)

  // Log Ethereal test link in development
  if (process.env.NODE_ENV !== 'production') {
    const message = nodemailer.getTestMessageUrl(info)
    if (message) {
      console.log('\n')
      console.log(
        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      )
      console.log('📧 [NODEMAILER] Email Sent Successfully!')
      console.log(
        `📬 To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`
      )
      console.log(`📝 Subject: ${options.subject}`)
      console.log('🔗 Ethereal Test Link:')
      console.log(message)
      console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
      )

      // Also log via logger for structured logging
      logger.info(
        {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          etherealLink: message,
          messageId: info.messageId,
        },
        `Email sent - Ethereal test link: ${message}`
      )
    } else {
      logger.info(
        {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          messageId: info.messageId,
        },
        'Email sent'
      )
    }
  } else {
    // Production: minimal logging without sensitive data
    logger.info(
      {
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc,
        subject: options.subject,
        attachmentCount: Array.isArray(options.attachments)
          ? options.attachments.length
          : 0,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      },
      'Email sent'
    )
  }

  return info
}

export const sendReactMail = async (
  component: ReactNode,
  options: nodemailer.SendMailOptions
) => {
  const html = await render(component)
  return sendMail({ ...options, html })
}
