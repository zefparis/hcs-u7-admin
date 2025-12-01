/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import * as React from "react";

import { cn } from "@/lib/utils";

export type AlertVariant = "default" | "destructive";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  const base =
    "relative w-full rounded-md border px-4 py-3 text-sm flex items-start gap-2";
  const variants: Record<AlertVariant, string> = {
    default: "border-slate-200 bg-slate-50 text-slate-900",
    destructive: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props} />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm", className)} {...props} />
  );
}
