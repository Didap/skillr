"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { jobApplications, matches, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { MatchEmail } from "@/emails/MatchEmail";

export async function applyToJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    // Check if already applied
    const existing = await db.query.jobApplications.findFirst({
      where: and(
        eq(jobApplications.jobId, jobId),
        eq(jobApplications.professionalId, session.user.id)
      ),
    });

    if (existing) return { error: "Ti sei già candidato a questa ricerca" };

    await db.insert(jobApplications).values({
      jobId,
      professionalId: session.user.id,
      status: "pending",
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error applying to job:", error);
    return { error: "Errore durante la candidatura" };
  }
}

export async function getJobApplicants(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const applicants = await db.query.jobApplications.findMany({
      where: eq(jobApplications.jobId, jobId),
      with: {
        professional: {
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

export async function acceptApplicant(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const application = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, applicationId),
      with: {
        job: true,
      },
    });

    if (!application) return { error: "Candidatura non trovata" };

    // Update application status
    await db.update(jobApplications)
      .set({ status: "accepted" })
      .where(eq(jobApplications.id, applicationId));

    // Create match
    const [newMatch] = await db.insert(matches).values({
      professionalId: application.professionalId,
      companyId: session.user.id,
      jobId: application.jobId,
      professionalStatus: "liked",
      companyStatus: "liked",
      matchedAt: new Date(),
    }).returning();

    // Send Emails
    try {
      const [professional, company] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, application.professionalId),
          with: { professionalProfile: true }
        }),
        db.query.users.findFirst({
          where: eq(users.id, session.user.id),
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
  if (!session?.user?.id) return { error: "Non autorizzato" };

  try {
    const application = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.id, applicationId),
    });

    if (!application) return { error: "Candidatura non trovata" };

    await db.update(jobApplications)
      .set({ status: "rejected" })
      .where(eq(jobApplications.id, applicationId));

    revalidatePath(`/jobs/${application.jobId}`);
    return { success: true };
  } catch (error) {
    console.error("Error rejecting applicant:", error);
    return { error: "Errore durante il rifiuto del candidato" };
  }
}
