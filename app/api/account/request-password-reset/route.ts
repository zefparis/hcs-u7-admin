/**
 * Request password reset for an admin account.
 * Generates a time-limited token and sends a reset link via email.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendAppEmail } from "@/lib/email/resend";

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

function generateToken(length = 32): string {
  return randomBytes(length).toString("hex");
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

  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });

  // Always respond success to avoid leaking account existence
  if (!admin) {
    return NextResponse.json({ success: true });
  }

  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const { ipAddress, userAgent } = getClientInfo(request);

  await prisma.passwordResetToken.create({
    data: {
      adminId: admin.id,
      token,
      expiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminUserId: admin.id,
      adminEmail: admin.email,
      action: "ADMIN_PASSWORD_RESET_REQUESTED",
      entityType: "AdminUser",
      entityId: admin.id,
      changes: { password: "reset_requested" },
      ipAddress,
      userAgent,
    },
  });

  const baseUrl =
    env.ADMIN_URL ?? env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const resetUrl = `${normalizedBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendAppEmail({
      to: admin.email,
      subject: "Réinitialisation de votre mot de passe HCS-U7 Admin",
      html:
        `<p>Bonjour,</p>` +
        `<p>Vous avez demandé la réinitialisation de votre mot de passe pour le dashboard HCS-U7 Admin.</p>` +
        `<p>Cliquez sur le lien suivant pour choisir un nouveau mot de passe :</p>` +
        `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
        `<p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>` +
        `<p>— HCS-U7 Admin</p>`,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to send password reset email:", error);
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ success: true, debugToken: token });
  }

  return NextResponse.json({ success: true });
}
