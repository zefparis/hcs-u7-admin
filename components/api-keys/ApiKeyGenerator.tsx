/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TenantOption {
  id: string;
  fullName: string;
  email: string;
}

interface ApiKeyGeneratorProps {
  tenants: TenantOption[];
}

export function ApiKeyGenerator({ tenants }: ApiKeyGeneratorProps) {
  const router = useRouter();

  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [environment, setEnvironment] = useState("DEVELOPMENT");
  const [name, setName] = useState("Clé API");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setGeneratedKey(null);

    if (!tenantId) {
      setError("Veuillez sélectionner un client.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId, environment, name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Impossible de générer la clé API.");
        return;
      }

      const data = await res.json();
      setGeneratedKey(data.plaintextKey as string);
      router.refresh();
    } catch (e) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Générer une nouvelle clé API
      </h2>

      {tenants.length === 0 ? (
        <p className="text-xs text-slate-500">
          Aucun client n'est encore créé. Créez d'abord un tenant avant de
          générer une clé.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Client</Label>
            <select
              id="tenant"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Environnement</Label>
            <select
              id="environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <option value="PRODUCTION">Production (hcs_sk_live_...)</option>
              <option value="STAGING">Staging (hcs_sk_test_...)</option>
              <option value="DEVELOPMENT">Développement (hcs_sk_test_...)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom de la clé</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Production API, Staging, Dev local"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Génération..." : "Générer une clé API"}
          </Button>

          {generatedKey && (
            <div className="mt-4 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="font-semibold">
                Clé API générée (affichée une seule fois) :
              </div>
              <div className="overflow-x-auto rounded bg-white px-2 py-1 font-mono text-[11px] text-slate-900">
                {generatedKey}
              </div>
              <p>
                Copiez cette clé maintenant et stockez-la dans un gestionnaire de
                secrets sécurisé. Elle ne sera plus visible en clair ensuite.
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
