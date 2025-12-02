/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { AdminRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireRole([
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.SUPPORT,
  ]);

  const actionParam = getParam(searchParams?.action)?.trim();
  const entityParam = getParam(searchParams?.entityType)?.trim();

  const where: any = {};
  if (actionParam) {
    where.action = actionParam;
  }
  if (entityParam) {
    where.entityType = entityParam;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const distinctActions = Array.from(new Set(logs.map((l) => l.action))).sort();
  const distinctEntities = Array.from(new Set(logs.map((l) => l.entityType))).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit</h1>
        <p className="text-slate-600">
          Journal des actions admin (génération et révocation de clés API, etc.).
        </p>
      </div>

      {/* Filtres simples */}
      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Action
          </label>
          <select
            name="action"
            defaultValue={actionParam ?? ""}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="">Toutes</option>
            {distinctActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Type d'entité
          </label>
          <select
            name="entityType"
            defaultValue={entityParam ?? ""}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="">Toutes</option>
            {distinctEntities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Filtrer
        </button>
      </form>

      {/* Tableau des logs */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Admin</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entité</th>
              <th className="px-3 py-2">Détails</th>
              <th className="px-3 py-2">IP / UA</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-xs text-slate-500"
                >
                  Aucun log d'audit correspondant aux filtres.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    <div>{log.adminEmail}</div>
                    <div className="text-[10px] text-slate-400">
                      {log.adminUserId}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {log.action}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    <div>{log.entityType}</div>
                    <div className="text-[10px] text-slate-400">
                      {log.entityId}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    <pre className="max-w-xs whitespace-pre-wrap wrap-break-word rounded bg-slate-50 p-2 text-[10px] text-slate-700">
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                    <div>{log.ipAddress ?? "-"}</div>
                    <div className="mt-1 line-clamp-2 text-[10px] text-slate-400">
                      {log.userAgent ?? "-"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
