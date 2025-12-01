/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface ApiKeyToggleButtonProps {
  id: string;
  isActive: boolean;
}

export function ApiKeyToggleButton({ id, isActive }: ApiKeyToggleButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const label = isActive ? "Révoquer" : "Réactiver";
  const variant = isActive ? "destructive" : "outline";

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/api-keys", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? "..." : label}
    </Button>
  );
}
