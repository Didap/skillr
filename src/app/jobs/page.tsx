"use client";

import Link from "next/link";
import {
  Plus,
  Briefcase,
  Zap,
  Trash2,
  Power,
  Pencil,
  Laptop,
  Search,
  XCircle,
  Users,
  MapPin,
  MoreHorizontal,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useMemo } from "react";
import { getCompanyJobs, deleteJob, toggleJobStatus } from "@/app/actions/jobs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { JobData } from "@/types/job";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { duration, ease, haptic, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface JobWithStats extends JobData {
  id: string;
  isActive: boolean;
  matchCount: number;
  applicationCount: number;
}

const rateSuffix = (rateType: string | null | undefined) =>
  rateType === "ral_annual" ? "anno" : rateType === "daily" ? "giorno" : "ora";

const euro = (n: number | null | undefined) =>
  typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString("it-IT") : "—";

const iconButton =
  "pressable shrink-0 w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // State for UX Refactoring
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Phone-only "Altro" sheet (edit / delete) for the job with this id
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // State for Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  async function loadJobs() {
    console.log("[JobsPage] Loading jobs...");
    const res = await getCompanyJobs();
    console.log("[JobsPage] Load jobs result:", res);
    if (res.success) {
      setJobs((res.data || []) as JobWithStats[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    Promise.resolve().then(() => loadJobs());
  }, []);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    // We wait for server for delete to ensure it's safe
    const res = await deleteJob(deleteId);
    if (res.success) {
      setJobs(prev => prev.filter(j => j.id !== deleteId));
      toast.success("Ricerca eliminata", {
        description: "L'annuncio e i relativi match sono stati archiviati.",
        icon: <Trash2 size={16} className="text-red-500" />,
      });
      setDeleteId(null);
    } else {
      toast.error(res.error || "Errore durante l'eliminazione");
    }
    setIsDeleting(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic Update
    const oldJobs = [...jobs];
    setTogglingId(id);
    haptic();

    // Immediate visual feedback
    setJobs(prev => prev.map(j => j.id === id ? { ...j, isActive: !currentStatus } : j));

    const res = await toggleJobStatus(id, !currentStatus);

    if (res.success) {
      toast.success(currentStatus ? "Ricerca in pausa" : "Ricerca attiva", {
        description: currentStatus
          ? "I professionisti non vedranno più questo annuncio."
          : "L'annuncio è di nuovo visibile nel feed.",
        icon: currentStatus ? <Power size={14} className="text-amber-500" /> : <Zap size={14} className="text-emerald-500" />,
      });
    } else {
      // Revert on error
      setJobs(oldJobs);
      toast.error(res.error || "Errore durante l'aggiornamento");
    }
    setTogglingId(null);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.location || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = showOnlyActive ? job.isActive : true;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, showOnlyActive]);

  const menuJob = jobs.find(j => j.id === menuId) ?? null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <PageHeader
        title="Ricerche attive"
        subtitle="Gestisci le tue posizioni aperte"
        actions={
          <>
            <Link
              href="/jobs/new"
              aria-label="Nuova ricerca"
              className="md:hidden pressable w-11 h-11 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-premium"
            >
              <Plus size={20} />
            </Link>
            <Link
              href="/jobs/new"
              className="hidden md:inline-flex pressable items-center gap-2 rounded-xl h-12 px-6 bg-slate-950 hover:bg-emerald-600 text-white shadow-premium transition-colors group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 motion-reduce:transition-none" />
              <span className="font-bold text-sm">Nuova ricerca</span>
            </Link>
          </>
        }
      />

      <main className="flex-1 overflow-y-auto overscroll-contain bg-white pb-tabbar">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-8 md:p-12">
          <div className="hidden md:block mb-12">
            <h2 className="text-3xl font-display italic font-bold text-slate-950">I tuoi annunci</h2>
            <p className="text-slate-500 font-medium mt-1">Monitora i match e gestisci la visibilità.</p>
          </div>

          {/* Search + filter: one compact row on every width */}
          <div className="flex items-center gap-2 md:gap-4 mb-5 md:mb-8">
            <div className="relative flex-1 min-w-0 group">
              <Search
                size={18}
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none",
                  searchQuery ? "text-primary" : "text-text-muted group-focus-within:text-primary"
                )}
              />
              <Input
                type="search"
                aria-label="Cerca per titolo o sede"
                placeholder="Cerca titolo o sede"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-2xl bg-white border-border-subtle focus-visible:ring-primary/20 transition-all duration-300 shadow-sm"
              />
            </div>
            <div className="shrink-0 flex items-center gap-2.5 px-3 md:px-4 h-12 bg-white rounded-2xl border border-border-subtle shadow-sm">
              <Switch
                id="active-toggle"
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
              />
              <Label htmlFor="active-toggle" className="text-sm font-medium text-text-secondary whitespace-nowrap cursor-pointer">
                Solo attive
              </Label>
            </div>
          </div>

          <div className="relative grid gap-4 md:gap-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredJobs.map((job) => {
                const isToggling = togglingId === job.id;
                return (
                  <motion.article
                    key={job.id}
                    layout
                    transition={spring.snappy}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                      opacity: isDeleting && deleteId === job.id ? 0.5 : 1,
                      y: 0,
                      transition: { duration: duration.state, ease: ease.out },
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                      transition: { duration: duration.feedback * 1.5, ease: ease.in },
                    }}
                    className={cn(
                      "p-5 md:p-6 rounded-3xl border transition-[background-color,border-color,box-shadow,filter,opacity] duration-300",
                      job.isActive
                        ? "bg-white border-border-subtle shadow-card md:shadow-none md:hover:shadow-xl md:hover:shadow-primary/5"
                        : "bg-surface-warm/50 border-dashed border-border-strong grayscale opacity-75"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                      <div className="flex items-start md:items-center gap-4 md:gap-5 min-w-0 flex-1">
                        <div className={cn(
                          "w-11 h-11 md:w-14 md:h-14 shrink-0 rounded-2xl flex items-center justify-center",
                          job.isActive ? "bg-primary/5 text-primary" : "bg-text-muted/10 text-text-muted"
                        )}>
                          <Briefcase className="size-5 md:size-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-lg md:text-xl leading-snug text-text-primary line-clamp-2 break-words">
                            {job.title}
                          </h3>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-text-secondary">
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <MapPin size={14} className="shrink-0 text-text-muted" />
                              <span className="truncate">{job.location || "Sede centrale"}</span>
                            </span>
                            <span className="tabular-nums whitespace-nowrap">
                              {euro(job.budgetMinEur)}–{euro(job.budgetMaxEur)} € / {rateSuffix(job.rateType)}
                            </span>
                          </p>

                          {(!job.isActive || job.matchCount > 0 || job.applicationCount > 0 || job.remoteOk) && (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {!job.isActive && (
                                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-text-muted/10 text-text-muted text-xs font-semibold">
                                  In pausa
                                </span>
                              )}
                              {job.matchCount > 0 && (
                                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-emerald-500 text-white text-xs font-semibold tabular-nums">
                                  {job.matchCount} match
                                </span>
                              )}
                              {job.applicationCount > 0 && (
                                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-primary text-white text-xs font-semibold tabular-nums">
                                  {job.applicationCount} nuovi candidati
                                </span>
                              )}
                              {job.remoteOk && (
                                <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
                                  <Laptop className="size-3.5" /> Remote OK
                                </span>
                              )}
                            </div>
                          )}

                          {job.skills && job.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {job.skills.slice(0, 5).map((skill: string) => (
                                <span key={skill} className="inline-flex items-center h-6 px-2.5 rounded-full border border-border-subtle bg-surface-warm/50 text-text-secondary text-xs font-medium capitalize">
                                  {skill.replace(/-/g, " ")}
                                </span>
                              ))}
                              {job.skills.length > 5 && (
                                <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-border-subtle text-text-muted text-xs font-medium">
                                  +{job.skills.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-border-subtle">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="pressable order-first md:order-last flex-1 md:flex-none min-w-0 h-11 px-4 md:px-5 rounded-full bg-slate-950 hover:bg-emerald-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                        >
                          <Users size={16} className="shrink-0" />
                          <span className="truncate">Candidati</span>
                          {job.applicationCount > 0 && (
                            <span className="shrink-0 min-w-6 h-6 px-1.5 rounded-full bg-white/15 text-xs tabular-nums inline-flex items-center justify-center">
                              {job.applicationCount}
                            </span>
                          )}
                          <ChevronRight size={16} className="shrink-0 -mr-1 opacity-60 md:hidden" />
                        </Link>
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleToggle(job.id, job.isActive)}
                          aria-label={job.isActive ? "Metti in pausa la ricerca" : "Riattiva la ricerca"}
                          aria-pressed={job.isActive}
                          title={job.isActive ? "Disabilita" : "Abilita"}
                          className={cn(iconButton, isToggling && "opacity-60")}
                        >
                          {isToggling ? (
                            <Loader2 size={18} className="animate-spin text-slate-400" />
                          ) : (
                            <Power size={18} className={job.isActive ? "text-emerald-600" : "text-text-muted"} />
                          )}
                        </button>
                        <Link
                          href={`/jobs/${job.id}/edit`}
                          aria-label="Modifica ricerca"
                          title="Modifica"
                          className={cn(iconButton, "hidden md:flex")}
                        >
                          <Pencil size={18} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteId(job.id)}
                          aria-label="Elimina ricerca"
                          title="Elimina"
                          className={cn(iconButton, "hidden md:flex hover:bg-red-50 hover:text-red-600 hover:border-red-100")}
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuId(job.id);
                            setMenuOpen(true);
                          }}
                          aria-label="Altre azioni"
                          aria-haspopup="dialog"
                          className={cn(iconButton, "md:hidden")}
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>

            {!loading && jobs.length === 0 && (
              <div className="text-center py-14 md:py-20 px-6 bg-white rounded-3xl border border-dashed border-border-strong">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-warm rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6 text-text-muted">
                  <Briefcase className="size-8 md:size-10" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Ancora nessuna ricerca</h3>
                <p className="text-text-secondary mb-8">Inizia creando la tua prima ricerca attiva per trovare talenti.</p>
                <Link
                  href="/jobs/new"
                  className="pressable inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-white font-bold text-sm"
                >
                  <Plus size={18} /> Crea la prima ricerca
                </Link>
              </div>
            )}

            {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
                className="text-center py-14 md:py-20 px-6 bg-white rounded-3xl border border-dashed border-border-strong"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6 text-primary/40">
                  <XCircle className="size-8 md:size-10" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Nessun risultato</h3>
                <p className="text-text-secondary mb-6">Non abbiamo trovato ricerche che corrispondano ai tuoi filtri.</p>
                <button
                  type="button"
                  className="pressable h-11 px-6 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setSearchQuery("");
                    setShowOnlyActive(false);
                  }}
                >
                  Reset filtri
                </button>
              </motion.div>
            )}

            {loading && (
              <div className="space-y-4" aria-busy="true" aria-label="Caricamento ricerche">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 md:h-28 bg-slate-50/50 animate-pulse motion-reduce:animate-none rounded-3xl border border-slate-100" />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Phone: secondary actions for a job */}
      <BottomSheet open={menuOpen && !!menuJob} onClose={() => setMenuOpen(false)} title={menuJob?.title}>
        {menuJob && (
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href={`/jobs/${menuJob.id}/edit`}
              onClick={() => setMenuOpen(false)}
              className="pressable flex items-center gap-4 h-14 px-4 rounded-2xl bg-slate-50 text-slate-900 font-semibold"
            >
              <Pencil size={20} className="text-slate-500" />
              Modifica ricerca
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setDeleteId(menuJob.id);
              }}
              className="pressable flex items-center gap-4 h-14 px-4 rounded-2xl bg-red-50 text-red-600 font-semibold text-left"
            >
              <Trash2 size={20} />
              Elimina ricerca
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Delete confirmation: bottom sheet on phones, centred dialog from md */}
      <BottomSheet
        open={!!deleteId}
        onClose={() => {
          if (!isDeleting) setDeleteId(null);
        }}
        title="Elimina ricerca"
      >
        <p className="text-slate-600 leading-relaxed">
          Sei sicuro di voler eliminare questa ricerca? L&apos;azione è irreversibile e tutti i match associati verranno archiviati.
        </p>
        <div className="mt-6 flex flex-col-reverse md:flex-row gap-3">
          <button
            type="button"
            onClick={() => setDeleteId(null)}
            disabled={isDeleting}
            className="pressable flex-1 h-12 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={isDeleting}
            className="pressable flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isDeleting && <Loader2 size={18} className="animate-spin" />}
            Elimina definitivamente
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
