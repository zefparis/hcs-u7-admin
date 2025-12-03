/**
 * Route de debug TEMPORAIRE pour tester la logique Prisma + bcrypt
 * sans passer par NextAuth. À SUPPRIMER une fois le problème résolu.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
