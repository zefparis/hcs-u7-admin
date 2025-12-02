/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import type { TenantStatus } from "@prisma/client";
import { AdminRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface UsagePageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatStatus(status: TenantStatus): string {
  switch (status) {
    case "TRIAL":
      return "Essai";
    case "ACTIVE":
      return "Actif";
    case "SUSPENDED":
      return "Suspendu";
    case "CANCELLED":
      return "Annulé";
    case "CHURNED":
      return "Perdu";
    default:
      return status;
  }
}

export default async function UsagePage({ searchParams }: UsagePageProps) {
  await requireRole([
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.SUPPORT,
  ]);

  const pageParam = getParam(searchParams?.page);
  const tenantParam = getParam(searchParams?.tenantId);
  const endpointParam = getParam(searchParams?.endpoint);
  const statusParam = getParam(searchParams?.statusCode);
  const fromParam = getParam(searchParams?.from);
  const toParam = getParam(searchParams?.to);

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  const where: any = {};

  if (tenantParam) {
    where.tenantId = tenantParam;
  }

  if (endpointParam?.trim()) {
    where.endpoint = {
      contains: endpointParam.trim(),
      mode: "insensitive" as const,
    };
  }

  if (statusParam) {
    const statusCode = parseInt(statusParam, 10);
    if (!Number.isNaN(statusCode)) {
      where.statusCode = statusCode;
    }
  }

  if (fromParam || toParam) {
    const createdAt: { gte?: Date; lte?: Date } = {};
    if (fromParam) {
      const fromDate = new Date(fromParam);
      if (!Number.isNaN(fromDate.getTime())) {
        createdAt.gte = fromDate;
      }
    }
    if (toParam) {
      const toDate = new Date(toParam);
      if (!Number.isNaN(toDate.getTime())) {
        createdAt.lte = toDate;
      }
    }
    if (createdAt.gte || createdAt.lte) {
      where.createdAt = createdAt;
    }
  }

  const [logs, total, tenants] = await Promise.all([
    prisma.usageLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
          },
        },
      },
    }),
    prisma.usageLog.count({ where }),
    prisma.tenant.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usage API</h1>
        <p className="text-slate-600">
          Liste détaillée des appels API HCS-U7 avec filtres par client, endpoint,
          code HTTP et période.
        </p>
      </div>

      {/* Filtres */}
      <form method="get" className="grid gap-3 md:grid-cols-5 text-sm">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Client
          </label>
          <select
            name="tenantId"
            defaultValue={tenantParam ?? ""}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="">Tous</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.email})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500">
            Laisser sur "Tous" pour voir les appels de l'ensemble des clients.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Endpoint
          </label>
          <input
            type="text"
            name="endpoint"
            defaultValue={endpointParam ?? ""}
            placeholder="/v1/verify, /v1/generate..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          />
          <p className="text-[10px] text-slate-500">
            Filtre par sous-chaîne de chemin API (recherche insensible à la casse).
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Status HTTP
          </label>
          <input
            type="number"
            name="statusCode"
            defaultValue={statusParam ?? ""}
            placeholder="200, 401, 429..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          />
          <p className="text-[10px] text-slate-500">
            Filtre par code HTTP exact (laisser vide pour tous les codes).
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Du
          </label>
          <input
            type="date"
            name="from"
            defaultValue={fromParam ?? ""}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          />
          <p className="text-[10px] text-slate-500">
            Date de début (incluse). Laisser vide pour ne pas limiter.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Au
          </label>
          <input
            type="date"
            name="to"
            defaultValue={toParam ?? ""}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          />
          <p className="text-[10px] text-slate-500">
            Date de fin (incluse). Laisser vide pour ne pas limiter.
          </p>
        </div>

        <div className="md:col-span-5 flex items-end justify-end gap-2">
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Filtrer
          </button>
        </div>
      </form>

      {/* Tableau des logs */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Endpoint</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Temps (ms)</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">Erreur</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-xs text-slate-500"
                >
                  Aucun appel ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    <div>
                      <a
                        href={`/clients/${log.tenant.id}`}
                        className="text-slate-800 hover:underline"
                      >
                        {log.tenant.fullName}
                      </a>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {log.tenant.email}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatStatus(log.tenant.status as TenantStatus)}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {log.endpoint} ({log.method})
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {log.statusCode}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {log.responseTime ?? "-"}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {log.ipAddress ?? "-"}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    <div className="max-w-xs whitespace-pre-wrap wrap-break-word">
                      {log.errorMessage ?? "-"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Page {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              (() => {
                const params = new URLSearchParams();
                if (tenantParam) params.set("tenantId", tenantParam);
                if (endpointParam) params.set("endpoint", endpointParam);
                if (statusParam) params.set("statusCode", statusParam);
                if (fromParam) params.set("from", fromParam);
                if (toParam) params.set("to", toParam);
                if (page - 1 > 1) params.set("page", String(page - 1));
                const href = params.toString() ? `?${params.toString()}` : "?";
                return (
                  <a
                    href={href}
                    className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium"
                  >
                    Précédent
                  </a>
                );
              })()
            ) : (
              <span className="inline-flex h-8 items-center rounded-md border border-slate-100 bg-slate-50 px-3 text-xs font-medium text-slate-400">
                Précédent
              </span>
            )}

            {page < totalPages ? (
              (() => {
                const params = new URLSearchParams();
                if (tenantParam) params.set("tenantId", tenantParam);
                if (endpointParam) params.set("endpoint", endpointParam);
                if (statusParam) params.set("statusCode", statusParam);
                if (fromParam) params.set("from", fromParam);
                if (toParam) params.set("to", toParam);
                params.set("page", String(page + 1));
                const href = `?${params.toString()}`;
                return (
                  <a
                    href={href}
                    className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium"
                  >
                    Suivant
                  </a>
                );
              })()
            ) : (
              <span className="inline-flex h-8 items-center rounded-md border border-slate-100 bg-slate-50 px-3 text-xs font-medium text-slate-400">
                Suivant
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
