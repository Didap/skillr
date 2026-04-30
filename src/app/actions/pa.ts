"use server";

import { db } from "@/db";
import { paLeads } from "@/db/schema";
import { z } from "zod";
import { sendEmail } from "@/lib/mail";
import { PaLeadNotificationEmail } from "@/emails/PaLeadNotificationEmail";
import { PaLeadConfirmationEmail } from "@/emails/PaLeadConfirmationEmail";

const paLeadSchema = z.object({
  fullName: z.string().min(2, "Il nome è troppo breve"),
  email: z.string().email("Inserire un indirizzo email valido"),
  phone: z.string().optional(),
  organization: z.string().min(2, "Specificare l'organizzazione"),
  entityType: z.enum(["municipality", "region", "cpi", "ngo", "foundation"]),
  role: z.string().min(2, "Specificare il ruolo"),
  service: z.enum(["match", "outreach", "codesign"]),
  deadline: z.date().optional(),
  notes: z.string().optional(),
  turnstileToken: z.string(),
});

export async function savePaLead(data: z.infer<typeof paLeadSchema>) {
  try {
    // 1. Verification (Anti-Spam)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    
    // In dev, if secret is not set, we can skip or use testing key
    if (turnstileSecret) {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: data.turnstileToken,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return { success: false, error: "Verifica anti-spam fallita. Riprova." };
      }
    }

    // 2. Validation
    const validatedData = paLeadSchema.parse({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined
    });

    // 2. Database Insert
    const [newLead] = await db.insert(paLeads).values({
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      organization: validatedData.organization,
      entityType: validatedData.entityType,
      role: validatedData.role,
      service: validatedData.service,
      deadline: validatedData.deadline,
      notes: validatedData.notes,
    }).returning();

    // 3. Notify Team (Internal)
    await sendEmail({
      to: "pa@skillr.it",
      subject: `[Lead PA] Nuova richiesta da ${validatedData.organization}`,
      react: PaLeadNotificationEmail({
        ...validatedData,
        deadline: validatedData.deadline?.toLocaleDateString('it-IT')
      })
    });

    // 4. Confirm to User (External)
    await sendEmail({
      to: validatedData.email,
      subject: "Abbiamo ricevuto la tua richiesta - Skillr per la PA",
      react: PaLeadConfirmationEmail({
        fullName: validatedData.fullName,
        organization: validatedData.organization,
      })
    });

    return { success: true, id: newLead.id };
  } catch (error) {
    console.error("Error saving PA Lead:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Dati non validi. Controlla i campi obbligatori." };
    }
    return { success: false, error: "Si è verificato un errore durante il salvataggio. Riprova più tardi." };
  }
}
