import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        const admin = await prisma.adminUser.findUnique({
          where: { email },
        });

        if (!admin) {
          return null;
        }

        const isValid = await bcrypt.compare(password, admin.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.fullName ?? admin.email,
          role: admin.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }: any) {
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
});
