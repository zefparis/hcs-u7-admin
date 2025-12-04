/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendRejectionEmail } from "@/lib/email/welcome";

const rejectSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().min(1, "Reason is required"),
  sendEmail: z.boolean().default(false),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/access-requests/reject
 * Reject an access request
 */
export async function POST(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only SUPER_ADMIN and ADMIN can reject
    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = rejectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { requestId, reason, sendEmail, notes } = parsed.data;

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

    // Update access request and create audit log in transaction
    await prisma.$transaction([
      prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectedReason: reason,
          adminNotes: notes,
        },
      }),
      prisma.auditLog.create({
        data: {
          adminUserId: (session.user as any).id,
          adminEmail: session.user.email!,
          action: "ACCESS_REQUEST_REJECTED",
          entityType: "AccessRequest",
          entityId: requestId,
          changes: {
            reason,
            email: accessRequest.email,
            company: accessRequest.company,
          },
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      }),
    ]);

    // Send rejection email if requested
    if (sendEmail) {
      try {
        await sendRejectionEmail({
          to: accessRequest.email,
          fullName: accessRequest.fullName,
          company: accessRequest.company,
          reason,
        });
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
        // Continue anyway
      }
    }

    return NextResponse.json({
      success: true,
      message: "Access request rejected",
    });
  } catch (error) {
    console.error("Error rejecting access request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
