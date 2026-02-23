import nodemailer from "nodemailer";

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
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error(
      "SMTP yapılandırması eksik. Production için SMTP_HOST, SMTP_USER ve SMTP_PASSWORD tanımlayın (Zoho EU: smtp.zoho.eu)."
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  const subject = "Şifre sıfırlama – mehmetdogandev.com";
  const html = `
    <p>Merhaba,</p>
    <p>Şifre sıfırlama talebinde bulundunuz. Aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
    <p><a href="${url}" style="word-break: break-all;">${url}</a></p>
    <p>Bu link 1 saat geçerlidir. Talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
    <p>— mehmetdogandev.com</p>
  `.trim();

  await transporter.sendMail({
    from: `"${MAIL_FROM_NAME}" <${SMTP_USER}>`,
    to,
    subject,
    html,
    text: `Şifre sıfırlama linki: ${url}\n\nBu link 1 saat geçerlidir.`,
  });
}
