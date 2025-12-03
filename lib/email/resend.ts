/**
 * Centralized Resend email helper for the HCS-U7 Admin app.
 */

import { Resend } from "resend";

import { env } from "@/lib/env";

export const resend = new Resend(env.RESEND_API_KEY);

export interface SendAppEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendAppEmail({
  to,
  subject,
  html,
}: SendAppEmailOptions) {
  const payload: any = {
    from: `HCS-U7 <${env.RESEND_FROM}>`,
    to,
    subject,
    html,
    reply_to: env.RESEND_REPLY_TO,
  };

  return resend.emails.send(payload);
}
