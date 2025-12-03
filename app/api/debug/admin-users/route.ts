/**
 * Route de debug TEMPORAIRE pour vérifier la connexion DB en prod.
 * À SUPPRIMER une fois le problème résolu.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
