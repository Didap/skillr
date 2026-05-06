"use server";

import { db } from "@/db";
import { paLeads, paSubscribers } from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { sendEmail, resend } from "@/lib/mail";
import { PaLeadNotificationEmail } from "@/emails/PaLeadNotificationEmail";
import { PaLeadConfirmationEmail } from "@/emails/PaLeadConfirmationEmail";
import { PaNewsletterVerificationEmail } from "@/emails/PaNewsletterVerificationEmail";


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

export type PaLead = z.infer<typeof paLeadSchema>;

export async function savePaLeadAction(data: PaLead) {
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

export async function subscribeToNewsletterAction(email: string) {
  try {
    const validatedEmail = z.string().email("Indirizzo email non valido").parse(email);
    const token = crypto.randomUUID();

    // Verifichiamo se esiste già
    const existing = await db.query.paSubscribers.findFirst({
      where: eq(paSubscribers.email, validatedEmail)
    });

    if (existing && existing.status === 'active') {
      return { success: false, error: "Questo indirizzo email è già iscritto alla newsletter." };
    }

    if (existing) {
      // Update token per ripetere la verifica se era pending
      await db.update(paSubscribers)
        .set({ 
          verificationToken: token, 
          createdAt: new Date() 
        })
        .where(eq(paSubscribers.email, validatedEmail));
    } else {
      await db.insert(paSubscribers).values({
        email: validatedEmail,
        verificationToken: token,
      });
    }

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/pa/newsletter/confirm?token=${token}`;

    await sendEmail({
      to: validatedEmail,
      subject: "Conferma iscrizione Newsletter Skillr PA",
      react: PaNewsletterVerificationEmail({ verificationLink })
    });

    return { success: true };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Indirizzo email non valido." };
    }
    return { success: false, error: "Errore durante l'iscrizione. Riprova più tardi." };
  }
}

export async function confirmNewsletterSubscriptionAction(token: string) {
  try {
    if (!token) return { success: false, error: "Token mancante." };

    const subscriber = await db.query.paSubscribers.findFirst({
      where: eq(paSubscribers.verificationToken, token)
    });

    if (!subscriber) {
      return { success: false, error: "Token non valido o già utilizzato." };
    }

    await db.update(paSubscribers)
      .set({ 
        status: 'active', 
        verificationToken: null,
        verifiedAt: new Date() 
      })
      .where(eq(paSubscribers.id, subscriber.id));

    // 2. Add to Resend Audience (Optional but recommended in task)
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (audienceId) {
      try {
        await resend.contacts.create({
          email: subscriber.email,
          unsubscribed: false,
          audienceId: audienceId,
        });
      } catch (resendError) {
        console.error("Failed to add contact to Resend audience:", resendError);
        // We don't fail the action if Resend fails, as the DB is already updated
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Newsletter confirmation error:", error);
    return { success: false, error: "Errore durante la conferma. Riprova più tardi." };
  }
}

