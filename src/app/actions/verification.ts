"use server";

import { randomInt, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { verificationCodes, users } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/mail";
import { EMAIL_TAGLINE, emailLogoUrl } from "@/emails/EmailBrand";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

type CodeResult =
  | { success: true }
  | { success: false; reason: "cooldown" | "send_failed" | "error"; error: string };

// Exported as a server action (the "resend code" button calls it directly), so it must be
// safe to call with any email: it only ever sends to existing, unverified accounts and
// answers the same way otherwise.
export async function generateVerificationCode(email: string): Promise<CodeResult> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { emailVerified: true },
    });
    if (!user || user.emailVerified) return { success: true };

    // One code per minute: each new code resets the attempt counter, so without a cooldown
    // the 5-attempt limit could be sidestepped by requesting codes in a loop.
    const existing = await db.query.verificationCodes.findFirst({
      where: eq(verificationCodes.email, email),
    });
    if (existing?.createdAt && Date.now() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      return {
        success: false,
        reason: "cooldown",
        error: "Ti abbiamo appena inviato un codice. Attendi un minuto prima di richiederne un altro.",
      };
    }

    const code = randomInt(100000, 1000000).toString();
    const now = new Date();

    await db.delete(verificationCodes).where(eq(verificationCodes.email, email));
    const [inserted] = await db.insert(verificationCodes).values({
      email,
      code,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      createdAt: now,
    }).returning({ id: verificationCodes.id });

    const sent = await sendEmail({
      to: email,
      subject: `${code} è il tuo codice di verifica Helllo`,
      html: `
        <div style="background-color: #F4E9E9; padding: 32px 16px; font-family: 'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <div style="max-width: 560px; margin: 0 auto; padding: 40px 32px; background-color: #FFFFFF; border: 1px solid #E4DAE6; border-radius: 28px;">
            <img src="${emailLogoUrl()}" width="108" height="40" alt="Helllo" style="display: block; border: 0; margin: 0 0 28px; color: #E93D29; font-size: 24px; font-weight: 700;" />
            <h1 style="color: #653171; font-weight: 700; font-size: 26px; line-height: 1.25; letter-spacing: -0.01em; margin: 0 0 16px;">Benvenuto su Helllo</h1>
            <p style="color: #653171; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">Per completare la tua registrazione e iniziare a dire helllo, inserisci questo codice di verifica:</p>
            <div style="background-color: #F4E9E9; border-radius: 20px; padding: 24px; text-align: center; margin: 0 0 24px;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #653171;">${code}</span>
            </div>
            <p style="color: #80558A; font-size: 13px; line-height: 1.5; margin: 0;">Questo codice scadrà tra 10 minuti. Se non hai richiesto tu questo codice, ignora questa email.</p>
          </div>
          <p style="color: #80558A; font-size: 13px; line-height: 1.5; text-align: center; margin: 24px 0 0;">${EMAIL_TAGLINE}</p>
        </div>
      `,
    });

    if (!sent.success) {
      // Drop the code nobody received, so the user can retry without waiting for the cooldown.
      await db.delete(verificationCodes).where(eq(verificationCodes.id, inserted.id));
      return {
        success: false,
        reason: "send_failed",
        error: "Non siamo riusciti a inviare il codice di verifica. Riprova tra qualche istante.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error generating/sending code:", error);
    return { success: false, reason: "error", error: "Impossibile inviare il codice di verifica." };
  }
}

function codesMatch(expected: string, received: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function verifyEmailCodeAction(email: string, code: string) {
  const submitted = code.trim();
  if (!/^\d{6}$/.test(submitted)) {
    return { success: false, error: "Codice non valido." };
  }

  try {
    const record = await db.query.verificationCodes.findFirst({
      where: eq(verificationCodes.email, email),
    });

    if (!record) {
      return { success: false, error: "Codice non valido o scaduto. Richiedine uno nuovo." };
    }

    if (new Date() > record.expiresAt) {
      return { success: false, error: "Codice scaduto. Richiedine uno nuovo." };
    }

    // Count the attempt before comparing, in a single conditional update, so parallel
    // requests can't squeeze in more than MAX_ATTEMPTS guesses.
    const [counted] = await db.update(verificationCodes)
      .set({ attempts: sql`${verificationCodes.attempts} + 1` })
      .where(and(eq(verificationCodes.id, record.id), lt(verificationCodes.attempts, MAX_ATTEMPTS)))
      .returning({ attempts: verificationCodes.attempts });

    // An exhausted code stays in the table (unusable) until the next resend, so the resend
    // cooldown keeps applying to it.
    if (!counted) {
      return { success: false, error: "Troppi tentativi errati. Richiedi un nuovo codice." };
    }

    if (!codesMatch(record.code, submitted)) {
      const remaining = MAX_ATTEMPTS - counted.attempts;
      if (remaining <= 0) {
        return { success: false, error: "Troppi tentativi errati. Richiedi un nuovo codice." };
      }
      return {
        success: false,
        error: `Codice non valido. ${remaining === 1 ? "Ti resta 1 tentativo." : `Ti restano ${remaining} tentativi.`}`,
      };
    }

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.email, email));
      await tx.delete(verificationCodes).where(eq(verificationCodes.id, record.id));
    });

    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: "Errore durante la verifica." };
  }
}
