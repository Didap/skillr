import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google,
    Resend({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    }),
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Logica semplificata per ora, andrebbe aggiunto hash password
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials?.email as string)
        });
        if (user) return user;
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
    // onboarding: "/onboarding",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // @ts-ignore - we'll define types in next-auth.d.ts
        session.user.id = user.id;
        // @ts-ignore
        session.user.role = user.role;
      }
      return session;
    },
  },
});
