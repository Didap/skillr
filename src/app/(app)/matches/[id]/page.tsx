import Link from "next/link";
import Image from "next/image";
import { Banknote, Mail, MapPin, ExternalLink, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { LogoMark } from "@/components/brand/LogoMark";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { getMatchDetail } from "@/app/actions/matches";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { BookingSection } from "@/components/matches/BookingSection";
import { getSkillLabelMap } from "@/lib/skill-catalog";
import { skillLabel } from "@/lib/skill-slugs";
import { getMessages } from "@/app/actions/chat";
import { ChatThread } from "@/components/chat/ChatThread";
import { MatchDetailLayout } from "@/components/matches/MatchDetailLayout";

interface ProposedSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAccepted: boolean;
}

interface MatchDetail {
  id: string;
  targetId: string;
  targetName: string;
  targetTitle: string | null;
  targetImage: string | null;
  targetEmail: string | null;
  targetBio: string | null;
  targetSkills: string[] | null;
  targetRate: string | null;
  proposedSlots: ProposedSlot[];
  scheduledAt: Date | null;
  meetingLink: string | null;
  hasReviewed: boolean;
  // Spread from the match row by getMatchDetail, used for the location badge.
  professional?: { professionalProfile?: { city: string | null; remoteOk: boolean | null } | null } | null;
  company?: { companyProfile?: { city: string | null } | null } | null;
  job?: { location: string | null; remoteOk: boolean | null } | null;
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Independent queries: the skill labels don't wait on the match lookup
  const [res, labelBySlug, thread] = await Promise.all([getMatchDetail(id), getSkillLabelMap(), getMessages(id)]);

  if ("error" in res || !res.data) {
    notFound();
  }

  const match = res.data as MatchDetail;
  const role = session.user.role as "professional" | "company";

  // No thread for matches that aren't mutual (getMessages refuses them): details only
  const chat = "error" in thread ? null : (
    <ChatThread matchId={match.id} viewerId={session.user.id} otherName={match.targetName} initial={thread.data} />
  );

  // Companies see where the professional works from; professionals see the job's location.
  const location = role === 'company'
    ? { city: match.professional?.professionalProfile?.city, remoteOk: match.professional?.professionalProfile?.remoteOk }
    : { city: match.job?.location || match.company?.companyProfile?.city, remoteOk: match.job?.remoteOk };
  const locationLabel = [location.city, location.remoteOk ? 'Remoto OK' : null].filter(Boolean).join(' · ');
  // Same colour code as the feed: professionals on blu, companies on viola
  const block = role === 'company' ? 'bg-blu' : 'bg-viola';

  return (
    <>
      <PageHeader
        backHref="/matches"
        title={match.targetName}
        subtitle="Chat e colloquio"
        actions={
          <>
            <Link
              href={`/profile/${match.targetId}`}
              aria-label="Vedi profilo"
              className="md:hidden pressable size-11 -mr-1 rounded-full border border-viola bg-white flex items-center justify-center text-viola hover:bg-crema"
            >
              <UserRound size={21} strokeWidth={1.75} />
            </Link>
            <Link
              href={`/profile/${match.targetId}`}
              className={cn(buttonVariants({ variant: "outline" }), "hidden md:inline-flex h-12 px-5 text-base gap-2")}
            >
              Vedi profilo <ExternalLink size={16} strokeWidth={1.75} />
            </Link>
          </>
        }
      />

      <MatchDetailLayout
        chat={chat}
        details={
            <PageBody className="custom-scrollbar">
              <main className="max-w-5xl w-full mx-auto px-4 py-5 md:p-8 lg:p-12">
                {/* Phones: two stacked blocks (profile card, then scheduling). Desktop: one card. */}
                <div className="md:bg-white md:rounded-card md:border md:border-viola/15 md:overflow-hidden">
                  {/* Profile summary: the colour block of the match card */}
                  <section
                    aria-label={`Profilo di ${match.targetName}`}
                    className={cn("rounded-card md:rounded-none text-white", block)}
                  >
                    <div className="p-6 md:p-12">
                      <div className="flex flex-row gap-4 md:gap-10 items-center">
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 md:w-36 md:h-36 rounded-[1.25rem] md:rounded-card bg-crema overflow-hidden flex items-center justify-center">
                            {match.targetImage ? (
                              <Image src={match.targetImage} alt={match.targetName} width={144} height={144} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-viola text-3xl md:text-display font-bold">
                                {match.targetName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <LogoMark className="absolute -bottom-2 -right-2 size-9 md:size-12" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                          <div className="hidden md:inline-flex items-center gap-2 rounded-full bg-rosso px-4 h-8 text-chip font-bold text-white mb-1">
                            <span aria-hidden className="size-2 rounded-full bg-white" /> Match confermato
                          </div>
                          <h2 className="text-title md:text-display break-words line-clamp-2">
                            {match.targetName}
                          </h2>
                          {match.targetTitle && (
                            <p className="text-body md:text-xl font-medium text-rosa leading-snug break-words line-clamp-2">
                              {match.targetTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 md:mt-8 md:pl-46 space-y-5 md:space-y-6">
                        {match.targetBio && (
                          <p className="font-prompt text-xl leading-7 font-medium max-w-2xl break-words">
                            {match.targetBio}
                          </p>
                        )}

                        {match.targetSkills && match.targetSkills.length > 0 && (
                          <ul className="flex flex-wrap gap-2" aria-label="Competenze">
                            {match.targetSkills.map((skill: string) => (
                              <li key={skill} className="max-w-full rounded-full bg-rosa px-4 py-2 text-chip text-viola break-words">
                                {skillLabel(skill, labelBySlug)}
                              </li>
                            ))}
                          </ul>
                        )}

                        {(locationLabel || match.targetRate || match.targetEmail) && (
                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-body">
                            {locationLabel && (
                              <div className="flex items-center gap-2 max-w-full">
                                <MapPin size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
                                <span className="min-w-0 break-words">{locationLabel}</span>
                              </div>
                            )}
                            {match.targetRate && (
                              <div className="flex items-center gap-2 max-w-full">
                                <Banknote size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
                                <span className="min-w-0 break-words">{match.targetRate}</span>
                              </div>
                            )}
                            {match.targetEmail && (
                              <div className="flex items-center gap-2 max-w-full">
                                <Mail size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
                                <span className="min-w-0 break-all">{match.targetEmail}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Separator with label (desktop) */}
                  <div className="relative hidden md:block pt-8" aria-hidden="true">
                    <div className="absolute inset-x-12 top-1/2 border-t border-viola/15" />
                    <div className="relative flex justify-center">
                      <div className="bg-white px-4">
                        <div className="rounded-full bg-rosa px-4 py-2 text-chip text-viola">Colloquio e feedback</div>
                      </div>
                    </div>
                  </div>

                  {/* Scheduling & feedback */}
                  <section aria-label="Pianificazione e feedback" className="mt-6 md:mt-0 md:bg-white md:pb-8">
                    <BookingSection
                      matchId={match.id}
                      role={role}
                      proposedSlots={match.proposedSlots.map((s: ProposedSlot) => ({
                        id: s.id,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        isAccepted: s.isAccepted
                      }))}
                      scheduledAt={match.scheduledAt}
                      meetingLink={match.meetingLink}
                      hasReviewed={match.hasReviewed}
                      targetName={match.targetName}
                    />
                  </section>
                </div>

                <footer className="hidden md:flex items-center justify-center gap-2 py-12 text-label text-viola-400">
                  <Logo className="h-4 text-viola-400" />
                  <span>© 2026 · Dal match alla call.</span>
                </footer>
              </main>
            </PageBody>
        }
      />
    </>
  );
}
