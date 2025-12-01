/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { redirect } from "next/navigation";
import type { AdminRole } from "@prisma/client";

import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(allowedRoles: AdminRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes((session.user as any).role)) {
    redirect("/dashboard");
  }

  return session;
}
