import nodemailer from "nodemailer";
import { getMailTransporter } from "./get-transporter";

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

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

export async function sendContactFormEmails(
  data: ContactFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const recipientsRaw = process.env.CONTACT_FORM_RECIPIENTS ?? "";
    const recipients = parseRecipients(recipientsRaw);

    const { transporter, fromAddress, hasSmtpConfig, testAccount } =
      await getMailTransporter();

    const autoReplyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(90deg,#2d4a7c,#0d9488); padding:18px 32px; color:#ffffff; font-size:18px; font-weight:600;">
                mehmetdogandev.com
              </td>
            </tr>
            <tr>
              <td style="padding:40px 40px 10px 40px;">
                <div style="font-size:24px; font-weight:700; color:#0f172a;">
                  Mesajınız Alındı
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 40px 30px 40px; font-size:16px; color:#334155; line-height:1.7;">
                Merhaba ${escapeHtml(data.name)},<br><br>
                Mailinizi aldık. Size en kısa sürede döneceğiz.
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc; padding:24px 40px; text-align:center; font-size:13px; color:#64748b;">
                © ${new Date().getFullYear()} mehmetdogandev.com
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `.trim();

    const adminHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(90deg,#2d4a7c,#0d9488); padding:18px 32px; color:#ffffff; font-size:18px; font-weight:600;">
                İletişim Formu – mehmetdogandev.com
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px; font-size:15px; color:#334155; line-height:1.8;">
                <p><strong>Ad Soyad:</strong> ${escapeHtml(data.name)}</p>
                <p><strong>E-posta:</strong> ${escapeHtml(data.email)}</p>
                <p><strong>Telefon:</strong> ${escapeHtml(data.phone)}</p>
                <p><strong>Mesaj:</strong></p>
                <p style="white-space:pre-wrap; background:#f8fafc; padding:16px; border-radius:8px;">${escapeHtml(data.message)}</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc; padding:16px 40px; font-size:12px; color:#64748b;">
                Gönderim: ${new Date().toISOString()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `.trim();

    const autoReplyInfo = await transporter.sendMail({
      from: fromAddress,
      to: data.email,
      subject: "Mesajınız Alındı – mehmetdogandev.com",
      html: autoReplyHtml,
      text: `Merhaba ${data.name},\n\nMailinizi aldık. Size en kısa sürede döneceğiz.`,
    });

    let adminInfo: Awaited<ReturnType<typeof transporter.sendMail>> | null =
      null;
    if (recipients.length > 0) {
      adminInfo = await transporter.sendMail({
        from: fromAddress,
        to: recipients,
        replyTo: data.email,
        subject: `[İletişim Formu] ${data.name} – ${data.email}`,
        html: adminHtml,
        text: `Ad Soyad: ${data.name}\nE-posta: ${data.email}\nTelefon: ${data.phone}\n\nMesaj:\n${data.message}`,
      });
    }

    if (!hasSmtpConfig && testAccount) {
      console.log("=== Ethereal test mail (contact form) gönderildi ===");
      const autoReplyUrl = nodemailer.getTestMessageUrl(autoReplyInfo);
      if (autoReplyUrl) {
        console.log("[1] Otomatik yanıt önizleme:", autoReplyUrl);
      }
      if (adminInfo) {
        const adminUrl = nodemailer.getTestMessageUrl(adminInfo);
        if (adminUrl) {
          console.log("[2] Admin bildirimi önizleme:", adminUrl);
        }
      }
      console.log("====================================");
    }

    return { success: true };
  } catch (err) {
    console.error("Contact form email error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}
