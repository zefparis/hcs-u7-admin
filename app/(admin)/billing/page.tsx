/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { AdminRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

interface BillingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  await requireRole([
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.VIEWER,
  ]);

  const now = new Date();
  const since90 = new Date(now.getTime());
  since90.setDate(since90.getDate() - 90);

  const params = await searchParams;
  const tenantParam = getParam(params?.tenantId);
  const typeParam = getParam(params?.type);
  const paidParam = getParam(params?.paid);
  const fromParam = getParam(params?.from);
  const toParam = getParam(params?.to);
  const pageParam = getParam(params?.page);

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  const where: any = {};

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
  if (!createdAt.gte && !createdAt.lte) {
    createdAt.gte = since90;
  }
  if (createdAt.gte || createdAt.lte) {
    where.createdAt = createdAt;
  }

  if (tenantParam) {
    where.tenantId = tenantParam;
  }

  if (typeParam) {
    where.type = typeParam;
  }

  if (paidParam === "paid") {
    where.stripePaid = true;
  } else if (paidParam === "unpaid") {
    where.stripePaid = false;
  }

  const [events, totals, total, tenants] = await Promise.all([
    prisma.billingEvent.findMany({
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
            plan: true,
          },
        },
      },
    }),
    prisma.billingEvent.groupBy({
      by: ["type"],
      _sum: { amount: true },
      where,
    }),
    prisma.billingEvent.count({ where }),
    prisma.tenant.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    }),
  ]);

  const totalRevenue = totals.reduce((s, e) => s + (e._sum.amount ?? 0), 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-slate-600">
          Vue d'ensemble des événements de facturation sur les 90 derniers jours.
        </p>
      </div>

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
            Filtre les événements pour un client précis. Laisser sur "Tous" pour tous les clients.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Type d'événement
          </label>
          <select
            name="type"
            defaultValue={typeParam ?? ""}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="">Tous</option>
            {totals.map((t) => (
              <option key={t.type} value={t.type}>
                {t.type}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500">
            Filtre par type d'événement de facturation (subscription, overage, etc.).
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Paiement
          </label>
          <select
            name="paid"
            defaultValue={paidParam ?? ""}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="">Tous</option>
            <option value="paid">Payés</option>
            <option value="unpaid">Non payés</option>
          </select>
          <p className="text-[10px] text-slate-500">
            Filtre par statut de paiement Stripe (payé / non payé).
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
            Date de début (incluse). Si vide, la période commence 90 jours avant aujourd'hui.
          </p>
        </div>

        <div className="spacey-1">
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
            Date de fin (incluse). Laisser vide pour utiliser la date du jour.
          </p>
        </div>

        <div className="md:col-span-5 flex items-end justify-between gap-2">
          <p className="text-[10px] text-slate-500">
            Par défaut, la période affichée couvre les 90 derniers jours.
          </p>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Filtrer
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Revenu total (90j)
          </div>
          <div className="mt-2 text-2xl font-bold">
            {totalRevenue.toFixed(2)}
            <span className="ml-1 text-sm font-normal text-slate-500">EUR</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Événements de facturation
          </div>
          <div className="mt-2 text-2xl font-bold">{total}</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Types d'événements
          </div>
          <div className="mt-2 text-2xl font-bold">{totals.length}</div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Détail des événements (200 derniers)
        </h2>

        {events.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun événement de facturation enregistré sur les 90 derniers jours.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Montant</th>
                  <th className="px-3 py-2">Période</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                      {new Date(event.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <div>{event.tenant.fullName}</div>
                      <div className="text-[10px] text-slate-400">
                        {event.tenant.email}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Plan {event.tenant.plan}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {event.type}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {event.amount.toFixed(2)} {event.currency}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                      {new Date(event.periodStart).toLocaleDateString("fr-FR")} {"→"}{" "}
                      {new Date(event.periodEnd).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                if (typeParam) params.set("type", typeParam);
                if (paidParam) params.set("paid", paidParam);
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
                if (typeParam) params.set("type", typeParam);
                if (paidParam) params.set("paid", paidParam);
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
