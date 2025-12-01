/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { prisma } from "@/lib/prisma";
import type { TenantStatus } from "@prisma/client";

export interface UsageDay {
  date: string; // YYYY-MM-DD
  requests: number;
  billableRequests: number;
  revenue: number;
}

export interface TopTenantUsage {
  id: string;
  fullName: string;
  email: string;
  plan: string;
  status: TenantStatus;
  currentUsage: number;
  monthlyQuota: number;
}

export interface DashboardStats {
  totals: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    totalRequestsLast30Days: number;
    totalRevenueLast30Days: number;
  };
  usageLast7Days: UsageDay[];
  topTenantsByUsage: TopTenantUsage[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();

  const since30 = new Date(now.getTime());
  since30.setDate(since30.getDate() - 30);

  const since7 = new Date(now.getTime());
  since7.setDate(since7.getDate() - 6); // 7 jours incluant aujourd'hui

  const [
    totalTenants,
    activeTenants,
    trialTenants,
    suspendedTenants,
    totalRequestsLast30Days,
    billingEventsLast30Days,
    usageLogsLast7Days,
    topTenants,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "TRIAL" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
    prisma.usageLog.count({
      where: {
        createdAt: {
          gte: since30,
        },
      },
    }),
    prisma.billingEvent.findMany({
      where: {
        createdAt: {
          gte: since30,
        },
      },
      select: {
        amount: true,
      },
    }),
    prisma.usageLog.findMany({
      where: {
        createdAt: {
          gte: since7,
        },
      },
      select: {
        createdAt: true,
        billable: true,
        cost: true,
      },
    }),
    prisma.tenant.findMany({
      orderBy: {
        currentUsage: "desc",
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        email: true,
        plan: true,
        status: true,
        currentUsage: true,
        monthlyQuota: true,
      },
    }),
  ]);

  const totalRevenueLast30Days = billingEventsLast30Days.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  // Prépare les 7 derniers jours (clé YYYY-MM-DD)
  const usageMap: Record<string, UsageDay> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(since7.getTime());
    d.setDate(since7.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    usageMap[key] = {
      date: key,
      requests: 0,
      billableRequests: 0,
      revenue: 0,
    };
  }

  for (const log of usageLogsLast7Days) {
    const key = log.createdAt.toISOString().slice(0, 10);
    const bucket = usageMap[key];
    if (!bucket) continue;
    bucket.requests += 1;
    if (log.billable) {
      bucket.billableRequests += 1;
      bucket.revenue += log.cost ?? 0;
    }
  }

  const usageLast7Days = Object.values(usageMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    totals: {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalRequestsLast30Days,
      totalRevenueLast30Days,
    },
    usageLast7Days,
    topTenantsByUsage: topTenants,
  };
}
