"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { jobApplications, jobs, matches, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { MatchEmail } from "@/emails/MatchEmail";
import { publicUserColumns } from "@/db/safe-columns";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Right swipe on a job.
export async function applyToJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "professional") return { error: "Non autorizzato" };
  const professionalId = session.user.id;

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
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "professional") return { error: "Non autorizzato" };

  try {
    await db.insert(jobApplications)
      .values({ jobId, professionalId: session.user.id, status: "passed" })
      .onConflictDoNothing({ target: [jobApplications.jobId, jobApplications.professionalId] });

    return { success: true };
  } catch (error) {
    console.error("Error passing job:", error);
    return { error: "Errore durante il salvataggio" };
  }
}

// Applications the professional is still waiting on, or that were turned down.
// Accepted ones are already in the match list; 'passed' ones are left swipes, not applications.
export async function getMyApplications() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "professional") return { error: "Non autorizzato" };

  try {
    const applications = await db.query.jobApplications.findMany({
      where: and(
        eq(jobApplications.professionalId, session.user.id),
        inArray(jobApplications.status, ["pending", "rejected"])
      ),
      with: {
        job: {
          columns: { id: true, title: true, location: true, remoteOk: true },
          with: {
            company: {
              columns: publicUserColumns,
              with: { companyProfile: true },
            },
          },
        },
      },
      orderBy: (apps, { desc }) => [desc(apps.createdAt)],
    });

    return {
      success: true,
      data: applications.map((a) => ({
        id: a.id,
        status: a.status as "pending" | "rejected",
        createdAt: a.createdAt,
        jobTitle: a.job.title,
        location: a.job.location || (a.job.remoteOk ? "Remote" : null),
        companyName: a.job.company?.companyProfile?.companyName || a.job.company?.name || "Azienda",
        companyLogo: a.job.company?.companyProfile?.logoUrl || a.job.company?.image || null,
      })),
    };
  } catch (error) {
    console.error("Error fetching my applications:", error);
    return { error: "Errore durante il caricamento delle candidature" };
  }
}

export async function getJobApplicants(jobId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") return { error: "Non autorizzato" };

  try {
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.companyId, session.user.id)),
      columns: { id: true },
    });
    if (!job) return { error: "Ricerca non trovata" };

    const applicants = await db.query.jobApplications.findMany({
      // 'passed' rows are left swipes, not applications
      where: and(
        eq(jobApplications.jobId, jobId),
        inArray(jobApplications.status, ["pending", "accepted", "rejected"])
      ),
      with: {
        professional: {
          columns: publicUserColumns,
          with: {
            professionalProfile: true,
          },
        },
      },
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
    with: { job: true },
  });
  if (!application || application.job.companyId !== companyId) return null;
  return application;
}

export async function acceptApplicant(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") return { error: "Non autorizzato" };
  const companyId = session.user.id;

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

    // Send Emails
    try {
      const [professional, company] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, application.professionalId),
          columns: publicUserColumns,
          with: { professionalProfile: true }
        }),
        db.query.users.findFirst({
          where: eq(users.id, companyId),
          columns: publicUserColumns,
          with: { companyProfile: true }
        })
      ]);

      if (professional && company) {
        const profName = `${professional.professionalProfile?.firstName || ""} ${professional.professionalProfile?.lastName || ""}`.trim() || professional.name || "Professionista";
        const compName = company.companyProfile?.companyName || company.name || "Azienda";
        const matchUrl = `${process.env.NEXTAUTH_URL}/matches/${newMatch.id}`;

        await Promise.all([
          sendEmail({
            to: professional.email!,
            subject: "Nuovo Match su Skillr!",
            react: MatchEmail({
              userName: profName,
              matchedName: compName,
              matchedImage: company.companyProfile?.logoUrl || undefined,
              role: "professional",
              matchUrl
            })
          }),
          sendEmail({
            to: company.email!,
            subject: "Nuovo Match su Skillr!",
            react: MatchEmail({
              userName: compName,
              matchedName: profName,
              matchedImage: professional.professionalProfile?.photoUrl || undefined,
              role: "company",
              matchUrl
            })
          })
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
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") return { error: "Non autorizzato" };
  const companyId = session.user.id;

  try {
    const application = await findOwnApplication(applicationId, companyId);
    if (!application) return { error: "Candidatura non trovata" };
    if (application.status !== "pending") return { error: "Questa candidatura è già stata gestita" };

    const updated = await db.update(jobApplications)
      .set({ status: "rejected" })
      .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.status, "pending")))
      .returning({ id: jobApplications.id });
    if (updated.length === 0) return { error: "Questa candidatura è già stata gestita" };

    // Tell the professional. A failed email must not undo the rejection.
    try {
      const [professional, company] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, application.professionalId),
          columns: publicUserColumns,
          with: { professionalProfile: true },
        }),
        db.query.users.findFirst({
          where: eq(users.id, companyId),
          columns: publicUserColumns,
          with: { companyProfile: true },
        }),
      ]);

      if (professional?.email) {
        const firstName = professional.professionalProfile?.firstName || professional.name || "";
        const compName = company?.companyProfile?.companyName || company?.name || "L'azienda";
        const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`;

        await sendEmail({
          to: professional.email,
          subject: `Aggiornamento sulla candidatura: ${application.job.title}`,
          html: `
            <p>Ciao${firstName ? ` ${escapeHtml(firstName)}` : ""},</p>
            <p>${escapeHtml(compName)} ha deciso di non proseguire con la tua candidatura per <strong>${escapeHtml(application.job.title)}</strong>.</p>
            <p>Ci sono altre ricerche in linea con il tuo profilo: <a href="${dashboardUrl}">continua a cercare su Skillr</a>.</p>
            <p>Il team Skillr</p>
          `,
          text: `${compName} ha deciso di non proseguire con la tua candidatura per ${application.job.title}. Continua a cercare su Skillr: ${dashboardUrl}`,
        });
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

