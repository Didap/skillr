"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { JobData } from "@/types/job";

export async function createJob(data: JobData) {
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
      with: {
        matches: {
          where: (matches, { and, eq }) => and(
            eq(matches.professionalStatus, 'liked'),
            eq(matches.companyStatus, 'liked')
          )
        }
      },
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    });

    // Map results to include the match count
    const dataWithStats = results.map(job => ({
      ...job,
      matchCount: job.matches.length
    }));

    return { success: true, data: dataWithStats };
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

export async function updateJob(jobId: string, data: JobData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const [updatedJob] = await db.update(jobs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, jobId), eq(jobs.companyId, session.user.id)))
      .returning();

    if (!updatedJob) return { error: "Ricerca non trovata o non autorizzato" };

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    
    return { success: true, data: updatedJob };
  } catch (error) {
    console.error("Error updating job:", error);
    return { error: "Errore durante l'aggiornamento della ricerca" };
  }
}

export async function getJobById(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.companyId, session.user.id)),
    });

    if (!job) return { error: "Ricerca non trovata" };

    return { success: true, data: job };
  } catch (error) {
    console.error("Error fetching job:", error);
    return { error: "Errore durante il recupero della ricerca" };
  }
}
