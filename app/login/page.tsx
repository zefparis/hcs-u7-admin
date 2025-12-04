"use client";

/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("contact@hcs-u7.tech");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Email ou mot de passe invalide");
      } else if (result?.url) {
        router.push(result.url);
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setError("Veuillez renseigner votre email pour demander un nouveau mot de passe.");
      return;
    }

    setError("");
    setInfo("");
    setResetLoading(true);

    try {
      const res = await fetch("/api/account/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        if (data.error) {
          setError(data.error);
        } else {
          setError("La demande de nouveau mot de passe a échoué. Réessayez plus tard.");
        }
        return;
      }

      setInfo(
        "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé. Consultez votre boîte de réception."
      );
    } catch {
      setError("Impossible de demander un nouveau mot de passe. Réessayez plus tard.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center mb-2">
            <div className="text-5xl">🔒</div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">
            HCS-U7 Admin
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous au dashboard d'administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@hcs-u7.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={handleResetPassword}
                className="mt-1 text-xs text-blue-600 hover:underline disabled:opacity-60"
                disabled={resetLoading}
              >
                {resetLoading
                  ? "Envoi du nouveau mot de passe..."
                  : "Mot de passe oublié ?"}
              </button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {info && !error && (
              <Alert>
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-1">
            <p className="text-xs text-slate-500">HCS-U7 Admin Dashboard</p>
            <p className="text-xs text-slate-400">Patent Pending FR2514274</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          Chargement...
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
