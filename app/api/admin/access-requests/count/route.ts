/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/access-requests/count
 * Get count of access requests (for notification badge)
 */
export async function GET(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only SUPER_ADMIN and ADMIN can view
    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    const count = await prisma.accessRequest.count({ where });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting access requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
