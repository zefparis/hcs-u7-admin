/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import crypto from "crypto";

/**
 * Generate a secure temporary password for new tenants.
 * Format: "HCS2024_" + 8 random alphanumeric characters
 * Example: "HCS2024_X7k9Qa2p"
 */
export function generateSecurePassword(): string {
  const randomPart = crypto.randomBytes(6).toString("base64url").slice(0, 8);
  return `HCS2024_${randomPart}`;
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}
