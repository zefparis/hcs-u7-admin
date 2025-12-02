/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendBrevoEmail } from "@/lib/brevo";
import { env } from "@/lib/env";

function getClientInfo(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  return { ipAddress, userAgent };
}

const requestSchema = z.object({
  email: z.string().email(),
});

function generatePassword(length = 16): string {
  const bytes = randomBytes(length);
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    return NextResponse.json(
      {
        error:
          "Password reset is not configured. Please contact an administrator.",
      },
      { status: 503 }
    );
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!admin) {
    // Ne pas divulguer l'existence ou non du compte
    return NextResponse.json({ success: true });
  }

  const newPassword = generatePassword(16);
  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash },
  });

  const { ipAddress, userAgent } = getClientInfo(request);

  await prisma.auditLog.create({
    data: {
      adminUserId: admin.id,
      adminEmail: admin.email,
      action: "ADMIN_PASSWORD_RESET_EMAIL_SENT",
      entityType: "AdminUser",
      entityId: admin.id,
      changes: { password: "reset_via_email" },
      ipAddress,
      userAgent,
    },
  });

  try {
    const mailResult = await sendBrevoEmail({
      to: [
        {
          email: updated.email,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (updated as any).fullName ?? updated.email,
        },
      ],
      subject: "Nouveau mot de passe HCS-U7 Admin",
      textContent:
        `Bonjour,\n\nVous avez demandé un nouveau mot de passe pour le dashboard HCS-U7 Admin.\n\nVoici votre nouveau mot de passe temporaire :\n\n${newPassword}\n\nConnectez-vous avec cet email et ce mot de passe, puis changez-le immédiatement dans la section \"Mes identifiants de connexion\" (onglet Security).\n\nSi vous n'êtes pas à l'origine de cette demande, contactez immédiatement le support interne.\n\n— HCS-U7 Admin`,
    });
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        success: true,
        brevoStatus: mailResult.status,
        brevoOk: mailResult.ok,
        brevoError: mailResult.errorBody,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to send Brevo reset email:", error);
  }

  return NextResponse.json({ success: true });
}
