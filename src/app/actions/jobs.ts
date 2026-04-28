"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createJob(data: {
  title: string;
  description?: string;
  skills: string[];
  budgetMinEur: number;
  budgetMaxEur: number;
  rateType: "ral_annual" | "daily" | "hourly";
  location?: string;
  remoteOk?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const [newJob] = await db.insert(jobs).values({
      companyId: session.user.id,
      ...data,
    }).returning();

    revalidatePath("/jobs");
    return { success: true, data: newJob };
  } catch (error) {
    console.error("Error creating job:", error);
    return { error: "Errore durante la creazione della ricerca" };
  }
}

export async function getCompanyJobs() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const results = await db.query.jobs.findMany({
      where: (jobs, { eq }) => eq(jobs.companyId, session.user.id),
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    });
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return { error: "Errore durante il recupero delle ricerche" };
  }
}

export async function toggleJobStatus(jobId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    await db.update(jobs)
      .set({ isActive })
      .where(and(eq(jobs.id, jobId), eq(jobs.companyId, session.user.id)));
    
    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    console.error("Error toggling job status:", error);
    return { error: "Errore durante l'aggiornamento" };
  }
}

export async function deleteJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    await db.delete(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.companyId, session.user.id)));
    
    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    console.error("Error deleting job:", error);
    return { error: "Errore durante l'eliminazione" };
  }
}
