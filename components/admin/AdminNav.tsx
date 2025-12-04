/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/ThemeProvider";

interface AdminNavProps {
  user: {
    email: string;
    name?: string | null;
    role: string;
  };
}

interface NavItem {
  href: string;
  label: string;
  roles?: string[];
  showBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/access-requests", label: "Requests", roles: ["SUPER_ADMIN", "ADMIN"], showBadge: true },
  { href: "/clients", label: "Clients" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/audit", label: "Audit" },
  { href: "/security", label: "Security" },
  { href: "/analytics", label: "Analytics" },
  { href: "/usage", label: "Usage", roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] },
  { href: "/support", label: "Support", roles: ["SUPER_ADMIN", "SUPPORT"] },
  { href: "/billing", label: "Billing" },
  { href: "/admin-users", label: "Admins", roles: ["SUPER_ADMIN"] },
];

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Fetch pending access requests count
  useEffect(() => {
    if (["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      fetch("/api/admin/access-requests/count?status=PENDING")
        .then((res) => res.json())
        .then((data) => setPendingCount(data.count || 0))
        .catch(() => setPendingCount(0));
    }
  }, [user.role]);

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
            if (item.roles && !item.roles.includes(user.role)) {
              return null;
            }

            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1"
                >
                  <span>{item.label}</span>
                  {item.showBadge && pendingCount > 0 && (
                    <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* User section */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 w-8 items-center justify-center p-0 sm:inline-flex"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
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
