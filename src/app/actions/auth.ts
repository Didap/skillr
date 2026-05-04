"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateVerificationCode } from "./verification";

async function verifyTurnstile(token: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true; // Skip if no key (dev)
  
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    );
    const data = await response.json();
    return data.success;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}

export async function registerUserAction(formData: { email?: string; password?: string; turnstileToken?: string; legalConsent?: boolean }) {
  const { email, password, turnstileToken, legalConsent } = formData;

  if (!email || !password) {
    return { error: "Email e password sono obbligatori." };
  }

  if (!legalConsent && !formData.email?.includes("@skillr.it")) { // Permettiamo skip per admin/test se necessario, ma di base obbligatorio
    return { error: "È necessario accettare i Termini e la Privacy per continuare." };
  }

  // 1. Verify Turnstile
  if (turnstileToken) {
    const isHuman = await verifyTurnstile(turnstileToken);
    if (!isHuman) {
      return { error: "Verifica anti-spam fallita. Riprova." };
    }
  }

  try {
    // 2. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      // Se l'utente esiste ma non è verificato, rimandiamo il codice
      if (!existingUser.emailVerified) {
        await generateVerificationCode(email);
        return { success: true, message: "Utente già registrato ma non verificato. Abbiamo inviato un nuovo codice." };
      }
      return { error: "Questo indirizzo email è già registrato." };
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    await db.insert(users).values({
      email,
      password: hashedPassword,
    });

    // 5. Generate and send verification code
    await generateVerificationCode(email);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto";
    console.error("Registration error:", error);
    return { error: `Errore durante la registrazione: ${message}` };
  }
}
