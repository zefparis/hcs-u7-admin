/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
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

const updateCredentialsSchema = z
  .object({
    currentPassword: z.string().min(6),
    newEmail: z.string().email().optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine(
    (data) => Boolean(data.newEmail || data.newPassword),
    {
      message: "At least one of newEmail or newPassword must be provided",
      path: ["newEmail"],
    }
  );

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { currentPassword, newEmail, newPassword } = parsed.data;

  const admin = await prisma.adminUser.findUnique({
    where: { id: (session.user as any).id },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // Vérifier soit le mot de passe actuel, soit le code maître (super admin bypass)
  const masterCode = env.ADMIN_MASTER_CODE;
  const isMasterCodeValid = masterCode && currentPassword === masterCode;
  const isPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);

  if (!isMasterCodeValid && !isPasswordValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const data: { email?: string; passwordHash?: string } = {};

  if (newEmail && newEmail.toLowerCase() !== admin.email.toLowerCase()) {
    const existingEmail = await prisma.adminUser.findUnique({
      where: { email: newEmail.toLowerCase() },
    });

    if (existingEmail && existingEmail.id !== admin.id) {
      return NextResponse.json(
        { error: "Another admin already uses this email" },
        { status: 409 }
      );
    }

    data.email = newEmail.toLowerCase();
  }

  if (newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    data.passwordHash = passwordHash;
  }

  if (!data.email && !data.passwordHash) {
    return NextResponse.json({ success: true });
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data,
  });

  const changes: any = {};

  if (typeof data.email !== "undefined") {
    changes.email = {
      previous: admin.email,
      next: updated.email,
    };
  }

  if (typeof data.passwordHash !== "undefined") {
    changes.password = "updated";
  }

  const { ipAddress, userAgent } = getClientInfo(request);

  await prisma.auditLog.create({
    data: {
      adminUserId: admin.id,
      adminEmail: admin.email,
      action: "ADMIN_CREDENTIALS_UPDATED",
      entityType: "AdminUser",
      entityId: admin.id,
      changes,
      ipAddress,
      userAgent,
    },
  });

  try {
    await sendAppEmail({
      to: updated.email,
      subject: "Vos identifiants HCS-U7 Admin ont été modifiés",
      html:
        "<p>Bonjour,</p>" +
        "<p>Vos identifiants de connexion au dashboard HCS-U7 Admin viennent d'être modifiés (email et/ou mot de passe).</p>" +
        "<p>Si vous n'êtes pas à l'origine de cette action, contactez immédiatement le support interne.</p>" +
        "<p>— HCS-U7 Admin</p>",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to send credentials update notification email:", error);
  }

  return NextResponse.json({ success: true });
}
