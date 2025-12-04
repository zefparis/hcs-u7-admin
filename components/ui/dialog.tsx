/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClose?: () => void;
}

export function DialogContent({
  children,
  className,
  onClose,
  ...props
}: DialogContentProps) {
  return (
    <div
      className={cn(
        "relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {children}
    </div>
  );
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn("mb-4 flex flex-col space-y-1.5", className)}
      {...props}
    />
  );
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  );
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn("mt-6 flex justify-end gap-3", className)}
      {...props}
    />
  );
}
