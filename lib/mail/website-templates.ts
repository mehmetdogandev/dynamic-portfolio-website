import { WEBSITE_EMAIL_COLORS, websiteLogoUrl } from '@/lib/mail/website-brand'

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const wrapper = (inner: string) =>
  `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
</head>
<body style="margin:0;padding:24px;font-family:Georgia,'Times New Roman',serif;background:${WEBSITE_EMAIL_COLORS.pageBgHex};color:${WEBSITE_EMAIL_COLORS.foregroundHex};">
${inner}
</body>
</html>`

const postcard = (title: string, bodyHtml: string) => {
  const c = WEBSITE_EMAIL_COLORS
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="height:4px;background:${c.primaryHex};background:${c.primaryBgOk};border-radius:2px 2px 0 0;font-size:0;line-height:0;">&nbsp;</td>
    </tr>
    <tr>
      <td bgcolor="${c.cardHex}" style="background:${c.cardHex};border:1px solid ${c.borderHex};border-top:none;border-radius:0 0 8px 8px;padding:24px 28px 28px;">
        <p style="margin:0 0 16px;font-size:20px;font-weight:600;letter-spacing:-0.02em;font-family:Georgia,serif;color:${c.primaryHex};">${title}</p>
        ${bodyHtml}
      </td>
    </tr>
  </table>
  <p style="text-align:center;font-size:11px;color:${c.mutedHex};margin-top:20px;font-family:system-ui,sans-serif;">Aksiyon Soft</p>`
}

export function renderContactNotificationToTeamHtml(input: {
  name: string
  email: string
  phone?: string
  message: string
}): string {
  const phoneRow =
    input.phone && input.phone.trim()
      ? `<tr><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;color:${WEBSITE_EMAIL_COLORS.mutedHex};">Telefon</td><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;">${escapeHtml(
          input.phone.trim()
        )}</td></tr>`
      : ''
  const inner = wrapper(
    `${postcard(
      'Web sitesi iletişim formu',
      `
      <table role="presentation" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0 16px;">
            <img src="${websiteLogoUrl()}" alt="Aksiyon Soft" width="120" height="auto" style="display:block;border:0;max-width:100%;" />
          </td>
        </tr>
        <tr><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;color:${WEBSITE_EMAIL_COLORS.mutedHex};">Ad</td><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;">${escapeHtml(
          input.name
        )}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;color:${WEBSITE_EMAIL_COLORS.mutedHex};">E-posta</td><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;">${escapeHtml(
          input.email
        )}</td></tr>
        ${phoneRow}
        <tr><td colspan="2" style="padding:16px 0 8px;font-size:12px;font-family:system-ui,sans-serif;color:${WEBSITE_EMAIL_COLORS.mutedHex};">Mesaj</td></tr>
        <tr><td colspan="2" style="padding:0;font-size:14px;line-height:1.5;font-family:system-ui,sans-serif;white-space:pre-wrap;border-left:3px solid ${WEBSITE_EMAIL_COLORS.accentHex};padding-left:12px;">${escapeHtml(
          input.message
        )}</td></tr>
      </table>`
    )}`
  )
  return inner
}

export function renderContactAutoReplyHtml(input: { name: string }): string {
  return wrapper(
    `${postcard(
      'Bilgilerinizi aldık',
      `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;font-family:system-ui,sans-serif;">Merhaba ${escapeHtml(
        input.name
      )},</p>
      <p style="margin:0;font-size:15px;line-height:1.6;font-family:system-ui,sans-serif;">İletişim formunuz bize ulaştı. En kısa sürede size dönüş yapacağız.</p>`
    )}`
  )
}

export function renderVisitNotificationHtml(input: {
  ip: string
  userAgent: string
  atIso: string
}): string {
  return wrapper(
    `${postcard(
      'Site ziyareti',
      `<table role="presentation" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0 16px;">
            <img src="${websiteLogoUrl()}" alt="Aksiyon Soft" width="120" height="auto" style="display:block;border:0;max-width:100%;" />
          </td>
        </tr>
        <tr><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;color:${WEBSITE_EMAIL_COLORS.mutedHex};">Tarih (UTC)</td><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;">${escapeHtml(
          input.atIso
        )}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;color:${WEBSITE_EMAIL_COLORS.mutedHex};">IP</td><td style="padding:6px 0;font-size:14px;font-family:monospace;">${escapeHtml(
          input.ip
        )}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;font-family:system-ui,sans-serif;color:${WEBSITE_EMAIL_COLORS.mutedHex};">User-Agent</td><td style="padding:6px 0;font-size:12px;word-break:break-all;font-family:monospace;">${escapeHtml(
          input.userAgent
        )}</td></tr>
      </table>`
    )}`
  )
}
