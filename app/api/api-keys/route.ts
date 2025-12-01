/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import type { Environment } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

function getClientInfo(request: Request) {
  const ipAddress =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  return { ipAddress, userAgent };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || !isAdmin((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tenantId, name, environment } = body ?? {};

  if (!tenantId || !environment) {
    return NextResponse.json(
      { error: "tenantId and environment are required" },
      { status: 400 }
    );
  }

  const envValue = String(environment).toUpperCase() as Environment;
  if (!["PRODUCTION", "STAGING", "DEVELOPMENT"].includes(envValue)) {
    return NextResponse.json(
      { error: "Invalid environment" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { ipAddress, userAgent } = getClientInfo(request);

  const rawSecret = randomBytes(32).toString("hex");
  const prefix = envValue === "PRODUCTION" ? "hcs_sk_live" : "hcs_sk_test";
  const plaintextKey = `${prefix}_${rawSecret}`;
  const lastFourChars = plaintextKey.slice(-4);
  const keyHash = await bcrypt.hash(plaintextKey, 12);

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      keyHash,
      keyPrefix: prefix,
      lastFourChars,
      name,
      environment: envValue,
      isActive: true,
      scopes: ["verify", "generate"],
    },
    select: {
      id: true,
      name: true,
      environment: true,
      isActive: true,
      tenantId: true,
      keyPrefix: true,
      lastFourChars: true,
      createdAt: true,
    },
  });

  // AuditLog - création de clé API
  await prisma.auditLog.create({
    data: {
      adminUserId: (session.user as any).id,
      adminEmail: session.user.email,
      action: "API_KEY_GENERATED",
      entityType: "ApiKey",
      entityId: apiKey.id,
      changes: {
        tenantId,
        environment: envValue,
        keyPrefix: apiKey.keyPrefix,
        lastFourChars: apiKey.lastFourChars,
      },
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ apiKey, plaintextKey });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user || !isAdmin((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, isActive } = body ?? {};

  if (!id || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "id and isActive are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.apiKey.findUnique({
    where: { id },
    select: {
      isActive: true,
      tenantId: true,
      keyPrefix: true,
      lastFourChars: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const { ipAddress, userAgent } = getClientInfo(request);

  const apiKey = await prisma.apiKey.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      name: true,
      environment: true,
      isActive: true,
      tenantId: true,
      keyPrefix: true,
      lastFourChars: true,
      createdAt: true,
    },
  });

  const action = isActive ? "API_KEY_REACTIVATED" : "API_KEY_REVOKED";

  await prisma.auditLog.create({
    data: {
      adminUserId: (session.user as any).id,
      adminEmail: session.user.email,
      action,
      entityType: "ApiKey",
      entityId: id,
      changes: {
        tenantId: existing.tenantId,
        previous: { isActive: existing.isActive },
        next: { isActive },
      },
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ apiKey });
}
