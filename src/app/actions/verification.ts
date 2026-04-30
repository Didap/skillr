"use server";

import { db } from "@/db";
import { verificationCodes, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function generateVerificationCode(email: string) {
  // Generate 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // Delete old codes for this email
    await db.delete(verificationCodes).where(eq(verificationCodes.email, email));

    // Insert new code
    await db.insert(verificationCodes).values({
      email,
      code,
      expiresAt,
    });

    // Send email via Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Skillr <onboarding@resend.dev>",
      to: email,
      subject: `${code} è il tuo codice di verifica Skillr`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
          <h2 style="color: #020617; font-style: italic; font-weight: 800; font-size: 24px; margin-bottom: 24px;">Benvenuto su Skillr</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Per completare la tua registrazione e iniziare a fare swipe, inserisci il seguente codice di verifica:</p>
          <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #10b981;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; font-style: italic;">Questo codice scadrà tra 10 minuti. Se non hai richiesto tu questo codice, ignora questa email.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error generating/sending code:", error);
    return { success: false, error: "Impossibile inviare il codice di verifica." };
  }
}

export async function verifyEmailCodeAction(email: string, code: string) {
  try {
    const record = await db.query.verificationCodes.findFirst({
      where: and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code)
      ),
    });

    if (!record) {
      return { success: false, error: "Codice non valido." };
    }

    if (new Date() > record.expiresAt) {
      return { success: false, error: "Codice scaduto. Richiedine uno nuovo." };
    }

    // Mark user as verified
    await db.update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email));

    // Delete the code
    await db.delete(verificationCodes).where(eq(verificationCodes.id, record.id));

    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: "Errore durante la verifica." };
  }
}
