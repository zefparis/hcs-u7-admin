/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import Link from "next/link";
 
import { requireRole } from "@/lib/auth-helpers";
import { AdminRole } from "@prisma/client";

import { getDashboardStats } from "@/lib/dashboard-stats";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { BackendStatus } from "@/components/dashboard/BackendStatus";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireRole([
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.SUPPORT,
    AdminRole.VIEWER,
  ]);

  let stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600">
          Vue d'ensemble de la plateforme HCS-U7 : clients, trafic API et
          facturation récente.
        </p>
      </div>

      {/* Statut Backend */}
      <div className="grid gap-4 md:grid-cols-5">
        <BackendStatus />

        {/* Cartes de stats globales */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Clients totaux
          </div>
          <div className="mt-2 text-2xl font-bold">
            {stats.totals.totalTenants}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {stats.totals.activeTenants} actifs / {stats.totals.trialTenants} en essai
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Requêtes API (30j)
          </div>
          <div className="mt-2 text-2xl font-bold">
            {stats.totals.totalRequestsLast30Days}
          </div>
          <div className="mt-1 text-xs text-slate-500">Toutes routes</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Revenu (30j)
          </div>
          <div className="mt-2 text-2xl font-bold">
            {stats.totals.totalRevenueLast30Days.toFixed(2)}
            <span className="ml-1 text-sm font-normal text-slate-500">EUR</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Événements de facturation
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Clients à risque
          </div>
          <div className="mt-2 text-2xl font-bold">
            {stats.totals.suspendedTenants}
          </div>
          <div className="mt-1 text-xs text-slate-500">En statut suspendu</div>
        </div>
      </div>

      {/* Graphique des 7 derniers jours + top clients */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Trafic API (7 derniers jours)
              </h2>
              <p className="text-xs text-slate-500">
                Requêtes totales et facturables par jour.
              </p>
            </div>
          </div>
          <UsageChart data={stats.usageLast7Days} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Top clients par usage
            </h2>
            <Link
              href="/clients"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Voir tous
            </Link>
          </div>

          {stats.topTenantsByUsage.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucun client enregistré pour le moment.
            </p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700">
              {stats.topTenantsByUsage.map((tenant) => {
                const pct = Math.min(
                  100,
                  (tenant.currentUsage / tenant.monthlyQuota) * 100 || 0
                ).toFixed(1);

                return (
                  <li
                    key={tenant.id}
                    className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          {tenant.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {tenant.email}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-600">
                        <div>
                          {tenant.currentUsage} / {tenant.monthlyQuota}
                        </div>
                        <div>{pct}%</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
