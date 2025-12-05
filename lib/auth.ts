/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { AdminRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: AdminRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: AdminRole;
  }
}

export const authConfig: NextAuthConfig = {
  // Important pour la prod (Vercel) : on fait confiance à l'hôte courant
  // et on lit le secret depuis AUTH_SECRET ou NEXTAUTH_SECRET.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Authentification simplifiée pour l'admin unique
        const ADMIN_EMAIL = "contact@hcs-u7.info";
        const ADMIN_PASSWORD = "HCS-U7admin2025!";

        if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          // Chercher ou créer l'admin dans la DB
          let admin = await prisma.adminUser.findUnique({
            where: { email: ADMIN_EMAIL },
          });

          if (!admin) {
            // Créer l'admin s'il n'existe pas
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            admin = await prisma.adminUser.create({
              data: {
                email: ADMIN_EMAIL,
                passwordHash: hashedPassword,
                fullName: "Admin HCS-U7",
                role: "SUPER_ADMIN",
              },
            });
          }

          // Update last login timestamp
          await prisma.adminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: admin.id,
            email: admin.email,
            name: admin.fullName ?? admin.email,
            role: admin.role,
          } as any;
        }

        // Les tenants ne doivent PAS pouvoir se connecter au dashboard admin
        // Ils doivent utiliser leur propre interface sur https://hcs-u7.online
        
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        (session.user as any).id = token.sub;
      }
      if ((token as any).role) {
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
