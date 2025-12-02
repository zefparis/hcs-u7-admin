/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { AdminRole } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getClientInfo(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  return { ipAddress, userAgent };
}

function generatePassword(length = 16): string {
  const bytes = randomBytes(length);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

const createAdminSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
  role: z.nativeEnum(AdminRole),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { email, fullName, role } = parsed.data;

  const existing = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json({ error: "Admin with this email already exists" }, { status: 409 });
  }

  const password = generatePassword(16);
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.create({
    data: {
      email: email.toLowerCase(),
      fullName: fullName || null,
      role,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);

  await prisma.auditLog.create({
    data: {
      adminUserId: (session.user as any).id,
      adminEmail: session.user.email,
      action: "ADMIN_USER_CREATED",
      entityType: "AdminUser",
      entityId: admin.id,
      changes: {
        email: admin.email,
        role: admin.role,
      },
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ plaintextPassword: password, admin });
}

const updateRoleSchema = z.object({
  id: z.string().min(1),
  role: z.nativeEnum(AdminRole),
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, role } = parsed.data;

  const existing = await prisma.adminUser.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);

  await prisma.auditLog.create({
    data: {
      adminUserId: (session.user as any).id,
      adminEmail: session.user.email,
      action: "ADMIN_USER_ROLE_UPDATED",
      entityType: "AdminUser",
      entityId: id,
      changes: {
        previous: { role: existing.role },
        next: { role: updated.role },
      },
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ admin: updated });
}

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id } = parsed.data;

  // Option simple : empêcher la suppression de son propre compte
  if ((session.user as any).id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account" },
      { status: 400 },
    );
  }

  const existing = await prisma.adminUser.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const deleted = await prisma.adminUser.delete({
    where: { id },
  });

  const { ipAddress, userAgent } = getClientInfo(request);

  await prisma.auditLog.create({
    data: {
      adminUserId: (session.user as any).id,
      adminEmail: session.user.email,
      action: "ADMIN_USER_DELETED",
      entityType: "AdminUser",
      entityId: id,
      changes: {
        email: deleted.email,
        role: deleted.role,
      },
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ success: true });
}
