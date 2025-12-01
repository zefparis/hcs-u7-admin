/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import type { TenantStatus } from "@prisma/client";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface ClientsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
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

function statusClass(status: TenantStatus): string {
  switch (status) {
    case "TRIAL":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "SUSPENDED":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "CANCELLED":
    case "CHURNED":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const pageParam = getParam(searchParams?.page);
  const qParam = getParam(searchParams?.q);

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const query = qParam?.trim() ?? "";

  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { fullName: { contains: query, mode: "insensitive" as const } },
          { company: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [clients, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tenant.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-slate-600">
            Gestion des tenants HCS-U7 (plans, quotas, usage API, statut).
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <div>Total clients : {total}</div>
        </div>
      </div>

      {/* Barre de recherche */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Rechercher par email, nom, entreprise..."
          className="h-9 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Filtrer
        </button>
      </form>

      {/* Tableau des clients */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Plan & statut</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Aucun client trouvé.
                </td>
              </tr>
            )}

            {clients.map((tenant) => (
              <tr
                key={tenant.id}
                className="border-t border-slate-100 hover:bg-slate-50/80"
              >
                <td className="px-4 py-3 align-top">
                  <Link href={`/clients/${tenant.id}`} className="block">
                    <div className="font-medium text-slate-900">
                      {tenant.fullName}
                    </div>
                    <div className="text-xs text-slate-500">{tenant.email}</div>
                    {tenant.company && (
                      <div className="text-xs text-slate-500">
                        {tenant.company}
                      </div>
                    )}
                  </Link>
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                    Plan {tenant.plan}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass(
                      tenant.status as TenantStatus
                    )}`}
                  >
                    {formatStatus(tenant.status as TenantStatus)}
                  </span>
                </td>

                <td className="px-4 py-3 align-top text-sm text-slate-700">
                  <div>
                    {tenant.currentUsage} / {tenant.monthlyQuota} requêtes
                  </div>
                  <div className="mt-1 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (tenant.currentUsage / tenant.monthlyQuota) * 100 || 0
                        ).toFixed(1)}%`,
                      }}
                    />
                  </div>
                </td>

                <td className="px-4 py-3 align-top text-xs text-slate-500">
                  {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination simple */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Page {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              (() => {
                const params = new URLSearchParams();
                if (query) params.set("q", query);
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
                if (query) params.set("q", query);
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
