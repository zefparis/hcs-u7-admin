"use client";

/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SecurityCredentialsForm() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword.trim()) {
      setError("Mot de passe actuel obligatoire");
      return;
    }

    if (!newEmail.trim() && !newPassword.trim()) {
      setError("Vous devez renseigner un nouvel email et/ou un nouveau mot de passe");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/credentials", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newEmail: newEmail.trim() || undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!res.ok || !data || data.success !== true) {
        setError(data.error || "Impossible de mettre à jour vos identifiants.");
        return;
      }

      setSuccess(
        "Vos identifiants ont été mis à jour. Vous allez être déconnecté pour appliquer la modification."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 1500);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Mes identifiants de connexion
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Mettez à jour l'email et/ou le mot de passe utilisés pour vous connecter au
        dashboard. Aucun email automatique n'est envoyé pour l'instant ; nous
        ajouterons Brevo plus tard pour les notifications et resets.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Mot de passe actuel</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-email">Nouvel email (optionnel)</Label>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@example.com"
            />
            <p className="text-[11px] text-slate-500">
              L'email doit être unique. Vous devrez vous reconnecter avec ce nouvel
              email après la mise à jour.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe (optionnel)</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Au moins 12 caractères recommandés"
            />
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le nouveau mot de passe"
              className="mt-1"
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} className="w-full md:w-auto">
          {loading ? "Mise à jour..." : "Mettre à jour mes identifiants"}
        </Button>
      </form>
    </div>
  );
}
