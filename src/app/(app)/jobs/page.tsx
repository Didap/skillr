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
import { PageBody } from "@/components/layout/PageBody";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { duration, ease, haptic, spring } from "@/lib/motion";
import { cn, formatRate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface JobWithStats extends JobData {
  id: string;
  isActive: boolean;
  matchCount: number;
  applicationCount: number;
}

// Brand icon button: white circle with a 1px viola outline
const iconButton =
  "pressable shrink-0 w-11 h-11 rounded-full border border-viola bg-white flex items-center justify-center text-viola transition-colors hover:bg-crema";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // State for UX Refactoring
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Phone-only "Altro" sheet (edit / delete) for the job with this id. Closing clears it:
  // the sheet's exit animation keeps rendering the last title and actions.
  const [menuId, setMenuId] = useState<string | null>(null);

  // State for Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  async function loadJobs() {
    const res = await getCompanyJobs();
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
        icon: <Trash2 size={16} className="text-rosso-500" />,
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
        icon: currentStatus ? <Power size={14} className="text-viola-500" /> : <Zap size={14} className="text-rosso-500" />,
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
              className={cn(buttonVariants({ size: "icon" }), "md:hidden size-11")}
            >
              <Plus size={20} />
            </Link>
            <Link
              href="/jobs/new"
              className={cn(buttonVariants(), "group hidden md:inline-flex h-12 px-6 gap-2 text-sm")}
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 motion-reduce:transition-none" />
              <span>Nuova ricerca</span>
            </Link>
          </>
        }
      />

      <PageBody className="bg-white">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-8 md:p-12">
          <div className="hidden md:block mb-12">
            <h2 className="text-title text-viola">I tuoi annunci</h2>
            <p className="text-body text-viola-500 mt-1">Monitora i match e gestisci la visibilità.</p>
          </div>

          {/* Search + filter: one compact row on every width */}
          <div className="flex items-center gap-2 md:gap-4 mb-5 md:mb-8">
            <div className="relative flex-1 min-w-0 group">
              <Search
                size={18}
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none",
                  searchQuery ? "text-viola" : "text-viola-400 group-focus-within:text-viola"
                )}
              />
              <Input
                type="search"
                aria-label="Cerca per titolo o sede"
                placeholder="Cerca titolo o sede"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-5 h-12"
              />
            </div>
            <div className="shrink-0 flex items-center gap-2.5 px-4 h-12 bg-crema rounded-full">
              <Switch
                id="active-toggle"
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
              />
              <Label htmlFor="active-toggle" className="text-sm font-medium text-viola whitespace-nowrap cursor-pointer">
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
                      "p-5 md:p-6 rounded-card transition-[background-color,box-shadow,opacity] duration-300",
                      job.isActive
                        ? "bg-white ring-1 ring-viola/15"
                        : "bg-crema"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                      <div className="flex items-start gap-4 md:gap-5 min-w-0 flex-1">
                        <div className={cn(
                          "w-11 h-11 md:w-14 md:h-14 shrink-0 rounded-full flex items-center justify-center",
                          job.isActive ? "bg-rosa text-viola" : "bg-white text-viola-400"
                        )} aria-hidden="true">
                          <Briefcase className="size-5 md:size-6" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={cn(
                            "font-bold text-lg md:text-xl leading-snug line-clamp-2 break-words",
                            job.isActive ? "text-viola" : "text-viola-500"
                          )}>
                            {job.title}
                          </h3>
                          <p className="mt-1 inline-flex items-center gap-1 min-w-0 max-w-full text-sm text-viola-500">
                            <MapPin size={14} className="shrink-0" strokeWidth={1.75} aria-hidden="true" />
                            <span className="truncate">{job.location || "Sede centrale"}</span>
                          </p>
                          {/* Budget in plain sight: transparency is the point */}
                          <p className="mt-2 text-lg md:text-xl font-bold tabular-nums text-viola">
                            <span className="sr-only">Budget: </span>
                            {formatRate(job.rateType, job.budgetMinEur, job.budgetMaxEur)}
                          </p>

                          {(!job.isActive || job.matchCount > 0 || job.applicationCount > 0 || job.remoteOk) && (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {!job.isActive && (
                                <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white text-viola text-label">
                                  <Power className="size-3.5" aria-hidden="true" /> In pausa
                                </span>
                              )}
                              {job.matchCount > 0 && (
                                <span className="inline-flex items-center h-7 px-3 rounded-full bg-rosso text-white text-label font-bold tabular-nums">
                                  {job.matchCount} match
                                </span>
                              )}
                              {job.applicationCount > 0 && (
                                <span className="inline-flex items-center h-7 px-3 rounded-full bg-blu text-white text-label font-bold tabular-nums">
                                  {job.applicationCount} nuovi candidati
                                </span>
                              )}
                              {job.remoteOk && (
                                <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white ring-1 ring-viola/15 text-viola text-label">
                                  <Laptop className="size-3.5" aria-hidden="true" /> Remote OK
                                </span>
                              )}
                            </div>
                          )}

                          {job.skills && job.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {job.skills.slice(0, 5).map((skill: string) => (
                                <span key={skill} className="inline-flex items-center h-8 px-3 rounded-full bg-rosa text-viola text-chip capitalize">
                                  {skill.replace(/-/g, " ")}
                                </span>
                              ))}
                              {job.skills.length > 5 && (
                                <span className="inline-flex items-center h-8 px-3 rounded-full bg-crema text-viola text-chip">
                                  +{job.skills.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={cn(
                        "flex items-center gap-2 md:gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0",
                        job.isActive ? "border-viola/15" : "border-viola/10"
                      )}>
                        <Link
                          href={`/jobs/${job.id}`}
                          className={cn(buttonVariants(), "order-first md:order-last flex-1 md:flex-none min-w-0 h-11 px-4 md:px-5 gap-2 text-sm")}
                        >
                          <Users size={16} className="shrink-0" />
                          <span className="truncate">Candidati</span>
                          {job.applicationCount > 0 && (
                            <span className="shrink-0 min-w-6 h-6 px-1.5 rounded-full bg-white text-viola text-xs tabular-nums inline-flex items-center justify-center">
                              {job.applicationCount}
                            </span>
                          )}
                          <ChevronRight size={16} className="shrink-0 -mr-1 md:hidden" />
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
                            <Loader2 size={18} className="animate-spin text-viola-500" />
                          ) : (
                            <Power size={18} className={job.isActive ? "text-rosso" : "text-viola-400"} />
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
                          className={cn(iconButton, "hidden md:flex hover:bg-rosso-50 hover:text-destructive hover:border-destructive")}
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMenuId(job.id)}
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
              <div className="text-center py-14 md:py-20 px-6 bg-crema rounded-card">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-rosa rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6 text-viola" aria-hidden="true">
                  <Briefcase className="size-8 md:size-9" strokeWidth={1.75} />
                </div>
                <h3 className="text-title text-viola mb-2">Ancora nessuna ricerca</h3>
                <p className="text-body text-viola-500 mb-8 max-w-sm mx-auto">Pubblica la prima ricerca: i professionisti giusti ti diranno helllo.</p>
                <Link
                  href="/jobs/new"
                  className={cn(buttonVariants(), "h-12 px-6 gap-2 text-sm")}
                >
                  <Plus size={18} /> Crea la prima ricerca
                </Link>
              </div>
            )}

            {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: duration.state, ease: ease.out } }}
                className="text-center py-14 md:py-20 px-6 bg-crema rounded-card"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6 text-viola" aria-hidden="true">
                  <XCircle className="size-8 md:size-9" strokeWidth={1.75} />
                </div>
                <h3 className="text-title text-viola mb-2">Nessun risultato</h3>
                <p className="text-body text-viola-500 mb-6">Non abbiamo trovato ricerche che corrispondano ai tuoi filtri.</p>
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 px-6 text-sm")}
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
                  <Skeleton key={i} className="h-52 md:h-36 bg-crema rounded-card" />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageBody>

      {/* Phone: secondary actions for a job */}
      <BottomSheet open={!!menuJob} onClose={() => setMenuId(null)} title={menuJob?.title}>
        {menuJob && (
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href={`/jobs/${menuJob.id}/edit`}
              onClick={() => setMenuId(null)}
              className="pressable flex items-center gap-4 h-14 px-5 rounded-full bg-crema text-viola font-medium"
            >
              <Pencil size={20} strokeWidth={1.75} />
              Modifica ricerca
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuId(null);
                setDeleteId(menuJob.id);
              }}
              className="pressable flex items-center gap-4 h-14 px-5 rounded-full bg-rosso-50 text-destructive font-medium text-left"
            >
              <Trash2 size={20} strokeWidth={1.75} />
              Elimina ricerca
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Delete confirmation: bottom sheet on phones, centred dialog from md */}
      <ConfirmSheet
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Elimina ricerca"
        description="Sei sicuro di voler eliminare questa ricerca? L'azione è irreversibile e tutti i match associati verranno archiviati."
        confirmText="Elimina definitivamente"
        cancelText="Annulla"
      />
    </div>
  );
}
