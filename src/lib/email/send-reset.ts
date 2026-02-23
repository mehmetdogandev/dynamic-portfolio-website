import nodemailer from "nodemailer";
import { getMailTransporter } from "./get-transporter";

export interface SendResetPasswordEmailParams {
  to: string;
  url: string;
}

export async function sendResetPasswordEmail({
  to,
  url,
}: SendResetPasswordEmailParams): Promise<void> {
  const { transporter, fromAddress, hasSmtpConfig, testAccount } =
    await getMailTransporter();

  const subject = "Şifre Sıfırlama – mehmetdogandev.com";

  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
    <tr>
      <td align="center" style="padding:40px 16px;">
  
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
  
          <!-- Top Brand Bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#4F46E5,#6366F1); padding:18px 32px; color:#ffffff; font-size:18px; font-weight:600;">
              mehmetdogandev.com
            </td>
          </tr>
  
          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 10px 40px;">
              <div style="font-size:24px; font-weight:700; color:#0f172a;">
                Şifre Sıfırlama Talebi
              </div>
            </td>
          </tr>
  
          <!-- Body -->
          <tr>
            <td style="padding:10px 40px 10px 40px; font-size:16px; color:#334155; line-height:1.7;">
              Merhaba,<br><br>
              Hesabınız için bir şifre sıfırlama talebi aldık.
              Yeni şifrenizi belirlemek için aşağıdaki butona tıklayabilirsiniz.
            </td>
          </tr>
  
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:30px 40px;">
              <a href="${url}"
                style="display:inline-block;
                       background:#4F46E5;
                       color:#ffffff;
                       padding:16px 34px;
                       border-radius:10px;
                       text-decoration:none;
                       font-size:16px;
                       font-weight:600;
                       box-shadow:0 6px 14px rgba(79,70,229,0.25);">
                Şifremi Yenile
              </a>
            </td>
          </tr>
  
          <!-- Divider -->
          <tr>
            <td style="padding:10px 40px;">
              <div style="height:1px; background:#e5e7eb;"></div>
            </td>
          </tr>
  
          <!-- Fallback Link -->
          <tr>
            <td style="padding:20px 40px; font-size:14px; color:#475569; line-height:1.6;">
              Buton çalışmazsa aşağıdaki bağlantıyı tarayıcınıza yapıştırabilirsiniz:<br><br>
              <span style="word-break:break-all; color:#4F46E5; font-weight:500;">
                ${url}
              </span>
            </td>
          </tr>
  
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc; padding:24px 40px; text-align:center; font-size:13px; color:#64748b; line-height:1.6;">
              Bu bağlantı güvenlik nedeniyle <strong>1 saat</strong> geçerlidir.<br>
              Talebi siz yapmadıysanız bu e-postayı dikkate almayabilirsiniz.
            </td>
          </tr>
  
        </table>
  
        <!-- Sub Footer -->
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-top:18px; font-size:12px; color:#94a3b8;">
              © ${new Date().getFullYear()} mehmetdogandev.com — Tüm hakları saklıdır
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
    text: `Şifre sıfırlama linki: ${url}\n\nBu link 1 saat geçerlidir.`,
  });

  if (!hasSmtpConfig && testAccount) {
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log("=== Ethereal test mail gönderildi ===");
    if (previewUrl) {
      console.log("Önizleme URL'si:", previewUrl);
    }
    console.log("====================================");
  }
}