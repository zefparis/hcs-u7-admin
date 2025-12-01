/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToastProvider, useToast } from "@/components/ui/use-toast";

function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          variant={toast.variant}
          className="max-w-md cursor-pointer"
          onClick={() => dismiss(toast.id)}
        >
          {toast.title && <div className="font-medium mb-1">{toast.title}</div>}
          {toast.description && (
            <AlertDescription>{toast.description}</AlertDescription>
          )}
        </Alert>
      ))}
    </div>
  );
}

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
