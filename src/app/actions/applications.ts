"use server";

import { db } from "@/db";
import { jobApplications, jobs, matches, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail, sendInBackground } from "@/lib/mail";
import { MatchEmail } from "@/emails/MatchEmail";
import { ApplicationRejectedEmail } from "@/emails/ApplicationRejectedEmail";
import { companyWithProfile, professionalWithProfile } from "@/db/safe-columns";
import { requireUser } from "@/lib/auth-guard";
import { appUrl } from "@/lib/app-url";
import { companyDisplayName, professionalDisplayName } from "@/lib/display-name";

// The professional and the company of an application, for the emails that follow a decision.
function loadParties(professionalId: string, companyId: string) {
  return Promise.all([
    db.query.users.findFirst({ where: eq(users.id, professionalId), ...professionalWithProfile }),
    db.query.users.findFirst({ where: eq(users.id, companyId), ...companyWithProfile }),
  ]);
}

// Right swipe on a job.
export async function applyToJob(jobId: string) {
  const user = await requireUser("professional");
  if ("error" in user) return { error: user.error };
  const professionalId = user.id;

  try {
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.isActive, true)),
      columns: { id: true, companyId: true },
    });
    if (!job) return { error: "Ricerca non più disponibile" };

    const existingMatch = await db.query.matches.findFirst({
      where: and(eq(matches.professionalId, professionalId), eq(matches.jobId, jobId)),
      columns: { id: true },
    });
    if (existingMatch) return { error: "Hai già un match per questa ricerca" };

    // A double swipe (two tabs, double click) hits the unique key instead of creating a second row.
    const inserted = await db.insert(jobApplications)
      .values({ jobId, professionalId, status: "pending" })
      .onConflictDoNothing({ target: [jobApplications.jobId, jobApplications.professionalId] })
      .returning({ id: jobApplications.id });

    if (inserted.length === 0) return { error: "Ti sei già candidato a questa ricerca" };

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error applying to job:", error);
    return { error: "Errore durante la candidatura" };
  }
}

// Left swipe on a job: stored as 'passed' so the job doesn't come back in the feed.
export async function passJob(jobId: string) {
  const user = await requireUser("professional");
  if ("error" in user) return { error: user.error };

  try {
    await db.insert(jobApplications)
      .values({ jobId, professionalId: user.id, status: "passed" })
      .onConflictDoNothing({ target: [jobApplications.jobId, jobApplications.professionalId] });

    return { success: true };
  } catch (error) {
    console.error("Error passing job:", error);
    return { error: "Errore durante il salvataggio" };
  }
}

export async function getJobApplicants(jobId: string) {
  const user = await requireUser("company");
  if ("error" in user) return { error: user.error };

  try {
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.companyId, user.id)),
      columns: { id: true },
    });
    if (!job) return { error: "Ricerca non trovata" };

    const applicants = await db.query.jobApplications.findMany({
      // 'passed' rows are left swipes, not applications
      where: and(
        eq(jobApplications.jobId, jobId),
        inArray(jobApplications.status, ["pending", "accepted", "rejected"])
      ),
      with: { professional: professionalWithProfile },
      orderBy: (apps, { desc }) => [desc(apps.createdAt)],
    });

    return { success: true, data: applicants };
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return { error: "Errore durante il recupero dei candidati" };
  }
}

// Loads an application only if it belongs to one of the caller's jobs.
async function findOwnApplication(applicationId: string, companyId: string) {
  const application = await db.query.jobApplications.findFirst({
    where: eq(jobApplications.id, applicationId),
    with: { job: { columns: { companyId: true, title: true } } },
  });
  if (!application || application.job.companyId !== companyId) return null;
  return application;
}

export async function acceptApplicant(applicationId: string) {
  const user = await requireUser("company");
  if ("error" in user) return { error: user.error };
  const companyId = user.id;

  try {
    const application = await findOwnApplication(applicationId, companyId);
    if (!application) return { error: "Candidatura non trovata" };
    if (application.status !== "pending") return { error: "Questa candidatura è già stata gestita" };

    const newMatch = await db.transaction(async (tx) => {
      // The status check in the WHERE makes a concurrent second accept a no-op.
      const updated = await tx.update(jobApplications)
        .set({ status: "accepted" })
        .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.status, "pending")))
        .returning({ id: jobApplications.id });
      if (updated.length === 0) return null;

      const now = new Date();
      const [match] = await tx.insert(matches)
        .values({
          professionalId: application.professionalId,
          companyId,
          jobId: application.jobId,
          professionalStatus: "liked",
          companyStatus: "liked",
          matchedAt: now,
        })
        .onConflictDoUpdate({
          target: [matches.professionalId, matches.companyId, matches.jobId],
          set: { professionalStatus: "liked", companyStatus: "liked", matchedAt: now, updatedAt: now },
        })
        .returning();
      return match;
    });

    if (!newMatch) return { error: "Questa candidatura è già stata gestita" };

    // Match emails go out after the response; a failed lookup or email never undoes the match.
    try {
      const [professional, company] = await loadParties(application.professionalId, companyId);

      if (professional && company) {
        const profName = professionalDisplayName(professional);
        const compName = companyDisplayName(company);
        const matchUrl = appUrl(`/matches/${newMatch.id}`);

        sendInBackground(`match emails, match ${newMatch.id}`, [
          () => sendEmail({
            to: professional.email,
            subject: "Nuovo Match su Skillr!",
            react: MatchEmail({
              userName: profName,
              matchedName: compName,
              matchedImage: company.companyProfile?.logoUrl || undefined,
              role: "professional",
              matchUrl
            })
          }),
          () => sendEmail({
            to: company.email,
            subject: "Nuovo Match su Skillr!",
            react: MatchEmail({
              userName: compName,
              matchedName: profName,
              matchedImage: professional.professionalProfile?.photoUrl || undefined,
              role: "company",
              matchUrl
            })
          }),
        ]);
      }
    } catch (emailError) {
      console.error("Error sending match emails:", emailError);
    }

    revalidatePath(`/jobs/${application.jobId}`);
    revalidatePath("/matches");
    return { success: true, matchId: newMatch.id };
  } catch (error) {
    console.error("Error accepting applicant:", error);
    return { error: "Errore durante l'accettazione del candidato" };
  }
}

export async function rejectApplicant(applicationId: string) {
  const user = await requireUser("company");
  if ("error" in user) return { error: user.error };
  const companyId = user.id;

  try {
    const application = await findOwnApplication(applicationId, companyId);
    if (!application) return { error: "Candidatura non trovata" };
    if (application.status !== "pending") return { error: "Questa candidatura è già stata gestita" };

    const updated = await db.update(jobApplications)
      .set({ status: "rejected" })
      .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.status, "pending")))
      .returning({ id: jobApplications.id });
    if (updated.length === 0) return { error: "Questa candidatura è già stata gestita" };

    // Tell the professional, after the response. A failed email must not undo the rejection.
    try {
      const [professional, company] = await loadParties(application.professionalId, companyId);

      if (professional?.email) {
        const firstName = professional.professionalProfile?.firstName || professional.name || "";
        const compName = company ? companyDisplayName(company, "L'azienda") : "L'azienda";
        const dashboardUrl = appUrl("/dashboard");
        const jobTitle = application.job.title;

        sendInBackground(`application rejected, application ${applicationId}`, [
          () => sendEmail({
            to: professional.email,
            subject: `Aggiornamento sulla candidatura: ${jobTitle}`,
            react: ApplicationRejectedEmail({ firstName, companyName: compName, jobTitle, dashboardUrl }),
            text: `${compName} ha deciso di non proseguire con la tua candidatura per ${jobTitle}. Continua a cercare su Skillr: ${dashboardUrl}`,
          }),
        ]);
      }
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
    }

    revalidatePath(`/jobs/${application.jobId}`);
    revalidatePath("/matches");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting applicant:", error);
    return { error: "Errore durante il rifiuto del candidato" };
  }
}

