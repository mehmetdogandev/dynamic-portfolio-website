import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME ?? "Mehmet Doğan";

export type TransporterResult = {
  transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  fromAddress: string;
  hasSmtpConfig: boolean;
  testAccount?: nodemailer.TestAccount;
};

export async function getMailTransporter(): Promise<TransporterResult> {
  const hasSmtpConfig = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

  if (hasSmtpConfig) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      requireTLS: !SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
    const fromAddress = `"${MAIL_FROM_NAME}" <${SMTP_USER}>`;
    return { transporter, fromAddress, hasSmtpConfig };
  }

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  const fromAddress = `"${MAIL_FROM_NAME}" <${testAccount.user}>`;
  return { transporter, fromAddress, hasSmtpConfig, testAccount };
}
