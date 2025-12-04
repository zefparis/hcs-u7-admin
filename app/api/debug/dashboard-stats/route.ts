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
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        name: error?.name ?? null,
        message: error?.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
