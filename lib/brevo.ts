/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { env } from "@/lib/env";
import { Resend } from "resend";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
}

interface EmailSendResult {
  ok: boolean;
  status: number;
  errorBody?: string;
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendBrevoEmail(
  options: SendEmailOptions,
): Promise<EmailSendResult> {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn("Resend is not configured. Skipping email send.");
    return { ok: false, status: 0, errorBody: "Resend not configured" };
  }

  const fromEmail = "no-reply@hcs-u7.info";
  const fromName = "HCS-U7 Admin";
  const from = `${fromName} <${fromEmail}>`;

  try {
    const payload: any = {
      from,
      to: options.to.map((recipient) => recipient.email),
      subject: options.subject,
      html: options.htmlContent,
      text: options.textContent,
    };

    const { data, error } = await resend.emails.send(payload);

    // eslint-disable-next-line no-console
    console.log("Resend email send result:", data);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Resend email send failed:", error);
      return { ok: false, status: 500, errorBody: String(error) };
    }

    return { ok: true, status: 200 };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Resend email send failed:", error);
    return {
      ok: false,
      status: 500,
      errorBody:
        error instanceof Error ? error.message : String(error),
    };
  }
}
