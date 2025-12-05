/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSecurePassword } from "@/lib/utils/password";
import { sendWelcomeEmail } from "@/lib/email/welcome";

/**
 * POST /api/admin/tenants/[id]/resend-credentials
 * Regenerate password and resend credentials email to tenant
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only SUPER_ADMIN and ADMIN can resend credentials
    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Generate new password
    const newPassword = generateSecurePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update tenant with new password
    await prisma.tenant.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminUserId: (session.user as any).id,
        adminEmail: session.user.email!,
        action: "TENANT_CREDENTIALS_RESET",
        entityType: "Tenant",
        entityId: id,
        changes: {
          tenantEmail: tenant.email,
          resetBy: session.user.email,
        },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    // Send email with new credentials
    try {
      await sendWelcomeEmail({
        to: tenant.email,
        fullName: tenant.fullName,
        company: tenant.company,
        dashboardUrl: "https://hcs-u7.online",
        login: tenant.email,
        password: newPassword,
        hasHcsCode: !!tenant.hcsCodeHash,
        trialDays: tenant.trialEndsAt 
          ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0,
        plan: tenant.plan,
        monthlyQuota: tenant.monthlyQuota,
      });

      return NextResponse.json({
        success: true,
        message: `New credentials sent to ${tenant.email}`,
      });
    } catch (emailError) {
      console.error("Failed to send credentials email:", emailError);
      return NextResponse.json(
        { 
          error: "Password reset but email failed to send",
          newPassword, // Return password so admin can share it manually
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error resending credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
