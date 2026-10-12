import NextAuth, { CredentialsSignin } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { EMAIL_NOT_VERIFIED, TURNSTILE_FAILED } from "./components/auth/login-errors";

let warnedMissingTurnstileSecret = false;

/**
 * Server-side Cloudflare Turnstile check. When TURNSTILE_SECRET_KEY is set a valid token
 * is required; without the secret (local dev without keys) the check is skipped.
 */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (!warnedMissingTurnstileSecret) {
      console.warn("TURNSTILE_SECRET_KEY is not set: anti-spam checks are disabled.");
      warnedMissingTurnstileSecret = true;
    }
    return true;
  }
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });
    const data = await response.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}

// The `code` ends up in the client's signIn() result, so the login UI can tell these apart
// from a plain wrong password.
class EmailNotVerifiedError extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED;
}

class TurnstileFailedError extends CredentialsSignin {
  code = TURNSTILE_FAILED;
}

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
        password: { label: "Password", type: "password" },
        turnstileToken: { type: "hidden" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        if (!(await verifyTurnstile(credentials.turnstileToken as string | undefined))) {
          throw new TurnstileFailedError();
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string)
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        // Checked only after the password, so the error can't be used to probe which emails exist.
        if (!user.emailVerified) throw new EmailNotVerifiedError();

        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
      }
    })
  ],
  pages: {
    signIn: "/login",
    // onboarding: "/onboarding",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
      }

      // On a client-side update (e.g. after onboarding) and when the role is missing,
      // re-read it from the DB. Never take the role from the update payload:
      // any logged-in user can call update({ role }).
      if ((trigger === "update" || !token.role) && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.sub as string),
          columns: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as "professional" | "company" | "pa_admin" | null;
      }
      return session;
    },
  },
});
