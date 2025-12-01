/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { prisma } from "@/lib/prisma";
import { ApiKeyGenerator } from "@/components/api-keys/ApiKeyGenerator";
import { ApiKeyToggleButton } from "@/components/api-keys/ApiKeyToggleButton";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const [apiKeys, tenants] = await Promise.all([
    prisma.apiKey.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-slate-600">
          Gestion centralisée des clés API HCS-U7 pour tous les clients.
        </p>
      </div>

      <ApiKeyGenerator tenants={tenants} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Clés API existantes
          </h2>
          <div className="text-xs text-slate-500">Total : {apiKeys.length}</div>
        </div>

        {apiKeys.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucune clé API n'a encore été générée.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Clé</th>
                  <th className="px-3 py-2">Environnement</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Dernier usage</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-slate-900">
                        {key.tenant.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {key.tenant.email}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-[11px] text-slate-700">
                      {key.keyPrefix}_***{key.lastFourChars}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                      {key.environment === "PRODUCTION"
                        ? "Production"
                        : key.environment === "STAGING"
                        ? "Staging"
                        : "Développement"}
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
                    <td className="px-3 py-2 align-top text-right">
                      <ApiKeyToggleButton id={key.id} isActive={key.isActive} />
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
