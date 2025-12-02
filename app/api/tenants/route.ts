/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminRole, Plan, TenantStatus } from "@prisma/client";

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

function canEditTenant(role: string | undefined | null): boolean {
  return role === AdminRole.SUPER_ADMIN || role === AdminRole.ADMIN;
}

const updateTenantSchema = z.object({
  id: z.string().min(1),
  plan: z.nativeEnum(Plan).optional(),
  status: z.nativeEnum(TenantStatus).optional(),
  monthlyQuota: z.number().int().positive().optional(),
  internalNotes: z.string().nullable().optional(),
  trialEndsAt: z.string().nullable().optional(),
  subscriptionEndsAt: z.string().nullable().optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user || !canEditTenant((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const {
    id,
    plan,
    status,
    monthlyQuota,
    internalNotes,
    trialEndsAt,
    subscriptionEndsAt,
  } = parsed.data;

  const existing = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const data: any = {};

  if (plan && plan !== existing.plan) {
    data.plan = plan;
  }

  if (status && status !== existing.status) {
    data.status = status;
  }

  if (typeof monthlyQuota === "number" && monthlyQuota !== existing.monthlyQuota) {
    data.monthlyQuota = monthlyQuota;
  }

  if (typeof internalNotes !== "undefined") {
    data.internalNotes = internalNotes;
  }

  if (typeof trialEndsAt !== "undefined") {
    if (trialEndsAt === null || trialEndsAt === "") {
      data.trialEndsAt = null;
    } else {
      const d = new Date(trialEndsAt);
      if (!Number.isNaN(d.getTime())) {
        data.trialEndsAt = d;
      }
    }
  }

  if (typeof subscriptionEndsAt !== "undefined") {
    if (subscriptionEndsAt === null || subscriptionEndsAt === "") {
      data.subscriptionEndsAt = null;
    } else {
      const d = new Date(subscriptionEndsAt);
      if (!Number.isNaN(d.getTime())) {
        data.subscriptionEndsAt = d;
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ tenant: existing });
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data,
  });

  const changes: any = {};

  if (data.plan) {
    changes.plan = { previous: existing.plan, next: updated.plan };
  }
  if (data.status) {
    changes.status = { previous: existing.status, next: updated.status };
  }
  if (typeof data.monthlyQuota !== "undefined") {
    changes.monthlyQuota = {
      previous: existing.monthlyQuota,
      next: updated.monthlyQuota,
    };
  }
  if (typeof data.internalNotes !== "undefined") {
    changes.internalNotes = {
      previous: existing.internalNotes,
      next: updated.internalNotes,
    };
  }
  if (typeof data.trialEndsAt !== "undefined") {
    changes.trialEndsAt = {
      previous: existing.trialEndsAt,
      next: updated.trialEndsAt,
    };
  }
  if (typeof data.subscriptionEndsAt !== "undefined") {
    changes.subscriptionEndsAt = {
      previous: existing.subscriptionEndsAt,
      next: updated.subscriptionEndsAt,
    };
  }

  const { ipAddress, userAgent } = getClientInfo(request);

  await prisma.auditLog.create({
    data: {
      adminUserId: (session.user as any).id,
      adminEmail: session.user.email,
      action: "TENANT_UPDATED",
      entityType: "Tenant",
      entityId: id,
      changes,
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ tenant: updated });
}
