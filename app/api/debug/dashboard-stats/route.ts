/**
 * Route de debug TEMPORAIRE pour comprendre pourquoi /dashboard plante en prod.
 * Elle appelle getDashboardStats() comme la page, mais renvoie l'erreur brute.
 * À SUPPRIMER une fois le problème résolu.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
