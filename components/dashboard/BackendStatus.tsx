/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { checkBackendHealth } from "@/lib/backend-health";

export async function BackendStatus() {
  const health = await checkBackendHealth();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Backend HCS-U7
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                health.connected
                  ? "bg-green-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span
              className={`text-lg font-bold ${
                health.connected ? "text-green-600" : "text-red-600"
              }`}
            >
              {health.connected ? "Connecté" : "Déconnecté"}
            </span>
          </div>
        </div>

        {health.connected && (
          <div className="text-right">
            <div className="text-xs text-slate-500">Environnement</div>
            <div className="text-sm font-medium text-slate-700 capitalize">
              {health.environment}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        {health.connected ? (
          <>
            <span>Statut: {health.status}</span>
            <span>{health.responseTime}ms</span>
          </>
        ) : (
          <span className="text-red-500">{health.error}</span>
        )}
      </div>
    </div>
  );
}
