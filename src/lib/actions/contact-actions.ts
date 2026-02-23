"use server";

import { sendContactFormEmails } from "@/lib/email/send-contact";

export type ContactFormInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export async function submitContactForm(
  data: ContactFormInput
): Promise<{ success: boolean; error?: string }> {
  return sendContactFormEmails(data);
}
