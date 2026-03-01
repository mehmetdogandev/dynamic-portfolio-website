import nodemailer from "nodemailer";

type SentMessageInfo = Parameters<typeof nodemailer.getTestMessageUrl>[0];

export interface EtherealLogParams {
  info: SentMessageInfo;
  to: string;
  sender: string;
  context: string;
}

export function logEtherealPreview({
  info,
  to,
  sender,
  context,
}: EtherealLogParams): void {
  const url = nodemailer.getTestMessageUrl(info);
  if (!url) return;
  const lines = [
    "===================================",
    `to: ${to}`,
    `sender: ${sender}`,
    `context: ${context}`,
    url,
    "===================================",
  ];
  console.log(lines.join("\n"));
}
