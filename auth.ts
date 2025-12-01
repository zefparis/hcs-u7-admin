/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
