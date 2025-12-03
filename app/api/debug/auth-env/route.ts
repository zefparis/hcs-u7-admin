/**
 * Route de debug TEMPORAIRE pour vérifier la config NextAuth en prod.
 * À SUPPRIMER une fois le problème résolu.
 */

import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    authSecretDefined: !!process.env.AUTH_SECRET,
    nextAuthSecretDefined: !!process.env.NEXTAUTH_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}
