import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE !== "false";
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME ?? "Mehmet Doğan";

export interface SendResetPasswordEmailParams {
  to: string;
  url: string;
}

export async function sendResetPasswordEmail({
  to,
  url,
}: SendResetPasswordEmailParams): Promise<void> {
  const hasSmtpConfig = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

  let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  let fromAddress: string;
  let testAccount: nodemailer.TestAccount | undefined;

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
    fromAddress = `"${MAIL_FROM_NAME}" <${SMTP_USER}>`;
  } else {
    testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    fromAddress = `"${MAIL_FROM_NAME}" <${testAccount.user}>`;
  }

  const subject = "Şifre Sıfırlama – mehmetdogandev.com";

  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, sans-serif; background:#f3f4f6; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 6px 18px rgba(0,0,0,0.06);">

          <tr>
            <td align="center" style="font-size:26px; font-weight:600; color:#111;">
              Şifre Sıfırlama Talebi
            </td>
          </tr>

          <tr>
            <td style="padding:20px 0; font-size:16px; color:#333; line-height:1.6;">
              Merhaba,<br><br>
              Şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 25px 0;">
              <a href="${url}"
                style="display:inline-block; background:#4F46E5; color:#ffffff; padding:14px 28px;
                       border-radius:8px; text-decoration:none; font-size:16px; font-weight:600;">
                Şifreyi Sıfırla
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding-top:20px; font-size:14px; color:#555; line-height:1.6;">
              Eğer buton çalışmazsa, aşağıdaki bağlantıyı kullanabilirsiniz:<br><br>
              <span style="word-break:break-all; color:#4F46E5;">${url}</span>
            </td>
          </tr>

          <tr>
            <td style="padding-top:30px; font-size:13px; color:#999; text-align:center;">
              Bu bağlantı 1 saat geçerlidir.<br>
              Talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
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