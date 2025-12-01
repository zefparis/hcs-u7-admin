/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const now = new Date();
  const since30 = new Date(now.getTime());
  since30.setDate(since30.getDate() - 30);

  const [byEndpointRaw, byStatusRaw, recentLogs] = await Promise.all([
    prisma.usageLog.groupBy({
      by: ["endpoint"],
      _count: { _all: true },
      where: { createdAt: { gte: since30 } },
    }),
    prisma.usageLog.groupBy({
      by: ["statusCode"],
      _count: { _all: true },
      where: { createdAt: { gte: since30 } },
      orderBy: { statusCode: "asc" },
    }),
    prisma.usageLog.findMany({
      where: { createdAt: { gte: since30 } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const byEndpoint = byEndpointRaw
    .map((row) => ({
      endpoint: row.endpoint,
      count: (row._count as any)._all as number,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byStatus = byStatusRaw.map((row) => ({
    statusCode: row.statusCode,
    count: (row._count as any)._all as number,
  }));

  const totalRequests = byEndpoint.reduce((s, e) => s + e.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-slate-600">
          Analyse fine du trafic API HCS-U7 sur les 30 derniers jours.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Requêtes totales (30j)
          </div>
          <div className="mt-2 text-2xl font-bold">{totalRequests}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Endpoints actifs
          </div>
          <div className="mt-2 text-2xl font-bold">{byEndpoint.length}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Codes HTTP observés
          </div>
          <div className="mt-2 text-2xl font-bold">{byStatus.length}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top endpoints */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Top endpoints (par volume)
          </h2>

          {byEndpoint.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucun trafic enregistré sur les 30 derniers jours.
            </p>
          ) : (
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Endpoint</th>
                  <th className="px-3 py-2">Requêtes</th>
                </tr>
              </thead>
              <tbody>
                {byEndpoint.map((row) => (
                  <tr key={row.endpoint} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {row.endpoint}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Répartition par status */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Répartition par code HTTP
          </h2>

          {byStatus.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucun trafic enregistré sur les 30 derniers jours.
            </p>
          ) : (
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Requêtes</th>
                </tr>
              </thead>
              <tbody>
                {byStatus.map((row) => (
                  <tr key={row.statusCode} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {row.statusCode}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Derniers logs */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Derniers appels API (50 derniers)
          </h2>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun appel enregistré sur les 30 derniers jours.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Endpoint</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Temps (ms)</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <div>{log.tenant.fullName}</div>
                      <div className="text-[10px] text-slate-400">
                        {log.tenant.email}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {log.endpoint}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {log.statusCode}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {log.responseTime ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
