/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default(
    "development"
  ),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  RESEND_API_KEY: z.string().optional(),
  SITE_URL: z.string().url().optional(),
  ADMIN_URL: z.string().url().optional(),
  HCS_U7_BACKEND_URL: z.string().url().optional(),
  // Code maître pour bypass la vérification du mot de passe actuel (super admin)
  ADMIN_MASTER_CODE: z.string().min(6).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:");
  // eslint-disable-next-line no-console
  console.error(parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
