/**
 * Route de debug TEMPORAIRE pour vérifier la config NextAuth en prod.
 * À SUPPRIMER une fois le problème résolu.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    AUTH_SECRET_PRESENT: Boolean(process.env.AUTH_SECRET),
    NEXTAUTH_SECRET_PRESENT: Boolean(process.env.NEXTAUTH_SECRET),
    NODE_ENV: process.env.NODE_ENV ?? null,
  });
}
