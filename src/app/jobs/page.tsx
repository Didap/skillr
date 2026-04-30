"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Briefcase, Zap, Trash2, Power, Pencil, Laptop, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getCompanyJobs, deleteJob, toggleJobStatus } from "@/app/actions/jobs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    setLoading(true);
    const res = await getCompanyJobs();
    if (res.success) {
      setJobs(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa ricerca?")) return;
    const res = await deleteJob(id);
    if (res.success) {
      setJobs(jobs.filter(j => j.id !== id));
      toast.success("Ricerca eliminata con successo");
    } else {
      toast.error(res.error || "Errore durante l'eliminazione");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleJobStatus(id, !currentStatus);
    if (res.success) {
      setJobs(jobs.map(j => j.id === id ? { ...j, isActive: !currentStatus } : j));
      toast.success(currentStatus ? "Ricerca disattivata" : "Ricerca attivata");
    } else {
      toast.error(res.error || "Errore durante l'aggiornamento");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-20 border-b border-border-subtle bg-white/50 backdrop-blur-md flex items-center px-6 sticky top-0 z-40">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium mr-auto"
        >
          <ArrowLeft size={20} /> Dashboard
        </Link>
        <h1 className="text-xl font-bold font-display italic">Gestione Ricerche</h1>
        <div className="ml-auto w-[100px]" /> {/* Spacer */}
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
           <div>
              <h2 className="text-3xl font-bold text-text-primary">I tuoi annunci</h2>
              <p className="text-text-secondary mt-1">Gestisci le posizioni aperte e monitora i match.</p>
           </div>
           <Link href="/jobs/new">
             <Button className="rounded-full gap-2 shadow-lg shadow-primary/20 h-12 px-6">
                <Plus size={18} /> Nuova Ricerca
             </Button>
           </Link>
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {jobs.map((job) => (
              <motion.div 
                key={job.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-3xl border transition-all ${
                  job.isActive 
                    ? "bg-white border-border-subtle hover:shadow-xl hover:shadow-primary/5" 
                    : "bg-surface-warm/50 border-dashed border-border-strong grayscale opacity-70"
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      job.isActive ? "bg-primary/5 text-primary" : "bg-text-muted/10 text-text-muted"
                    }`}>
                      <Briefcase size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-xl text-text-primary">{job.title}</h3>
                        {!job.isActive && <span className="text-[10px] uppercase tracking-widest bg-text-muted/10 text-text-muted px-2 py-0.5 rounded-full">Inattiva</span>}
                        {job.matchCount > 0 && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="relative"
                          >
                            <Badge variant="default" className="h-6 px-2 rounded-full flex items-center justify-center shadow-premium border-2 border-white">
                              {job.matchCount} match
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="text-sm text-text-secondary mr-2">
                          {job.location || "Sede centrale"} • {job.budgetMinEur}-{job.budgetMaxEur}€ / {
                            job.rateType === 'ral_annual' ? 'anno' : job.rateType === 'daily' ? 'giorno' : 'ora'
                          }
                        </p>
                        {job.remoteOk && (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-tight text-[10px] font-bold h-5">
                            <Laptop className="size-3 mr-1" /> Remote OK
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {job.skills?.slice(0, 5).map((skill: string) => (
                          <Badge key={skill} variant="outline" className="bg-surface-warm/50 border-border-subtle text-text-secondary font-medium text-[10px] h-5">
                            {skill.replace(/-/g, ' ')}
                          </Badge>
                        ))}
                        {job.skills?.length > 5 && (
                          <Badge variant="outline" className="bg-surface border-border-subtle text-text-muted font-medium text-[10px] h-5">
                            +{job.skills.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-border-subtle">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleToggle(job.id, job.isActive)}
                      className="rounded-full border-border-strong hover:bg-surface transition-colors"
                      title={job.isActive ? "Disabilita" : "Abilita"}
                    >
                      <Power size={18} className={job.isActive ? "text-emerald-600" : "text-text-muted"} />
                    </Button>
                    <Link href={`/jobs/${job.id}/edit`}>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="rounded-full border-border-strong hover:bg-surface transition-colors"
                      >
                        <Pencil size={18} />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(job.id)}
                      className="rounded-full border-border-strong hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </Button>
                    <Link href="/dashboard" className="flex-1 md:flex-none">
                      <Button className="rounded-full gap-2 w-full">
                        <Zap size={16} /> Trova Candidati
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && jobs.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border-strong">
               <div className="w-20 h-20 bg-surface-warm rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted">
                  <Briefcase size={40} />
               </div>
               <h3 className="text-xl font-bold text-text-primary mb-2">Ancora nessuna ricerca</h3>
               <p className="text-text-secondary mb-8">Inizia creando la tua prima ricerca attiva per trovare talenti.</p>
               <Link href="/jobs/new">
                 <Button className="rounded-full gap-2">
                    <Plus size={18} /> Crea la prima ricerca
                 </Button>
               </Link>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-28 bg-white/50 animate-pulse rounded-3xl border border-border-subtle" />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
