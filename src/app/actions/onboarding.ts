"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { validateItalianVAT } from "@/lib/vat";

export interface OnboardingData {
  role: "professional" | "company";
  firstName?: string;
  lastName?: string;
  title?: string;
  photoUrl?: string;
  topSkills?: string[];
  selectedClusters?: string[];
  rateAmount?: string;
  rateType?: "ral_annual" | "daily" | "hourly";
  bio?: string;
  bioLong?: string;
  cvUrl?: string;
  portfolioUrls?: string[];
  companyName?: string;
  vatNumber?: string;
  vatDisclaimerAccepted?: boolean;
}

const RATE_TYPES = ["ral_annual", "daily", "hourly"] as const;

function cleanList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v): v is string => typeof v === "string" && v.trim() !== ""))];
}

// Mirrors the rules the onboarding steps enforce on the client.
function validate(data: OnboardingData): string | null {
  if (data.role === "professional") {
    if (!data.firstName?.trim() || !data.lastName?.trim()) return "Nome e cognome sono obbligatori.";
    if (cleanList(data.selectedClusters).length === 0) return "Seleziona almeno un settore.";
    if (cleanList(data.topSkills).length !== 3) return "Seleziona esattamente 3 competenze chiave.";
    if (data.rateType && !RATE_TYPES.includes(data.rateType)) return "Tipo di tariffa non valido.";
    if (data.rateAmount && !/^\d+$/.test(data.rateAmount.trim())) return "La tariffa deve essere un numero intero.";
    return null;
  }
  if (!data.companyName?.trim()) return "Il nome dell'azienda è obbligatorio.";
  if (!validateItalianVAT(data.vatNumber || "")) return "Partita IVA non valida.";
  if (!data.vatDisclaimerAccepted) return "È necessario accettare la clausola di responsabilità.";
  return null;
}

export async function completeOnboardingAction(data: OnboardingData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Non autorizzato. Effettua il login." };
  }

  const userId = session.user.id;
  const { role } = data;

  if (role !== "professional" && role !== "company") {
    return { error: "Ruolo mancante." };
  }

  // Validate everything before writing anything: a role without a profile leaves the user stuck.
  const validationError = validate(data);
  if (validationError) return { error: validationError };

  try {
    const current = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { role: true },
    });
    if (current?.role && current.role !== role) {
      return { error: "Il tuo account ha già un ruolo diverso." };
    }

    await db.transaction(async (tx) => {
      // 1. Update user role
      await tx.update(users)
        .set({ role })
        .where(eq(users.id, userId));

      // 2. Create the specific profile
      if (role === "professional") {
        const profile = {
          firstName: data.firstName!.trim(),
          lastName: data.lastName!.trim(),
          title: data.title || "",
          photoUrl: data.photoUrl || "",
          topSkills: cleanList(data.topSkills),
          clusters: cleanList(data.selectedClusters),
          rateAmountEur: data.rateAmount ? parseInt(data.rateAmount, 10) : 0,
          rateType: data.rateType || "daily",
          bioShort: data.bio || data.bioLong?.substring(0, 200) || "",
          bioLong: data.bioLong || data.bio || "",
          cvUrl: data.cvUrl || "",
          portfolioUrls: cleanList(data.portfolioUrls),
        };
        await tx.insert(professionalProfiles)
          .values({ userId, ...profile })
          .onConflictDoUpdate({ target: professionalProfiles.userId, set: profile });
      } else {
        const profile = {
          companyName: data.companyName!.trim(),
          vatNumber: data.vatNumber || "",
          vatDisclaimerAccepted: true,
          vatVerifiedAt: new Date(), // Manual "verification" based on local check
          logoUrl: data.photoUrl || "",
        };
        await tx.insert(companyProfiles)
          .values({ userId, ...profile })
          .onConflictDoUpdate({ target: companyProfiles.userId, set: profile });
      }
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Onboarding Database Error:", error);
    return { error: "Errore durante il salvataggio dei dati nel database." };
  }
}
