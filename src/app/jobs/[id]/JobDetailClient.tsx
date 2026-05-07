"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Briefcase, 
  MapPin, 
  Laptop, 
  Users, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Star,
  Zap,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { acceptApplicant, rejectApplicant } from "@/app/actions/applications";
import { toast } from "sonner";

interface Applicant {
  id: string;
  status: string;
  professional: {
    id: string;
    name: string | null;
    image: string | null;
    professionalProfile: {
      firstName: string | null;
      lastName: string | null;
      title: string | null;
      photoUrl: string | null;
      city: string | null;
      rateType: string | null;
      rateAmountEur: number | null;
      topSkills: string[] | null;
      averageRating: string | null;
      reviewCount: number | null;
      bioShort: string | null;
    } | null;
  };
}

interface Job {
  id: string;
  title: string;
  location: string | null;
  remoteOk: boolean | null;
  budgetMinEur: number | null;
  budgetMaxEur: number | null;
  rateType: string | null;
  skills: string[] | null;
  description: string | null;
}

export function JobDetailClient({ job, initialApplicants }: { job: Job, initialApplicants: Applicant[] }) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (appId: string) => {
    setProcessingId(appId);
    const res = await acceptApplicant(appId);
    if (res.success) {
      toast.success("Match creato!", {
        description: "Il candidato è stato accettato. Ora puoi fissare un colloquio.",
        icon: <CheckCircle2 size={16} className="text-emerald-500" />,
      });
      // Update local state instead of filtering out
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: 'accepted' } : a));
    } else {
      toast.error(res.error || "Errore durante l'accettazione");
    }
    setProcessingId(null);
  };

  const handleReject = async (appId: string) => {
    setProcessingId(appId);
    const res = await rejectApplicant(appId);
    if (res.success) {
      toast.success("Candidato rimosso", {
        description: "La candidatura è stata rifiutata.",
        icon: <XCircle size={16} className="text-red-500" />,
      });
      setApplicants(prev => prev.filter(a => a.id !== appId));
    } else {
      toast.error(res.error || "Errore durante il rifiuto");
    }
    setProcessingId(null);
  };

  const pendingApplicants = applicants.filter(a => a.status === 'pending');
  const acceptedApplicants = applicants.filter(a => a.status === 'accepted');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">{job.title}</h1>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">Gestione Candidati</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Badge variant="outline" className="rounded-full border-slate-200 text-slate-400 font-bold px-4 py-1">
             {pendingApplicants.length} Candidature Pending
           </Badge>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-6xl w-full mx-auto p-8 lg:p-12">
          {/* Job Info Summary */}
          <div className="mb-12 p-8 bg-slate-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400">
                    <Briefcase size={24} />
                  </div>
                  <h2 className="text-3xl font-display italic font-bold">{job.title}</h2>
                </div>
                <div className="flex flex-wrap gap-4 text-slate-400 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500" />
                    <span>{job.location || "Remote"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Laptop size={16} className="text-emerald-500" />
                    <span>{job.remoteOk ? "Remote OK" : "In sede"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-emerald-500" />
                    <span>
                      {job.budgetMinEur}-{job.budgetMaxEur}€ 
                      {job.rateType === 'ral_annual' ? ' RAL' : job.rateType === 'daily' ? '/gg' : '/ora'}
                    </span>
                  </div>
                </div>

                {job.description && (
                  <p className="text-slate-300 text-sm leading-relaxed max-w-2xl pt-2 italic">
                    &quot;{job.description}&quot;
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 items-start md:justify-end max-w-sm">
                {job.skills?.map((s: string) => (
                  <Badge key={s} className="bg-white/5 border-white/10 text-white/70 rounded-lg hover:bg-white/10 transition-colors uppercase text-[10px] font-black tracking-widest px-3">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Applicants Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Candidati da Valutare</h3>
              </div>
            </div>

            <div className="grid gap-6">
              <AnimatePresence mode="popLayout">
                {pendingApplicants.length > 0 ? (
                  pendingApplicants.map((app, idx) => {
                    const prof = app.professional;
                    const profile = prof.professionalProfile;
                    const name = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : prof.name || "Professionista";
                    
                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="p-1 rounded-[2rem] border-slate-50 shadow-card hover:shadow-premium transition-all duration-500 bg-white group overflow-hidden">
                          <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-8">
                            {/* Profile Image */}
                            <div className="relative shrink-0">
                              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] bg-slate-50 border-2 border-white shadow-sm overflow-hidden ring-4 ring-slate-50 transition-transform group-hover:scale-105 duration-500">
                                {profile?.photoUrl || prof.image ? (
                                  <Image 
                                    src={profile?.photoUrl || prof.image || ""} 
                                    alt={name} 
                                    width={128} 
                                    height={128} 
                                    className="w-full h-full object-cover" 
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-200 font-display text-5xl italic font-bold">
                                    {name[0]}
                                  </div>
                                )}
                              </div>
                              {profile?.averageRating && parseFloat(profile.averageRating) > 0 && (
                                <div className="absolute -bottom-2 -right-2 bg-amber-50 text-amber-600 px-3 py-1 rounded-xl border border-amber-100 shadow-sm flex items-center gap-1.5 scale-90">
                                  <Star size={12} fill="currentColor" />
                                  <span className="text-xs font-black">{profile.averageRating}</span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-4">
                              <div>
                                <h4 className="text-2xl font-bold text-slate-950 group-hover:text-emerald-700 transition-colors">{name}</h4>
                                <p className="text-emerald-600 font-bold italic">{profile?.title || "Professionista IT"}</p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {profile?.topSkills?.slice(0, 4).map(s => (
                                  <Badge key={s} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-bold rounded-lg h-7">
                                    {s}
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={12} className="text-emerald-500" />
                                  <span>{profile?.city || "Remote"}</span>
                                </div>
                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                <div className="flex items-center gap-1.5">
                                  <Zap size={12} className="text-emerald-500" />
                                  <span>€{profile?.rateAmountEur}/{profile?.rateType === 'ral_annual' ? 'anno' : profile?.rateType === 'daily' ? 'giorno' : 'ora'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                              <Button 
                                onClick={() => handleAccept(app.id)}
                                disabled={!!processingId}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 bg-slate-950 hover:bg-emerald-600 transition-all font-bold gap-2"
                              >
                                {processingId === app.id ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>Accetta Match <CheckCircle2 size={18} /></>
                                )}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleReject(app.id)}
                                disabled={!!processingId}
                                className="flex-1 md:flex-none rounded-2xl h-12 px-6 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-bold gap-2"
                              >
                                Rifiuta <XCircle size={18} />
                              </Button>
                              <Link href={`/profile/${prof.id}`} className="hidden md:block">
                                <Button variant="ghost" className="w-full rounded-2xl h-10 text-slate-400 hover:text-slate-950 font-bold gap-2">
                                  Vedi Profilo <ChevronRight size={16} />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                      <Users size={40} />
                    </div>
                    <h3 className="text-2xl font-display font-bold italic text-slate-400">Nessun candidato in attesa</h3>
                    <p className="text-slate-400 font-medium mt-2">Le nuove candidature appariranno qui appena i professionisti metteranno like.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Accepted Applicants Section */}
          {acceptedApplicants.length > 0 && (
            <div className="space-y-8 mt-16 pt-16 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">Candidati Accettati</h3>
                </div>
              </div>

              <div className="grid gap-6">
                {acceptedApplicants.map((app) => {
                  const prof = app.professional;
                  const profile = prof.professionalProfile;
                  const name = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : prof.name || "Professionista";
                  
                  return (
                    <Card key={app.id} className="p-1 rounded-[2rem] shadow-card bg-emerald-50/30 group overflow-hidden border-emerald-100/50">
                      <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-8">
                        {/* Profile Image */}
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.2rem] bg-white border-2 border-white shadow-sm overflow-hidden ring-4 ring-emerald-50/50 transition-transform group-hover:scale-105 duration-500">
                            {profile?.photoUrl || prof.image ? (
                              <Image 
                                src={profile?.photoUrl || prof.image || ""} 
                                alt={name} 
                                width={96} 
                                height={96} 
                                className="w-full h-full object-cover" 
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-200 font-display text-4xl italic font-bold">
                                {name[0]}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="text-xl font-bold text-slate-950">{name}</h4>
                            <p className="text-emerald-600 font-bold italic text-sm">{profile?.title || "Professionista IT"}</p>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-emerald-500" />
                              <span>{profile?.city || "Remote"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                          <Link href={`/matches`} className="flex-1 md:flex-none">
                            <Button className="w-full rounded-2xl h-12 px-6 bg-emerald-600 hover:bg-emerald-700 transition-all font-bold gap-2">
                              Vai ai Match <ChevronRight size={18} />
                            </Button>
                          </Link>
                          <Link href={`/profile/${prof.id}`}>
                            <Button variant="ghost" className="rounded-2xl h-12 px-4 text-slate-400 hover:text-slate-950 font-bold">
                              Profilo
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
