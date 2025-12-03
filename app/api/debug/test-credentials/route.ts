/**
 * Route de debug TEMPORAIRE pour tester la logique Prisma + bcrypt
 * sans passer par NextAuth. À SUPPRIMER une fois le problème résolu.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const email = searchParams.get("email");
  const password = searchParams.get("password");

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Missing email or password in query string" },
      { status: 400 },
    );
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      return NextResponse.json({ ok: false, step: "findUnique", reason: "admin_not_found" });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);

    return NextResponse.json({
      ok: isValid,
      step: "compare",
      email: admin.email,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        step: "exception",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
