/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { AdminRole } from "@prisma/client";

import { requireRole } from "@/lib/auth-helpers";
import { AccessRequestsClient } from "./AccessRequestsClient";

export const dynamic = "force-dynamic";

export default async function AccessRequestsPage() {
  await requireRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN]);

  return <AccessRequestsClient />;
}
