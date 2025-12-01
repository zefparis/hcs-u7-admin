/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

interface AdminNavProps {
  user: {
    email: string;
    name?: string | null;
    role: string;
  };
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/audit", label: "Audit" },
  { href: "/security", label: "Security" },
  { href: "/analytics", label: "Analytics" },
  { href: "/billing", label: "Billing" },
];

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user.email[0]?.toUpperCase();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-bold"
          >
            <span className="text-2xl">🔒</span>
            <span>HCS-U7 Admin</span>
          </Link>
          <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-slate-600">
            FR2514274
          </span>
        </div>

        {/* Nav items */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1"
                >
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* User section */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs sm:block">
            <div className="font-medium">{user.name ?? "Admin"}</div>
            <div className="text-slate-500">{user.email}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {initials}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </nav>
  );
}
