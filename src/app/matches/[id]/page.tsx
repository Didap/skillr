import Link from "next/link";
import { ArrowLeft, Mail, MapPin, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMatchDetail } from "@/app/actions/matches";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { BookingSection } from "@/components/matches/BookingSection";

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

  const match = res.data;
  const role = session.user.role as "professional" | "company";

  return (
    <div className="min-h-screen bg-surface flex flex-col selection:bg-primary/10 selection:text-primary">
      <header className="h-20 border-b border-border-subtle bg-white/80 backdrop-blur-md flex items-center px-6 shrink-0 sticky top-0 z-50">
        <div className="max-w-5xl w-full mx-auto flex items-center">
          <Link 
            href="/matches" 
            className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/5 transition-all mr-4"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display italic font-bold text-2xl text-text-primary tracking-tight">Dettaglio Match</h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 lg:p-12">
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
                        <img src={match.targetImage} alt={match.targetName} className="w-full h-full object-cover" />
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
                    <Button variant="outline" className="rounded-2xl h-12 border-border-strong bg-white hover:bg-surface-warm transition-all font-bold gap-2 shadow-sm">
                       Vedi Profilo <ExternalLink size={16} />
                    </Button>
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
                    Scheduling
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Content */}
            <div className="bg-white pb-8">
              <BookingSection 
                matchId={match.id}
                role={role}
                proposedSlots={match.proposedSlots.map((s: any) => ({
                  id: s.id,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  isAccepted: s.isAccepted
                }))}
                scheduledAt={match.scheduledAt}
                meetingLink={match.meetingLink}
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
  );
}
