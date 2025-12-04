/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

/**
 * GET /api/admin/access-requests
 * List access requests with filtering and pagination
 */
export async function GET(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC: Only SUPER_ADMIN and ADMIN can view access requests
    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const status = searchParams.get("status");
    const useCase = searchParams.get("useCase");
    const search = searchParams.get("search")?.trim();

    // Build where clause
    const where: any = {};

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    if (useCase && ["banking", "ecommerce", "api", "other"].includes(useCase)) {
      where.useCase = useCase;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch data
    const [requests, total] = await Promise.all([
      prisma.accessRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.accessRequest.count({ where }),
    ]);

    // Get stats
    const [pendingCount, approvedToday, totalAll] = await Promise.all([
      prisma.accessRequest.count({ where: { status: "PENDING" } }),
      prisma.accessRequest.count({
        where: {
          status: "APPROVED",
          approvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.accessRequest.count(),
    ]);

    const approvedTotal = await prisma.accessRequest.count({
      where: { status: "APPROVED" },
    });

    const stats = {
      pending: pendingCount,
      approvedToday,
      total: totalAll,
      conversionRate: totalAll > 0 ? Math.round((approvedTotal / totalAll) * 100) : 0,
    };

    return NextResponse.json({
      requests,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching access requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
