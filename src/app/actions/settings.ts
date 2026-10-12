"use server";

import { db } from "@/db";
import { users, professionalProfiles, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { publicUserColumns } from "@/db/safe-columns";
import { normalizeSkills } from "@/lib/skill-slugs";
import { getSkillCatalog } from "@/lib/skill-catalog";
import { requireUser } from "@/lib/auth-guard";
import { professionalDisplayName } from "@/lib/display-name";

export async function updateUserImageAction(url: string) {
  const authUser = await requireUser();
  if ("error" in authUser) return { error: authUser.error };

  const userId = authUser.id;
  const role = authUser.role;

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
  const authUser = await requireUser();
  if ("error" in authUser) return { error: authUser.error };

  const userId = authUser.id;
  
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: publicUserColumns,
      with: {
        professionalProfile: true,
        companyProfile: true,
      }
    });

    if (!user) return { error: "Utente non trovato" };

    return {
      success: true,
      data: {
        // Credentials users have users.name NULL: for professionals the name lives on the profile.
        name: user.role === "professional" ? professionalDisplayName(user, "") : user.name || "",
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
        // Slugs; the page shows them through the catalog labels
        skills: user.role === "professional"
          ? [...(user.professionalProfile?.topSkills || []), ...(user.professionalProfile?.secondarySkills || [])]
          : [],
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
  skills?: string[];
}) {
  const authUser = await requireUser();
  if ("error" in authUser) return { error: authUser.error };

  const userId = authUser.id;
  const role = authUser.role;

  try {
    // An empty name field never overwrites a stored name.
    const name = data.name?.trim().replace(/\s+/g, " ") || "";

    // 1. Update user name
    if (name) {
      await db.update(users)
        .set({ name })
        .where(eq(users.id, userId));
    }

    // 2. Update role-specific profile
    let savedSkills: string[] | undefined;
    if (role === "professional") {
      const [firstName, ...rest] = name.split(" ");
      const lastName = rest.join(" ");

      // Stored as slugs, like onboarding and jobs (discovery overlaps slug arrays).
      // Catalog labels map to their slug, free text is slugified the same way.
      if (data.skills) {
        savedSkills = normalizeSkills(data.skills, await getSkillCatalog());
      }

      await db.update(professionalProfiles)
        .set({ 
          bioLong: data.bio,
          title: data.title,
          ...(name ? { firstName, lastName: lastName || null } : {}),
          ...(savedSkills ? { topSkills: savedSkills.slice(0, 3), secondarySkills: savedSkills.slice(3) } : {}),
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
    return { success: true, skills: savedSkills };
  } catch (error) {
    console.error("Update User Settings Error:", error);
    return { error: "Errore durante l'aggiornamento delle impostazioni" };
  }
}
