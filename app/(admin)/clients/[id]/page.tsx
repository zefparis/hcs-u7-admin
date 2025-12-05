/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { notFound } from "next/navigation";
import { AdminRole, type TenantStatus, type Environment, type BillingEventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { TenantEditForm } from "@/components/admin/TenantEditForm";
import { ResendCredentialsButton } from "@/components/admin/ResendCredentialsButton";

export const dynamic = "force-dynamic";

interface ClientDetailPageProps {
  params: { id: string };
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

function formatEnv(env: Environment): string {
  switch (env) {
    case "PRODUCTION":
      return "Production";
    case "STAGING":
      return "Staging";
    case "DEVELOPMENT":
      return "Développement";
    default:
      return env;
  }
}

function formatBillingType(type: BillingEventType): string {
  switch (type) {
    case "SUBSCRIPTION_CREATED":
      return "Création d'abonnement";
    case "SUBSCRIPTION_RENEWED":
      return "Renouvellement";
    case "OVERAGE_CHARGE":
      return "Dépassement";
    case "PLAN_UPGRADED":
      return "Upgrade";
    case "PLAN_DOWNGRADED":
      return "Downgrade";
    case "REFUND":
      return "Remboursement";
    case "PAYMENT_FAILED":
      return "Paiement échoué";
    case "TRIAL_STARTED":
      return "Début essai";
    case "TRIAL_ENDED":
      return "Fin d'essai";
    default:
      return type;
  }
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await requireRole([
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.SUPPORT,
  ]);

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      apiKeys: { orderBy: { createdAt: "desc" } },
      billingEvents: { orderBy: { createdAt: "desc" }, take: 10 },
      usageLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!tenant) {
    notFound();
  }

  const usagePercent = Math.min(
    100,
    (tenant.currentUsage / tenant.monthlyQuota) * 100 || 0
  ).toFixed(1);

  const canEditTenant =
    (session.user as any).role === AdminRole.SUPER_ADMIN ||
    (session.user as any).role === AdminRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Client</h1>
          <p className="text-slate-600">
            Détail du tenant HCS-U7, usage et événements de facturation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <a
            href={`/usage?tenantId=${tenant.id}`}
            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Voir l'usage
          </a>
          <a
            href={`/billing?tenantId=${tenant.id}`}
            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Voir la facturation
          </a>
          <a
            href="/audit?entityType=Tenant"
            className="inline-flex h-8 items-center rounded-md border border-slate-100 bg-slate-50 px-3 font-medium text-slate-600 hover:bg-slate-100"
          >
            Logs d'audit (Tenant)
          </a>
          <ResendCredentialsButton
            tenantId={tenant.id}
            tenantEmail={tenant.email}
            tenantName={tenant.fullName}
          />
        </div>
      </div>

      {/* Info principale */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Identité */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Identité
          </h2>
          <div className="space-y-1">
            <div className="font-medium text-slate-900">{tenant.fullName}</div>
            <div className="text-xs text-slate-500">{tenant.email}</div>
            {tenant.company && (
              <div className="text-xs text-slate-500">{tenant.company}</div>
            )}
            {tenant.website && (
              <a
                href={tenant.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                {tenant.website}
              </a>
            )}
          </div>
          <div className="mt-4 text-xs text-slate-500">
            <div>
              Créé le {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}
            </div>
            {tenant.trialEndsAt && (
              <div>
                Essai jusqu'au {""}
                {new Date(tenant.trialEndsAt).toLocaleDateString("fr-FR")}
              </div>
            )}
            {tenant.subscriptionStartedAt && (
              <div>
                Abonnement depuis le {""}
                {new Date(tenant.subscriptionStartedAt).toLocaleDateString("fr-FR")}
              </div>
            )}
          </div>
        </div>

        {/* Plan & quotas */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Plan & quotas
          </h2>
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Plan {tenant.plan}
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass(
                tenant.status as TenantStatus
              )}`}
            >
              {formatStatus(tenant.status as TenantStatus)}
            </span>
            <div className="mt-3 space-y-1">
              <div>
                {tenant.currentUsage} / {tenant.monthlyQuota} requêtes
              </div>
              <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">{usagePercent}% utilisé</div>
            </div>
          </div>
        </div>

        {/* Notes internes */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Notes internes
          </h2>
          <div className="text-xs text-slate-600 whitespace-pre-wrap">
            {tenant.internalNotes || "Aucune note interne pour l'instant."}
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Clés API
          </h2>
          <div className="text-xs text-slate-500">
            Total : {tenant.apiKeys.length}
          </div>
        </div>

        {tenant.apiKeys.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucune clé API générée pour ce client.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Nom</th>
                  <th className="px-3 py-2">Clé</th>
                  <th className="px-3 py-2">Environnement</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Dernier usage</th>
                </tr>
              </thead>
              <tbody>
                {tenant.apiKeys.map((key) => (
                  <tr key={key.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-slate-900">
                        {key.name || "Clé API"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Créée le {""}
                        {new Date(key.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-[11px] text-slate-700">
                      {key.keyPrefix}_***{key.lastFourChars}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                      {formatEnv(key.environment as Environment)}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px]">
                      {key.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          Révoquée
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleString("fr-FR")
                        : "Jamais"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Billing events */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Facturation (10 derniers événements)
          </h2>
        </div>

        {tenant.billingEvents.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun événement de facturation enregistré.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Montant</th>
                  <th className="px-3 py-2">Période</th>
                  <th className="px-3 py-2">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {tenant.billingEvents.map((event) => (
                  <tr key={event.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {formatBillingType(event.type as BillingEventType)}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {event.amount.toFixed(2)} {event.currency}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                      {new Date(event.periodStart).toLocaleDateString("fr-FR")} {"→"}{" "}
                      {new Date(event.periodEnd).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                      {new Date(event.createdAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Derniers appels API */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Derniers appels API (20 derniers)
          </h2>
        </div>

        {tenant.usageLogs.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun appel API enregistré pour ce client.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Endpoint</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Temps (ms)</th>
                </tr>
              </thead>
              <tbody>
                {tenant.usageLogs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString("fr-FR")}
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

      {canEditTenant && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Paramètres du compte
          </h2>
          <TenantEditForm
            id={tenant.id}
            plan={tenant.plan as any}
            status={tenant.status as any}
            monthlyQuota={tenant.monthlyQuota}
            internalNotes={tenant.internalNotes}
            trialEndsAt={tenant.trialEndsAt ? tenant.trialEndsAt.toISOString() : null}
            subscriptionStartedAt={
              tenant.subscriptionStartedAt
                ? tenant.subscriptionStartedAt.toISOString()
                : null
            }
          />
        </div>
      )}
    </div>
  );
}
