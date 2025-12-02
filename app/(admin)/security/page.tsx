/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { AdminRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { SecurityCredentialsForm } from "@/components/admin/SecurityCredentialsForm";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  await requireRole([
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.SUPPORT,
  ]);

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalRequests24h,
    blocked24h,
    errors5xx24h,
    topIpsRaw,
    topEndpointsRaw,
    recentSuspicious,
  ] = await Promise.all([
    prisma.usageLog.count({
      where: { createdAt: { gte: since24h } },
    }),
    prisma.usageLog.count({
      where: {
        createdAt: { gte: since24h },
        statusCode: { in: [401, 403, 429] },
      },
    }),
    prisma.usageLog.count({
      where: {
        createdAt: { gte: since24h },
        statusCode: { gte: 500 },
      },
    }),
    prisma.usageLog.groupBy({
      by: ["ipAddress"],
      _count: { _all: true },
      where: {
        createdAt: { gte: since24h },
        statusCode: { gte: 400 },
        ipAddress: { not: null },
      },
    }),
    prisma.usageLog.groupBy({
      by: ["endpoint"],
      _count: { _all: true },
      where: {
        createdAt: { gte: since24h },
        statusCode: { gte: 400 },
      },
    }),
    prisma.usageLog.findMany({
      where: {
        createdAt: { gte: since24h },
        statusCode: { gte: 400 },
      },
      include: {
        tenant: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const topIps = topIpsRaw
    .map((row) => ({
      ipAddress: row.ipAddress,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count: ((row._count as any)._all as number) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topEndpoints = topEndpointsRaw
    .map((row) => ({
      endpoint: row.endpoint,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count: ((row._count as any)._all as number) ?? 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security &amp; Monitoring</h1>
        <p className="text-slate-600">
          Vue temps réel des appels suspects, erreurs et bloqueurs sur l'API HCS-U7.
        </p>
      </div>

      <SecurityCredentialsForm />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Requêtes (24h)
          </div>
          <div className="mt-2 text-2xl font-bold">{totalRequests24h}</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bloqués / Refusés (401/403/429)
          </div>
          <div className="mt-2 text-2xl font-bold">{blocked24h}</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Erreurs serveur (5xx)
          </div>
          <div className="mt-2 text-2xl font-bold">{errors5xx24h}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Top IP suspectes (24h)
          </h2>

          {topIps.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune IP suspecte détectée.</p>
          ) : (
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">IP</th>
                  <th className="px-3 py-2">Requêtes en erreur</th>
                </tr>
              </thead>
              <tbody>
                {topIps.map((row) => (
                  <tr key={row.ipAddress ?? "unknown"} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-[11px] text-slate-700">
                      {row.ipAddress ?? "inconnue"}
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

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Endpoints les plus bruités (4xx/5xx)
          </h2>

          {topEndpoints.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune erreur récente sur les endpoints.</p>
          ) : (
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Endpoint</th>
                  <th className="px-3 py-2">Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {topEndpoints.map((row) => (
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
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Derniers événements suspects (50 derniers)
          </h2>
        </div>

        {recentSuspicious.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun appel en erreur ou bloqué sur les dernières 24 heures.
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
                  <th className="px-3 py-2">IP</th>
                  <th className="px-3 py-2">Erreur</th>
                </tr>
              </thead>
              <tbody>
                {recentSuspicious.map((log) => (
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
                      <div>{log.ipAddress ?? "-"}</div>
                      <div className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                        {log.userAgent ?? "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <div className="max-w-xs whitespace-pre-wrap wrap-break-word">
                        {log.errorMessage ?? "-"}
                      </div>
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
