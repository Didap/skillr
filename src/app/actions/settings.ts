"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, professionalProfiles, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserImageAction(url: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Non autorizzato" };
  }

  const userId = session.user.id;
  const role = session.user.role;

  try {
    // Update main user table
    await db.update(users)
      .set({ image: url })
      .where(eq(users.id, userId));

    // Update role-specific profile photo
    if (role === "professional") {
      await db.update(professionalProfiles)
        .set({ photoUrl: url })
        .where(eq(professionalProfiles.userId, userId));
    } else if (role === "company") {
      await db.update(companyProfiles)
        .set({ logoUrl: url })
        .where(eq(companyProfiles.userId, userId));
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update User Image Error:", error);
    return { error: "Errore durante l'aggiornamento dell'immagine" };
  }
}

export async function getUserSettingsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Non autorizzato" };
  }

  const userId = session.user.id;
  
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        professionalProfile: true,
        companyProfile: true,
      }
    });

    if (!user) return { error: "Utente non trovato" };

    return {
      success: true,
      data: {
        name: user.name || "",
        email: user.email,
        image: user.image || "",
        role: user.role,
        bio: user.role === "professional" 
          ? user.professionalProfile?.bioLong || "" 
          : user.companyProfile?.description || "",
        title: user.role === "professional" 
          ? user.professionalProfile?.title || "" 
          : "",
        companyName: user.role === "company" 
          ? user.companyProfile?.companyName || "" 
          : "",
      }
    };
  } catch (error) {
    console.error("Get User Settings Error:", error);
    return { error: "Errore durante il recupero delle impostazioni" };
  }
}

export async function updateUserSettingsAction(data: {
  name?: string;
  bio?: string;
  title?: string;
  companyName?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Non autorizzato" };
  }

  const userId = session.user.id;
  const role = session.user.role;

  try {
    // 1. Update user name
    if (data.name) {
      await db.update(users)
        .set({ name: data.name })
        .where(eq(users.id, userId));
    }

    // 2. Update role-specific profile
    if (role === "professional") {
      await db.update(professionalProfiles)
        .set({ 
          bioLong: data.bio,
          title: data.title,
          firstName: data.name?.split(' ')[0] || "",
          lastName: data.name?.split(' ').slice(1).join(' ') || "",
        })
        .where(eq(professionalProfiles.userId, userId));
    } else if (role === "company") {
      await db.update(companyProfiles)
        .set({ 
          description: data.bio,
          companyName: data.companyName,
        })
        .where(eq(companyProfiles.userId, userId));
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update User Settings Error:", error);
    return { error: "Errore durante l'aggiornamento delle impostazioni" };
  }
}
