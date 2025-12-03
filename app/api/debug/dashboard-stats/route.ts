/**
 * Route de debug TEMPORAIRE pour comprendre pourquoi /dashboard plante en prod.
 * Elle appelle getDashboardStats() comme la page, mais renvoie l'erreur brute.
 * À SUPPRIMER une fois le problème résolu.
 */

import { NextResponse } from "next/server";

import { getDashboardStats } from "@/lib/dashboard-stats";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
