"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verifyTurnstile } from "@/auth";
import { sendEmail } from "@/lib/mail";
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
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  const loginLink = baseUrl
    ? `<a href="${baseUrl}/login" style="color: #10b981; font-weight: 700;">accedi qui</a>`
    : "accedi dalla pagina di login";

  return sendEmail({
    to: email,
    subject: "Hai già un account Skillr",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
        <h2 style="color: #020617; font-style: italic; font-weight: 800; font-size: 24px; margin-bottom: 24px;">Hai già un account Skillr</h2>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Qualcuno ha provato a registrarsi su Skillr con questo indirizzo email, ma esiste già un account. Se eri tu, ${loginLink}: se non ricordi la password puoi usare il Magic Link.</p>
        <p style="color: #94a3b8; font-size: 12px; font-style: italic;">Se non sei stato tu, ignora questa email: il tuo account non è stato modificato.</p>
      </div>
    `,
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
