"use client";

/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PlanString = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";
type TenantStatusString = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "CHURNED";

interface TenantEditFormProps {
  id: string;
  plan: PlanString;
  status: TenantStatusString;
  monthlyQuota: number;
  internalNotes: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TenantEditForm({
  id,
  plan,
  status,
  monthlyQuota,
  internalNotes,
  trialEndsAt,
  subscriptionEndsAt,
}: TenantEditFormProps) {
  const router = useRouter();

  const [currentPlan, setCurrentPlan] = useState<PlanString>(plan);
  const [currentStatus, setCurrentStatus] = useState<TenantStatusString>(status);
  const [quota, setQuota] = useState<string>(String(monthlyQuota));
  const [notes, setNotes] = useState<string>(internalNotes ?? "");
  const [trialEnd, setTrialEnd] = useState<string>(toDateInputValue(trialEndsAt));
  const [subscriptionEnd, setSubscriptionEnd] = useState<string>(
    toDateInputValue(subscriptionEndsAt),
  );
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedQuota = parseInt(quota, 10);
    if (!Number.isFinite(parsedQuota) || parsedQuota <= 0) {
      setError("Le quota mensuel doit être un entier positif.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          plan: currentPlan,
          status: currentStatus,
          monthlyQuota: parsedQuota,
          internalNotes: notes.trim() === "" ? null : notes,
          trialEndsAt: trialEnd || null,
          subscriptionEndsAt: subscriptionEnd || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Impossible de mettre à jour le client.");
        return;
      }

      router.refresh();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-700">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tenant-plan">Plan</Label>
          <select
            id="tenant-plan"
            value={currentPlan}
            onChange={(e) => setCurrentPlan(e.target.value as PlanString)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="FREE">FREE</option>
            <option value="STARTER">STARTER</option>
            <option value="PRO">PRO</option>
            <option value="BUSINESS">BUSINESS</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-status">Statut</Label>
          <select
            id="tenant-status"
            value={currentStatus}
            onChange={(e) => setCurrentStatus(e.target.value as TenantStatusString)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="TRIAL">TRIAL</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="CHURNED">CHURNED</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="tenant-quota">Quota mensuel</Label>
          <Input
            id="tenant-quota"
            type="number"
            min={1}
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Nombre maximum de requêtes HCS-U7 par mois pour ce client.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-trial-end">Fin d'essai</Label>
          <Input
            id="tenant-trial-end"
            type="date"
            value={trialEnd}
            onChange={(e) => setTrialEnd(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant-subscription-end">Fin d'abonnement</Label>
          <Input
            id="tenant-subscription-end"
            type="date"
            value={subscriptionEnd}
            onChange={(e) => setSubscriptionEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenant-notes">Notes internes</Label>
        <textarea
          id="tenant-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        />
        <p className="text-xs text-slate-500">
          Visible uniquement par les administrateurs HCS-U7.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
