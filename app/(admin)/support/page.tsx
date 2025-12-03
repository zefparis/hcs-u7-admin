/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import type { TenantStatus, Plan } from "@prisma/client";
import { AdminRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

interface SupportPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const STATUS_OPTIONS: TenantStatus[] = [
  "TRIAL",
  "ACTIVE",
  "SUSPENDED",
  "CANCELLED",
  "CHURNED",
];

const PLAN_OPTIONS: Plan[] = [
  "FREE",
  "STARTER",
  "PRO",
  "BUSINESS",
  "ENTERPRISE",
];

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

export default async function SupportPage({ searchParams }: SupportPageProps) {
  await requireRole([
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT,
  ]);

  const params = await searchParams;
  const statusParam = getParam(params?.status);
  const planParam = getParam(params?.plan);
  const qParam = getParam(params?.q);

  const where: any = {};

  if (statusParam) {
    where.status = statusParam as TenantStatus;
  }

  if (planParam) {
    where.plan = planParam as Plan;
  }

  if (qParam?.trim()) {
    const q = qParam.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } },
      { company: { contains: q, mode: "insensitive" as const } },
    ];
  }

  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      plan: true,
      status: true,
      monthlyQuota: true,
      currentUsage: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      createdAt: true,
      billingEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          stripePaid: true,
          createdAt: true,
        },
      },
      usageLogs: {
        where: { statusCode: { gte: 400 } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          endpoint: true,
          statusCode: true,
          errorMessage: true,
          createdAt: true,
        },
      },
    },
  });

  const totalTenants = tenants.length;
  const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
  const trialCount = tenants.filter((t) => t.status === "TRIAL").length;
  const suspendedCount = tenants.filter((t) => t.status === "SUSPENDED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support multi-tenant</h1>
        <p className="text-slate-600">
          Vue consolidée des clients HCS-U7 pour le support (statut, plan, usage,
          billing et erreurs récentes).
        </p>
      </div>

      {/* Filtres */}
      <form method="get" className="grid gap-3 md:grid-cols-4 text-sm">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Rechercher
          </label>
          <input
            type="text"
            name="q"
            defaultValue={qParam ?? ""}
            placeholder="Nom, email, entreprise..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Statut
          </label>
          <select
            name="status"
            defaultValue={statusParam ?? ""}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="">Tous</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Plan
          </label>
          <select
            name="plan"
            defaultValue={planParam ?? ""}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="">Tous</option>
            {PLAN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 flex items-end justify-end gap-2">
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Filtrer
          </button>
        </div>
      </form>

      {/* Résumé */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Clients (filtrés)
          </div>
          <div className="mt-2 text-2xl font-bold">{totalTenants}</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Actifs
          </div>
          <div className="mt-2 text-2xl font-bold">{activeCount}</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            En essai
          </div>
          <div className="mt-2 text-2xl font-bold">{trialCount}</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Suspendus
          </div>
          <div className="mt-2 text-2xl font-bold">{suspendedCount}</div>
        </div>
      </div>

      {/* Tableau des clients */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Statut / Plan</th>
              <th className="px-3 py-2">Usage</th>
              <th className="px-3 py-2">Essai / Abonnement</th>
              <th className="px-3 py-2">Dernier billing</th>
              <th className="px-3 py-2">Dernière erreur</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-xs text-slate-500"
                >
                  Aucun client ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => {
                const lastBilling = tenant.billingEvents[0];
                const lastError = tenant.usageLogs[0];
                const usagePercent = Math.min(
                  100,
                  (tenant.currentUsage / tenant.monthlyQuota) * 100 || 0,
                ).toFixed(1);

                return (
                  <tr key={tenant.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <div className="font-medium">
                        <a
                          href={`/clients/${tenant.id}`}
                          className="text-slate-800 hover:underline"
                        >
                          {tenant.fullName}
                        </a>
                      </div>
                      <div className="text-[10px] text-slate-400">{tenant.email}</div>
                      {tenant.company && (
                        <div className="text-[10px] text-slate-400">
                          {tenant.company}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <div className="mb-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {formatStatus(tenant.status as TenantStatus)}
                      </div>
                      <div className="text-[10px] text-slate-500">Plan {tenant.plan}</div>
                    </td>

                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <div>
                        {tenant.currentUsage} / {tenant.monthlyQuota}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {usagePercent}% du quota
                      </div>
                      <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <div className="text-[10px] text-slate-500">
                        Créé le {" "}
                        {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Essai : {tenant.trialEndsAt
                          ? new Date(tenant.trialEndsAt).toLocaleDateString("fr-FR")
                          : "-"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Abonnement : {tenant.subscriptionEndsAt
                          ? new Date(tenant.subscriptionEndsAt).toLocaleDateString("fr-FR")
                          : "-"}
                      </div>
                    </td>

                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {lastBilling ? (
                        <div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(lastBilling.createdAt).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-[10px] text-slate-700">
                            {lastBilling.type}
                          </div>
                          <div className="text-[10px] text-slate-700">
                            {lastBilling.amount.toFixed(2)} {lastBilling.currency}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {lastBilling.stripePaid ? "Payé" : "Non payé"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">-</div>
                      )}
                    </td>

                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {lastError ? (
                        <div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(lastError.createdAt).toLocaleString("fr-FR")}
                          </div>
                          <div className="text-[10px] text-slate-700">
                            {lastError.statusCode} - {lastError.endpoint}
                          </div>
                          <div className="text-[10px] text-slate-500 max-w-xs whitespace-pre-wrap wrap-break-word">
                            {lastError.errorMessage ?? "Erreur sans message"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">Aucune erreur récente</div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
