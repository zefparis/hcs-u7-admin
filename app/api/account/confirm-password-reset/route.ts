/**
 * Confirm password reset using a token and set a new password.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

function getClientInfo(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  return { ipAddress, userAgent };
}

const confirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { token, newPassword } = parsed.data;

  try {
    const tokenHash = hashToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const now = new Date();
    if (resetToken.expiresAt < now || resetToken.usedAt) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: resetToken.adminId },
      select: { email: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const { ipAddress, userAgent } = getClientInfo(request);

    await prisma.$transaction([
      prisma.adminUser.update({
        where: { id: resetToken.adminId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
      prisma.auditLog.create({
        data: {
          adminUserId: resetToken.adminId,
          adminEmail: admin.email,
          action: "ADMIN_PASSWORD_RESET_CONFIRMED",
          entityType: "AdminUser",
          entityId: resetToken.adminId,
          changes: { password: "reset_confirmed" },
          ipAddress,
          userAgent,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to confirm password reset:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
