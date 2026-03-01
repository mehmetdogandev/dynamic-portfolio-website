import { logEtherealPreview } from "./log-ethereal-preview";
import { getMailTransporter } from "./get-transporter";
import { getActiveEmailLogoUrl } from "./get-email-logo-url";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseRecipients(envValue: string | undefined): string[] {
  if (!envValue?.trim()) return [];
  return envValue
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export interface SendDiscussionNotifyAdminParams {
  projectName: string;
  projectSlug: string;
  username: string;
  message: string;
  adminPanelUrl: string;
}

export async function sendDiscussionNotifyAdmin(
  params: SendDiscussionNotifyAdminParams
): Promise<void> {
  const recipientsRaw = process.env.CONTACT_FORM_RECIPIENTS ?? "";
  const recipients = parseRecipients(recipientsRaw);
  if (recipients.length === 0) return;

  const { transporter, fromAddress, hasSmtpConfig, testAccount } =
    await getMailTransporter();

  const logoUrl = await getActiveEmailLogoUrl();

  const brandBarContent = logoUrl
    ? `<img src="${logoUrl}" alt="mehmetdogandev.com" style="height:40px; max-width:200px; object-fit:contain; display:block;" />`
    : `<span style="color:#ffffff !important;">mehmetdogandev.com</span>`;

  const messagePreview =
    params.message.length > 200 ? params.message.slice(0, 200) + "…" : params.message;

  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(90deg,#2d4a7c,#0d9488); padding:18px 32px; font-size:18px; font-weight:600;">
              ${brandBarContent}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px; font-size:15px; color:#334155; line-height:1.8;">
              <p><strong>Proje:</strong> ${escapeHtml(params.projectName)}</p>
                <p><strong>Kullanıcı:</strong> ${escapeHtml(params.username)}</p>
                <p><strong>Mesaj:</strong></p>
                <p style="white-space:pre-wrap; background:#f8fafc; padding:16px; border-radius:8px;">${escapeHtml(messagePreview)}</p>
                <p style="margin-top:20px;">
                  <a href="${params.adminPanelUrl}" style="color:#2d4a7c; font-weight:600;">Yorumları yönetmek için admin panele gidin</a>
                </p>
              </td>
          </tr>
          <tr>
            <td style="background:#f8fafc; padding:16px 40px; font-size:12px; color:#64748b;">
              Proje "${escapeHtml(params.projectName)}" için onaylanmış yeni yorum.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `.trim();

  const info = await transporter.sendMail({
    from: fromAddress,
    to: recipients,
    subject: `[Yorum Onaylandı] ${params.projectName} – ${params.username}`,
    html,
    text: `Proje: ${params.projectName}\nKullanıcı: ${params.username}\nMesaj: ${params.message}\n\nYönetim: ${params.adminPanelUrl}`,
  });

  if (!hasSmtpConfig && testAccount) {
    logEtherealPreview({
      info,
      to: recipients.join(", "),
      sender: fromAddress,
      context: "Yorum onayı – admin bildirimi",
    });
  }
}
