/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { env } from "@/lib/env";

interface BrevoEmailRecipient {
  email: string;
  name?: string;
}

interface SendBrevoEmailOptions {
  to: BrevoEmailRecipient[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
}

export async function sendBrevoEmail(options: SendBrevoEmailOptions): Promise<void> {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    // eslint-disable-next-line no-console
    console.warn("Brevo is not configured. Skipping email send.");
    return;
  }

  const senderName = env.BREVO_SENDER_NAME || "HCS-U7 Admin";

  const payload = {
    sender: {
      email: env.BREVO_SENDER_EMAIL,
      name: senderName,
    },
    to: options.to,
    subject: options.subject,
    htmlContent: options.htmlContent,
    textContent: options.textContent,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": env.BREVO_API_KEY,
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error("Brevo email send failed:", res.status, body);
  }
}
