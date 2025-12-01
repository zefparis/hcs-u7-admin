/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const now = new Date();
  const since90 = new Date(now.getTime());
  since90.setDate(since90.getDate() - 90);

  const [events, totals] = await Promise.all([
    prisma.billingEvent.findMany({
      where: {
        createdAt: {
          gte: since90,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
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
      where: {
        createdAt: {
          gte: since90,
        },
      },
    }),
  ]);

  const totalRevenue = totals.reduce((s, e) => s + (e._sum.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-slate-600">
          Vue d'ensemble des événements de facturation sur les 90 derniers jours.
        </p>
      </div>

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
          <div className="mt-2 text-2xl font-bold">{events.length}</div>
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
    </div>
  );
}
