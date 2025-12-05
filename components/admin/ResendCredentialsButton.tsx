/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { useState } from "react";
import { Mail, Loader2, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface ResendCredentialsButtonProps {
  tenantId: string;
  tenantEmail: string;
  tenantName: string;
}

export function ResendCredentialsButton({
  tenantId,
  tenantEmail,
  tenantName,
}: ResendCredentialsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; password?: string } | null>(null);
  const { toast } = useToast();

  const handleResend = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/resend-credentials`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
        toast({
          title: "Identifiants envoyés",
          description: `Un email a été envoyé à ${tenantEmail}`,
          variant: "default",
        });
      } else if (data.newPassword) {
        // Email failed but password was reset
        setResult({
          success: false,
          message: "Le mot de passe a été réinitialisé mais l'email n'a pas pu être envoyé.",
          password: data.newPassword,
        });
        toast({
          title: "Email non envoyé",
          description: "Copiez le mot de passe ci-dessous pour le transmettre manuellement.",
          variant: "destructive",
        });
      } else {
        setResult({ success: false, message: data.error || "Une erreur est survenue" });
        toast({
          title: "Erreur",
          description: data.error || "Une erreur est survenue",
          variant: "destructive",
        });
      }
    } catch (error) {
      setResult({ success: false, message: "Erreur de connexion" });
      toast({
        title: "Erreur",
        description: "Impossible de contacter le serveur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        Renvoyer identifiants
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renvoyer les identifiants</DialogTitle>
            <DialogDescription>
              Cette action va générer un nouveau mot de passe temporaire et l&apos;envoyer par email au client.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg bg-slate-50 p-4 space-y-2">
              <div className="text-sm">
                <span className="text-slate-500">Client :</span>{" "}
                <span className="font-medium">{tenantName}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Email :</span>{" "}
                <span className="font-medium">{tenantEmail}</span>
              </div>
            </div>

            {result && (
              <div className={`mt-4 rounded-lg p-4 ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                      {result.message}
                    </p>
                    {result.password && (
                      <div className="mt-2">
                        <p className="text-xs text-red-600 mb-1">Mot de passe à transmettre manuellement :</p>
                        <code className="block bg-white border border-red-200 rounded px-3 py-2 font-mono text-sm select-all">
                          {result.password}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">
                <strong>⚠️ Attention :</strong> L&apos;ancien mot de passe sera invalidé immédiatement. 
                Le client devra utiliser le nouveau mot de passe pour se connecter.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {result?.success ? "Fermer" : "Annuler"}
            </Button>
            {!result?.success && (
              <Button onClick={handleResend} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer les identifiants
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
