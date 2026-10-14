"use server";

import { db } from "@/db";
import { users, professionalProfiles, matches, jobApplications, reviews } from "@/db/schema";
import { eq, and, desc, sql, isNull, inArray, notExists } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendEmail, sendInBackground } from "@/lib/mail";
import { MatchEmail } from "@/emails/MatchEmail";
import { publicUserColumns, companyWithProfile, professionalWithProfile } from "@/db/safe-columns";
import { getSkillLabelMap } from "@/lib/skill-catalog";
import { skillLabel } from "@/lib/skill-slugs";
import { formatRate } from "@/lib/utils";
import { requireUser } from "@/lib/auth-guard";
import { appUrl } from "@/lib/app-url";
import { companyDisplayName, professionalDisplayName } from "@/lib/display-name";
import { loadChatPreviews } from "@/lib/chat/summaries";
import type { ChatSummary } from "@/lib/chat/types";

const mutualLike = and(eq(matches.professionalStatus, "liked"), eq(matches.companyStatus, "liked"));

// The match list loads only what it renders: the counterpart, the call state and whether
// the viewer already left a review.
const listColumns = { id: true, matchedAt: true, scheduledAt: true, lastMessageAt: true, blockedById: true } as const;
const slotIds = { columns: { id: true } } as const;

// The match list is also the chat inbox: each row gets its conversation preview, and the
// most recent activity (last message, else the match itself) comes first.
async function withChatPreviews<T extends { id: string; matchedAt: Date | null; lastMessageAt: Date | null; blockedById: string | null }>(
  userId: string,
  list: T[]
) {
  const previews = await loadChatPreviews(userId, list.map((m) => m.id));
  const activity = (m: T) => (m.lastMessageAt ?? m.matchedAt)?.getTime() ?? 0;
  return [...list]
    .sort((a, b) => activity(b) - activity(a))
    .map((m) => {
      const { lastMessageAt, blockedById, ...row } = m;
      const chat: ChatSummary = {
        ...(previews.get(m.id) ?? { lastMessage: null, unread: 0 }),
        lastMessageAt: lastMessageAt?.toISOString() ?? null,
        blocked: blockedById !== null,
      };
      return { ...row, chat };
    });
}

async function loadMatchList(userId: string, role: string | null) {
  const viewerReview = { columns: { id: true }, where: eq(reviews.authorId, userId), limit: 1 } as const;
  const callState = (m: { id: string; matchedAt: Date | null; scheduledAt: Date | null; lastMessageAt: Date | null; blockedById: string | null; proposedSlots: unknown[]; reviews: unknown[] }) => ({
    id: m.id,
    matchedAt: m.matchedAt,
    status: "Match confermato",
    // Call state, used by the list to say what happens next
    proposedSlotCount: m.proposedSlots.length,
    scheduledAt: m.scheduledAt,
    hasReviewed: m.reviews.length > 0,
    lastMessageAt: m.lastMessageAt,
    blockedById: m.blockedById,
  });

  if (role === "company") {
    const rows = await db.query.matches.findMany({
      where: and(eq(matches.companyId, userId), mutualLike),
      columns: listColumns,
      with: {
        professional: {
          columns: { name: true, image: true },
          with: {
            professionalProfile: {
              columns: { firstName: true, lastName: true, title: true, photoUrl: true, averageRating: true, reviewCount: true },
            },
          },
        },
        proposedSlots: slotIds,
        reviews: viewerReview,
      },
      orderBy: [desc(matches.matchedAt)],
    });
    return withChatPreviews(userId, rows.map((m) => {
      const profile = m.professional?.professionalProfile;
      return {
        ...callState(m),
        targetName: professionalDisplayName(m.professional),
        targetTitle: profile?.title ?? null,
        targetImage: profile?.photoUrl || m.professional?.image || null,
        targetRating: profile?.averageRating || "0.0",
        targetReviewCount: profile?.reviewCount || 0,
      };
    }));
  }

  const rows = await db.query.matches.findMany({
    where: and(eq(matches.professionalId, userId), mutualLike),
    columns: listColumns,
    with: {
      company: {
        columns: { name: true, image: true },
        with: {
          companyProfile: { columns: { companyName: true, logoUrl: true, averageRating: true, reviewCount: true } },
        },
      },
      job: { columns: { title: true } },
      proposedSlots: slotIds,
      reviews: viewerReview,
    },
    orderBy: [desc(matches.matchedAt)],
  });
  return withChatPreviews(userId, rows.map((m) => {
    const profile = m.company?.companyProfile;
    return {
      ...callState(m),
      targetName: companyDisplayName(m.company),
      targetTitle: m.job?.title || "Opportunità IT",
      targetImage: profile?.logoUrl || m.company?.image || null,
      targetRating: profile?.averageRating || "0.0",
      targetReviewCount: profile?.reviewCount || 0,
    };
  }));
}

// Applications the professional is still waiting on, or that were turned down.
// Accepted ones are already in the match list; 'passed' ones are left swipes, not applications.
async function loadMyApplications(professionalId: string) {
  const applications = await db.query.jobApplications.findMany({
    where: and(
      eq(jobApplications.professionalId, professionalId),
      inArray(jobApplications.status, ["pending", "rejected"])
    ),
    columns: { id: true, status: true, createdAt: true },
    with: {
      job: {
        columns: { title: true, location: true, remoteOk: true },
        with: {
          company: {
            columns: { name: true, image: true },
            with: { companyProfile: { columns: { companyName: true, logoUrl: true } } },
          },
        },
      },
    },
    orderBy: (apps, { desc }) => [desc(apps.createdAt)],
  });

  return applications.map((a) => ({
    id: a.id,
    status: a.status as "pending" | "rejected",
    createdAt: a.createdAt,
    jobTitle: a.job.title,
    location: a.job.location || (a.job.remoteOk ? "Remote" : null),
    companyName: companyDisplayName(a.job.company),
    companyLogo: a.job.company?.companyProfile?.logoUrl || a.job.company?.image || null,
  }));
}

// Each half of the /matches page fails on its own, as when they were two separate calls.
async function settle<T>(promise: Promise<T>, error: string, log: string): Promise<{ success: true; data: T } | { success?: undefined; error: string }> {
  try {
    return { success: true, data: await promise };
  } catch (e) {
    console.error(log, e);
    return { error };
  }
}

/** The /matches page in one call: the match list and, for professionals, their applications. */
export async function getMatches() {
  const user = await requireUser();
  if ("error" in user) return { error: user.error };

  const [matchList, applications] = await Promise.all([
    settle(loadMatchList(user.id, user.role), "Errore durante il caricamento dei match", "Error fetching matches:"),
    user.role === "professional"
      ? settle(loadMyApplications(user.id), "Errore durante il caricamento delle candidature", "Error fetching my applications:")
      : undefined,
  ]);

  if (!matchList.success) return { error: matchList.error, applications };
  return { success: true as const, data: matchList.data, applications };
}

export async function getPotentialMatches() {
  const user = await requireUser();
  if ("error" in user || !user.role) return { error: "Non autorizzato" };

  const userId = user.id;
  const role = user.role;

  try {
    if (role === "company") {
      const [potentialProfessionals, labelBySlug] = await Promise.all([
        db.query.professionalProfiles.findMany({
          // Professionals this company already has any match row with (swipe or job match) are excluded
          where: (p) => notExists(
            db.select({ id: matches.id })
              .from(matches)
              .where(and(eq(matches.companyId, userId), eq(matches.professionalId, p.userId)))
          ),
          with: {
            user: { columns: { name: true, image: true } }
          },
          // Newest members first. Raw alias: the relational query renames the root table.
          orderBy: (p, { desc, asc }) => [
            desc(sql`(select "u"."created_at" from "user" "u" where "u"."id" = ${p.userId})`),
            asc(p.userId),
          ],
          limit: 20,
        }),
        getSkillLabelMap(),
      ]);

      return {
        success: true,
        data: potentialProfessionals.map(p => ({
          id: p.userId,
          name: p.firstName ? `${p.firstName} ${p.lastName}` : p.user?.name || "Professionista",
          title: p.title || "Esperto IT",
          rate: p.rateAmountEur ? formatRate(p.rateType, p.rateAmountEur) : "Tariffa non indicata",
          location: p.city || "Remote",
          skills: (p.topSkills || []).map(s => skillLabel(s, labelBySlug)),
          image: p.photoUrl || p.user?.image,
          bioShort: p.bioShort || "",
          type: "professional" as const,
          rating: p.averageRating || "0.0",
        }))
      };

    } else if (role === "professional") {
      // Get professional profile to filter by skills
      const [profile, labelBySlug] = await Promise.all([
        db.query.professionalProfiles.findFirst({
          where: eq(professionalProfiles.userId, userId),
          columns: { topSkills: true, secondarySkills: true },
        }),
        getSkillLabelMap(),
      ]);

      if (!profile) return { error: "Profilo non trovato" };

      const userSkills = [
        ...(profile.topSkills || []),
        ...(profile.secondarySkills || [])
      ];

      // Active jobs matching the skills, minus the ones already applied to, passed on
      // (left swipe) or matched.
      const potentialJobs = await db.query.jobs.findMany({
        where: (j) => and(
          eq(j.isActive, true),
          notExists(
            db.select({ id: jobApplications.id })
              .from(jobApplications)
              .where(and(eq(jobApplications.professionalId, userId), eq(jobApplications.jobId, j.id)))
          ),
          notExists(
            db.select({ id: matches.id })
              .from(matches)
              .where(and(eq(matches.professionalId, userId), eq(matches.jobId, j.id)))
          ),
          userSkills.length > 0
            ? sql`${j.skills} && ARRAY[${sql.join(userSkills.map(s => sql`${s}`), sql`, `)}]::text[]`
            : undefined
        ),
        with: {
          company: {
            columns: { image: true },
            with: { companyProfile: { columns: { companyName: true, logoUrl: true } } }
          }
        },
        orderBy: (j, { desc }) => [desc(j.createdAt), desc(j.id)],
        limit: 20,
      });

      return {
        success: true,
        data: potentialJobs.map(j => ({
          id: j.id,
          name: j.title,
          title: j.company?.companyProfile?.companyName || "Azienda IT",
          rate: formatRate(j.rateType, j.budgetMinEur, j.budgetMaxEur),
          location: j.location || "Remote",
          skills: (j.skills || []).map(s => skillLabel(s, labelBySlug)),
          image: j.company?.companyProfile?.logoUrl || j.company?.image,
          bioShort: j.description || "",
          type: "job" as const,
          jobId: j.id,
          remoteOk: j.remoteOk || false,
        }))
      };
    }
    return { error: "Ruolo non valido" };
  } catch (error) {
    console.error("Error fetching matches:", error);
    return { error: "Errore durante il caricamento" };
  }
}

export type MatchParty = { name: string; image: string | null; detail: string | null };
export type MatchParties = { professional: MatchParty; company: MatchParty };

type MatchUser = NonNullable<Awaited<ReturnType<typeof findUserWithProfiles>>>;
const findUserWithProfiles = (id: string) =>
  db.query.users.findFirst({ where: eq(users.id, id), columns: publicUserColumns, with: { professionalProfile: true, companyProfile: true } });

export async function recordSwipe(targetId: string, targetType: "professional" | "company", direction: "left" | "right") {
  const user = await requireUser();
  if ("error" in user || !user.role) return { error: "Non autorizzato" };

  const userId = user.id;
  const role = user.role;
  const status = direction === "right" ? "liked" : "passed";

  try {
    // Swipe rows are the ones without a job; job matches are created by acceptApplicant.
    const filter = role === 'company'
      ? and(eq(matches.companyId, userId), eq(matches.professionalId, targetId), isNull(matches.jobId))
      : and(eq(matches.professionalId, userId), eq(matches.companyId, targetId), isNull(matches.jobId));

    const existingMatch = await db.query.matches.findFirst({ where: filter });

    if (existingMatch) {
      const updates = role === 'company'
        ? { companyStatus: status as "liked" | "passed" }
        : { professionalStatus: status as "liked" | "passed" };

      const isMatch = (status === 'liked' && (role === 'company' ? existingMatch.professionalStatus === 'liked' : existingMatch.companyStatus === 'liked'));

      // On a match both sides are loaded first: the match screen needs them, and a missing
      // user means the match can't be shown, so nothing is written.
      let pair: { me: MatchUser; target: MatchUser } | null = null;
      if (isMatch) {
        const [me, target] = await Promise.all([findUserWithProfiles(userId), findUserWithProfiles(targetId)]);
        if (!me || !target) return { error: "Profilo non trovato" };
        pair = { me, target };
      }

      await db.update(matches)
        .set({ ...updates, matchedAt: isMatch ? new Date() : existingMatch.matchedAt })
        .where(eq(matches.id, existingMatch.id));

      revalidatePath("/dashboard");
      revalidatePath("/matches");

      if (!pair) return { success: true, isMatch: false as const, matchId: existingMatch.id };

      const { me, target } = pair;
      const pro = me.role === "company" ? target : me;
      const company = me.role === "company" ? me : target;
      // Both sides for the match screen, whichever of the two swiped last
      const parties: MatchParties = {
        professional: {
          name: professionalDisplayName(pro),
          image: pro.professionalProfile?.photoUrl || pro.image || null,
          detail: pro.professionalProfile?.title || null,
        },
        company: {
          name: companyDisplayName(company),
          image: company.companyProfile?.logoUrl || company.image || null,
          detail: company.companyProfile?.industry || null,
        },
      };

      // Match emails go out after the response
      try {
        const nameOf = (u: MatchUser) =>
          u.role === "company" ? companyDisplayName(u, "Utente") : professionalDisplayName(u, "Utente");
        const userName = nameOf(me);
        const targetName = nameOf(target);

        const userImage = me.role === 'company' ? me.companyProfile?.logoUrl : me.professionalProfile?.photoUrl;
        const targetImage = target.role === 'company' ? target.companyProfile?.logoUrl : target.professionalProfile?.photoUrl;

        const matchUrl = appUrl(`/matches/${existingMatch.id}`);

        sendInBackground(`match emails, match ${existingMatch.id}`, [
          () => sendEmail({
            to: me.email,
            subject: "Nuovo Match su Helllo!",
            react: MatchEmail({
              userName,
              matchedName: targetName,
              matchedImage: targetImage || undefined,
              role: me.role as 'professional' | 'company',
              matchUrl
            })
          }),
          () => sendEmail({
            to: target.email,
            subject: "Nuovo Match su Helllo!",
            react: MatchEmail({
              userName: targetName,
              matchedName: userName,
              matchedImage: userImage || undefined,
              role: target.role as 'professional' | 'company',
              matchUrl
            })
          }),
        ]);
      } catch (emailError) {
        console.error("Error sending match emails:", emailError);
      }

      return { success: true, isMatch: true as const, matchId: existingMatch.id, parties };
    } else {
      const ownStatus = status as "liked" | "passed";
      // A concurrent swipe on the same pair lands on the unique key: keep this side's choice.
      const newMatch = await db.insert(matches).values({
        companyId: role === 'company' ? userId : targetId,
        professionalId: role === 'professional' ? userId : targetId,
        companyStatus: role === 'company' ? ownStatus : 'pending',
        professionalStatus: role === 'professional' ? ownStatus : 'pending',
      })
        .onConflictDoUpdate({
          // Swipe rows (no job) are unique per pair through a partial index
          target: [matches.professionalId, matches.companyId],
          targetWhere: sql`${matches.jobId} is null`,
          set: role === 'company' ? { companyStatus: ownStatus } : { professionalStatus: ownStatus },
        })
        .returning({ id: matches.id });

      return { success: true, isMatch: false as const, matchId: newMatch[0].id };
    }
  } catch (error) {
    console.error("Error recording swipe:", error);
    return { error: "Errore salvataggio" };
  }
}

export async function getMatchDetail(matchId: string) {
  const user = await requireUser();
  if ("error" in user) return { error: user.error };

  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        professional: professionalWithProfile,
        company: companyWithProfile,
        job: true,
        proposedSlots: true,
        reviews: true,
      },
    });

    if (!match) return { error: "Match non trovato" };

    // Check authorization: must be either the professional or the company
    if (match.professionalId !== user.id && match.companyId !== user.id) {
      return { error: "Non autorizzato a vedere questo match" };
    }

    const isCompanyView = user.role === 'company';
    const targetUser = isCompanyView ? match.professional : match.company;
    const professionalProfile = match.professional?.professionalProfile;

    const hasReviewed = match.reviews.some(r => r.authorId === user.id);

    return {
      success: true,
      data: {
        ...match,
        targetId: targetUser?.id,
        targetName: isCompanyView
          ? professionalDisplayName(match.professional, "Utente")
          : companyDisplayName(match.company, "Utente"),
        targetTitle: isCompanyView ? professionalProfile?.title : (match.job?.title || "Opportunità IT"),
        targetImage: isCompanyView
          ? (professionalProfile?.photoUrl || match.professional?.image)
          : (match.company?.companyProfile?.logoUrl || match.company?.image),
        targetEmail: targetUser?.email,
        targetBio: isCompanyView
          ? (professionalProfile?.bioShort || "")
          : (match.company?.companyProfile?.description || ""),
        targetSkills: isCompanyView ? (professionalProfile?.topSkills || []) : [],
        targetRate: isCompanyView
          ? (professionalProfile?.rateAmountEur ? formatRate(professionalProfile.rateType, professionalProfile.rateAmountEur) : null)
          : (match.job?.budgetMinEur ? formatRate(match.job.rateType, match.job.budgetMinEur, match.job.budgetMaxEur) : null),
        hasReviewed,
      }
    };
  } catch (error) {
    console.error("Error fetching match detail:", error);
    return { error: "Errore durante il caricamento del dettaglio" };
  }
}
