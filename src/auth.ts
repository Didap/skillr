import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
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
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string)
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        
        if (isValid) return user;
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
    // onboarding: "/onboarding",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // @ts-ignore
        token.role = user.role;
      }
      
      // Se c'è un update manuale dalla client side (es. post-onboarding)
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      // Fallback: se il ruolo manca ma abbiamo l'ID, lo cerchiamo (opzionale per robustezza)
      if (!token.role && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.sub as string)
        });
        if (dbUser) token.role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // @ts-ignore
        session.user.id = token.sub;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
});
