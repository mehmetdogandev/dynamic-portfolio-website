import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schemas";
import { logEtherealPreview } from "./log-ethereal-preview";
import { getMailTransporter } from "./get-transporter";
import { getActiveEmailLogoUrl } from "./get-email-logo-url";

export interface SendChangeEmailParams {
  to: string;
  url: string;
  userId: string;
}

export async function sendChangeEmailVerification({
  to,
  url,
  userId,
}: SendChangeEmailParams): Promise<void> {
  const { transporter, fromAddress, hasSmtpConfig, testAccount } =
    await getMailTransporter();

  const logoUrl = await getActiveEmailLogoUrl();

  const subject = "E-posta Değişikliği Doğrulama – mehmetdogandev.com";

  const brandBarContent = logoUrl
    ? `<img src="${logoUrl}" alt="mehmetdogandev.com" style="height:40px; max-width:200px; object-fit:contain; display:block;" />`
    : `<span style="color:#ffffff !important;">mehmetdogandev.com</span>`;

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
            <td style="padding:40px 40px 10px 40px;">
              <div style="font-size:24px; font-weight:700; color:#0f172a;">
                E-posta Değişikliği Doğrulama
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 40px; font-size:16px; color:#334155; line-height:1.7;">
              Merhaba,<br><br>
              Hesabınızın e-posta adresini değiştirmek istediğinizi doğruluyoruz.
              Yeni e-posta adresinizi onaylamak için aşağıdaki butona tıklayın.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 40px;">
              <a href="${url}"
                style="display:inline-block; background:#2d4a7c; color:#ffffff; padding:16px 34px; border-radius:10px; text-decoration:none; font-size:16px; font-weight:600;">
                E-postamı Doğrula
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px; font-size:14px; color:#475569; line-height:1.6;">
              Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın:<br>
              <span style="word-break:break-all; color:#2d4a7c;">${url}</span>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc; padding:24px 40px; text-align:center; font-size:13px; color:#64748b;">
              Bu bağlantı güvenlik nedeniyle sınırlı süre geçerlidir.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `.trim();

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    text: `E-posta doğrulama linki: ${url}`,
  });

  if (!hasSmtpConfig && testAccount) {
    logEtherealPreview({
      info,
      to,
      sender: fromAddress,
      context: "E-posta değişikliği doğrulama",
    });
  }

  await db
    .update(user)
    .set({ lastChangeEmailSentAt: new Date() })
    .where(eq(user.id, userId));
}
