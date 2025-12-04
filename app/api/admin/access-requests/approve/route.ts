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
import { generateSecurePassword } from "@/lib/utils/password";
import { sendWelcomeEmail } from "@/lib/email/welcome";

const approveSchema = z.object({
  requestId: z.string().min(1),
  plan: z.enum(["STARTER", "PRO", "BUSINESS", "ENTERPRISE"]),
  monthlyQuota: z.number().int().positive(),
  trialDays: z.number().int().min(0).max(90).default(14),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/access-requests/approve
 * Approve an access request and create tenant
 */
export async function POST(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only SUPER_ADMIN and ADMIN can approve
    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = approveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { requestId, plan, monthlyQuota, trialDays, notes } = parsed.data;

    // Get access request
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: "Access request not found" },
        { status: 404 }
      );
    }

    if (accessRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Access request already processed" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { email: accessRequest.email },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "A tenant with this email already exists" },
        { status: 409 }
      );
    }

    // Generate temporary password
    const tempPassword = generateSecurePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Hash HCS code if provided
    const hcsCodeHash = accessRequest.hcsCode
      ? await bcrypt.hash(accessRequest.hcsCode, 10)
      : null;

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // Create tenant and update access request in transaction
    const [tenant] = await prisma.$transaction([
      // Create tenant
      prisma.tenant.create({
        data: {
          email: accessRequest.email,
          fullName: accessRequest.fullName,
          company: accessRequest.company,
          passwordHash,
          hcsCodeHash,
          mustChangePassword: true,
          plan: plan as any,
          status: "TRIAL",
          monthlyQuota,
          currentUsage: 0,
          trialEndsAt,
          metadata: {
            useCase: accessRequest.useCase,
            estimatedVolume: accessRequest.estimatedVolume,
            source: "access_request",
            accessRequestId: accessRequest.id,
          },
        },
      }),
      // Update access request
      prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: (session.user as any).id,
          adminNotes: notes,
        },
      }),
      // Create audit log
      prisma.auditLog.create({
        data: {
          adminUserId: (session.user as any).id,
          adminEmail: session.user.email!,
          action: "ACCESS_REQUEST_APPROVED",
          entityType: "AccessRequest",
          entityId: requestId,
          changes: {
            plan,
            monthlyQuota,
            trialDays,
            tenantEmail: accessRequest.email,
          },
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      }),
    ]);

    // Send welcome email (don't fail if email fails)
    try {
      await sendWelcomeEmail({
        to: tenant.email,
        fullName: tenant.fullName,
        company: tenant.company,
        dashboardUrl: "https://hcs-u7.online",
        login: tenant.email,
        password: tempPassword,
        hasHcsCode: !!hcsCodeHash,
        trialDays,
        plan,
        monthlyQuota,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Continue anyway - tenant is created
    }

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      email: tenant.email,
      message: "Tenant created and welcome email sent",
    });
  } catch (error) {
    console.error("Error approving access request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
