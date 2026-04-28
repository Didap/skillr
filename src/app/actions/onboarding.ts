"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function completeOnboardingAction(data: any) {
  console.log("--- Onboarding Action Started ---");
  console.log("Data received:", JSON.stringify(data, null, 2));

  const session = await auth();
  if (!session?.user?.id) {
    console.error("Onboarding Error: No session found");
    return { error: "Non autorizzato. Effettua il login." };
  }

  const userId = session.user.id;
  const { role } = data;
  
  if (!role) {
    console.error("Onboarding Error: Role missing");
    return { error: "Ruolo mancante." };
  }

  try {
    console.log(`Updating role for user ${userId} to ${role}...`);
    // 1. Update user role
    await db.update(users)
      .set({ role })
      .where(eq(users.id, userId));

    console.log(`Creating/Updating profile for ${role}...`);
    // 2. Create the specific profile
    if (role === "professional") {
      await db.insert(professionalProfiles).values({
        userId,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        title: data.title || "",
        photoUrl: data.photoUrl || "",
        topSkills: data.topSkills || [],
        clusters: data.selectedClusters || [],
        rateAmountEur: data.rateAmount ? parseInt(data.rateAmount) : 0,
        rateType: data.rateType || "daily",
        bioShort: data.bio || "",
      }).onConflictDoUpdate({
        target: professionalProfiles.userId,
        set: {
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          title: data.title || "",
          photoUrl: data.photoUrl || "",
          topSkills: data.topSkills || [],
          clusters: data.selectedClusters || [],
          rateAmountEur: data.rateAmount ? parseInt(data.rateAmount) : 0,
          rateType: data.rateType || "daily",
          bioShort: data.bio || "",
        }
      });
    } else if (role === "company") {
      await db.insert(companyProfiles).values({
        userId,
        companyName: data.companyName || "",
        vatNumber: data.vatNumber || "",
        logoUrl: data.photoUrl || "",
      }).onConflictDoUpdate({
        target: companyProfiles.userId,
        set: {
          companyName: data.companyName || "",
          vatNumber: data.vatNumber || "",
          logoUrl: data.photoUrl || "",
        }
      });
    }

    console.log("Onboarding completed successfully in DB");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Onboarding Database Error:", error);
    return { error: "Errore durante il salvataggio dei dati nel database." };
  }
}

