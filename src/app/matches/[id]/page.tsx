import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, MapPin, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMatchDetail } from "@/app/actions/matches";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { BookingSection } from "@/components/matches/BookingSection";

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
  proposedSlots: ProposedSlot[];
  scheduledAt: Date | null;
  meetingLink: string | null;
  hasReviewed: boolean;
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const res = await getMatchDetail(id);
  
  if (res.error || !res.data) {
    notFound();
  }

  const match = res.data as MatchDetail;
  const role = session.user.role as "professional" | "company";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-24 border-b border-border-subtle bg-white/80 backdrop-blur-md flex items-center justify-between px-10 shrink-0 sticky top-0 z-50">
        <div>
           <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">Dettaglio Match</h1>
           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">Gestisci la tua intervista</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Sidebar handles navigation now */}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-5xl w-full mx-auto p-6 md:p-8 lg:p-12">
        <div className="space-y-8">
          {/* Profile Section */}
          <section className="bg-white rounded-[2.5rem] border border-border-subtle shadow-premium overflow-hidden">
            <div className="relative">
              {/* Decorative background element */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              
              <div className="relative p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center">
                  <div className="relative shrink-0">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-surface-warm border border-border-subtle shadow-sm overflow-hidden flex items-center justify-center">
                      {match.targetImage ? (
                        <Image src={match.targetImage} alt={match.targetName} width={160} height={160} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-display text-6xl font-bold italic">
                          {match.targetName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-md">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>

                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                           <Zap size={10} fill="currentColor" /> Match Confermato
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display italic font-bold text-text-primary tracking-tight">
                          {match.targetName}
                        </h2>
                        <p className="text-xl md:text-2xl text-primary font-medium opacity-90 italic">
                          {match.targetTitle}
                        </p>
                      </div>

                      {match.targetBio && (
                        <p className="text-text-secondary leading-relaxed max-w-2xl">
                          {match.targetBio}
                        </p>
                      )}

                      {match.targetSkills && match.targetSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {match.targetSkills.map((skill: string) => (
                            <div key={skill} className="px-3 py-1 rounded-lg bg-surface-warm text-text-secondary text-xs font-bold border border-border-subtle">
                              {skill}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-surface-warm/50 px-4 py-2 rounded-2xl text-sm font-semibold text-text-secondary border border-border-subtle">
                          <MapPin size={16} className="text-primary" /> 
                          {role === 'company' ? 'Remote / Disponibile' : 'Remote OK'}
                        </div>
                        {match.targetEmail && (
                          <div className="flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-2xl text-sm font-bold italic border border-primary/10">
                             <Mail size={16} /> 
                             {match.targetEmail}
                          </div>
                        )}
                      </div>
                    </div>

                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <Link href={`/profile/${match.targetId}`}>
                      <Button variant="outline" className="rounded-2xl h-12 w-full border-border-strong bg-white hover:bg-surface-warm transition-all font-bold gap-2 shadow-sm">
                         Vedi Profilo <ExternalLink size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator with Badge */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center px-12">
                <div className="w-full border-t border-border-subtle/50" />
              </div>
              <div className="relative flex justify-center">
                <div className="bg-white px-6">
                  <div className="px-4 py-1.5 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                    Scheduling & Feedback
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Content */}
            <div className="bg-white pb-8">
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
                targetId={match.targetId}
                targetName={match.targetName}
              />
            </div>
          </section>
          
          <footer className="text-center pb-12">
            <p className="text-xs font-bold text-text-muted uppercase tracking-[0.3em]">
              Skillr © 2026 — Zero Messaggi, Solo Match.
            </p>
          </footer>
        </div>
      </main>
      </div>
    </div>
  );
}
