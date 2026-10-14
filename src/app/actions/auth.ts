"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verifyTurnstile } from "@/auth";
import { sendEmail } from "@/lib/mail";
import { appUrl } from "@/lib/app-url";
import { AlreadyRegisteredEmail } from "@/emails/AlreadyRegisteredEmail";
import { generateVerificationCode } from "./verification";

type RegisterResult =
  | { success: true }
  | { success?: false; error: string; reason?: "send_failed" };

const SEND_FAILED: RegisterResult = {
  error: "Non siamo riusciti a inviare il codice di verifica. Riprova tra qualche istante.",
  reason: "send_failed",
};

// Sent instead of a code when someone signs up with an email that already has a verified
// account: the owner learns about it, the person filling the form learns nothing.
async function sendAlreadyRegisteredNotice(email: string) {
  const loginUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL ? appUrl("/login") : undefined;
  return sendEmail({
    to: email,
    subject: "Hai già un account Helllo",
    react: AlreadyRegisteredEmail({ loginUrl }),
  });
}

export async function registerUserAction(formData: { email?: string; password?: string; turnstileToken?: string; legalConsent?: boolean }): Promise<RegisterResult> {
  const { email, password, turnstileToken, legalConsent } = formData;

  if (!email || !password) {
    return { error: "Email e password sono obbligatori." };
  }

  if (password.length < 8) {
    return { error: "La password deve contenere almeno 8 caratteri." };
  }

  // Consent is required for everyone (the old "@skillr.it" skip matched e.g. x@skillr.it.evil.com)
  if (!legalConsent) {
    return { error: "È necessario accettare i Termini e la Privacy per continuare." };
  }

  // 1. Verify Turnstile (required whenever TURNSTILE_SECRET_KEY is configured)
  if (!(await verifyTurnstile(turnstileToken))) {
    return { error: "Verifica anti-spam fallita. Riprova." };
  }

  try {
    // 2. Hash first, on every path, so response time doesn't tell whether the email exists
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, emailVerified: true },
    });

    // 3. Verified account: same answer as a new sign-up, no code, a heads-up to the owner
    if (existingUser?.emailVerified) {
      const notice = await sendAlreadyRegisteredNotice(email);
      return notice.success ? { success: true } : SEND_FAILED;
    }

    // 4. Create the user, or take over the password of an account nobody has verified yet:
    //    whoever completes the email verification is the one who chose it.
    if (existingUser) {
      await db.update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id));
    } else {
      await db.insert(users).values({
        email,
        password: hashedPassword,
      });
    }

    // 5. Generate and send verification code. A cooldown hit means a code was sent less than
    //    a minute ago and is still valid, so the user can go ahead and type it in.
    const sent = await generateVerificationCode(email);
    if (!sent.success && sent.reason !== "cooldown") return SEND_FAILED;

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Errore durante la registrazione. Riprova." };
  }
}
