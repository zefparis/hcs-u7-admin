/**
 * Route de debug TEMPORAIRE pour vérifier la connexion DB en prod.
 * À SUPPRIMER une fois le problème résolu.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ok: true, admins });
  } catch (error) {
    // On renvoie l'erreur pour comprendre ce qui se passe en prod
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
