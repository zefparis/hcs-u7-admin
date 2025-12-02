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

type AdminRoleString = "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "VIEWER";

interface AdminSummary {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRoleString;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AdminUsersClientProps {
  admins: {
    id: string;
    email: string;
    fullName: string | null;
    role: AdminRoleString;
    createdAt: Date;
    lastLoginAt: Date | null;
  }[];
}

export function AdminUsersClient({ admins }: AdminUsersClientProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRoleString>("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setGeneratedPassword(null);

    if (!email.trim()) {
      setError("Email obligatoire");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim() || undefined,
          role,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Impossible de créer l'administrateur.");
        return;
      }

      const data = (await res.json()) as {
        plaintextPassword: string;
      };

      setGeneratedPassword(data.plaintextPassword);
      setEmail("");
      setFullName("");
      setRole("ADMIN");
      router.refresh();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(id: string, newRole: AdminRoleString) {
    try {
      const res = await fetch("/api/admin-users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, role: newRole }),
      });

      if (!res.ok) {
        // Optionnel : afficher une erreur locale plus tard si besoin
        return;
      }

      router.refresh();
    } catch {
      // silencieux pour l'instant
    }
  }

  async function handleDelete(id: string) {
    // Protection simple : confirmation côté UI
    const confirmed = window.confirm(
      "Confirmez-vous la suppression de cet administrateur ?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        return;
      }

      router.refresh();
    } catch {
      // silencieux pour l'instant
    }
  }

  const adminRows: AdminSummary[] = admins.map((a) => ({
    id: a.id,
    email: a.email,
    fullName: a.fullName,
    role: a.role,
    createdAt: a.createdAt.toISOString(),
    lastLoginAt: a.lastLoginAt ? a.lastLoginAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administrateurs</h1>
        <p className="text-slate-600">
          Gestion des comptes admin du dashboard HCS-U7 (accès interne).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Créer un administrateur
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-fullname">Nom complet (optionnel)</Label>
              <Input
                id="admin-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nom Prénom"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-role">Rôle</Label>
              <select
                id="admin-role"
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRoleString)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPPORT">SUPPORT</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Création..." : "Créer l'administrateur"}
          </Button>

          {generatedPassword && (
            <div className="mt-4 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="font-semibold">
                Mot de passe généré (affiché une seule fois) :
              </div>
              <div className="overflow-x-auto rounded bg-white px-2 py-1 font-mono text-[11px] text-slate-900">
                {generatedPassword}
              </div>
              <p>
                Copiez ce mot de passe maintenant et transmettez-le de manière
                sécurisée. L'utilisateur devra le modifier dès la première
                connexion.
              </p>
            </div>
          )}
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Comptes existants
          </h2>
          <div className="text-xs text-slate-500">Total : {adminRows.length}</div>
        </div>

        {adminRows.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun administrateur n'est enregistré en base.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Admin</th>
                  <th className="px-3 py-2">Rôle</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminRows.map((admin) => (
                  <tr key={admin.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-slate-900">
                        {admin.fullName || "(Sans nom)"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <select
                        value={admin.role}
                        onChange={(e) =>
                          handleUpdateRole(admin.id, e.target.value as AdminRoleString)
                        }
                        className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPPORT">SUPPORT</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                      <div>
                        Créé le {new Date(admin.createdAt).toLocaleString("fr-FR")}
                      </div>
                      <div>
                        Dernière connexion :
                        {" "}
                        {admin.lastLoginAt
                          ? new Date(admin.lastLoginAt).toLocaleString("fr-FR")
                          : "Jamais"}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(admin.id)}
                      >
                        Supprimer
                      </Button>
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
