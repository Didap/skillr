"use client";

import { useState, useEffect } from "react";
import { Briefcase, Info, MapPin, Laptop, Euro, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getMetadataCatalog } from "@/app/actions/metadata";

import { JobData } from "@/types/job";

interface JobFormProps {
  initialData?: JobData & { id?: string };
  onSubmit: (data: JobData) => Promise<void>;
  submitLabel: string;
  loading: boolean;
}

interface Skill {
  id: string;
  label: string;
  slug: string;
}

interface CatalogItem {
  id: string;
  label: string;
  slug: string;
  skills: Skill[];
}

export function JobForm({ initialData, onSubmit, submitLabel, loading }: JobFormProps) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialData?.skills || []);

  useEffect(() => {
    async function fetchCatalog() {
      const res = await getMetadataCatalog();
      if (res.success) {
        setCatalog(res.data);
        
        // If editing, auto-select clusters based on initial skills
        if (initialData?.skills?.length) {
          const clustersToSelect = new Set<string>();
          res.data.forEach((cluster: CatalogItem) => {
            if (cluster.skills.some((s: Skill) => initialData.skills?.includes(s.slug))) {
              clustersToSelect.add(cluster.slug);
            }
          });
          setSelectedClusters(Array.from(clustersToSelect));
        }
      }
    }
    fetchCatalog();
  }, [initialData]);

  const [rateType, setRateType] = useState(initialData?.rateType || "daily");

  const rateTypeLabels = {
    ral_annual: "RAL Annua (€)",
    daily: "Tariffa Giornaliera (€/gg)",
    hourly: "Tariffa Oraria (€/ora)"
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      skills: selectedSkills,
      budgetMinEur: parseInt(formData.get("budgetMinEur") as string),
      budgetMaxEur: parseInt(formData.get("budgetMaxEur") as string),
      rateType: rateType,
      location: formData.get("location") as string,
      remoteOk: formData.get("remoteOk") === "on",
    };
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 md:space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
        {/* Left Column: Base Info & Budget */}
        <div className="space-y-10 md:space-y-16">
          <section className="space-y-5 md:space-y-8">
            <div className="flex items-center gap-3 md:gap-4 border-b border-border-subtle pb-4 md:pb-6">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase size={20} />
              </div>
              <h2 className="text-2xl md:text-3xl font-display italic text-text-primary leading-tight">Informazioni Base</h2>
            </div>
            
            <div className="space-y-5 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Titolo della ricerca</Label>
                <Input 
                  id="title"
                  name="title" 
                  required 
                  defaultValue={initialData?.title}
                  placeholder="Es: Senior React Developer (Remote)" 
                  className="rounded-2xl h-14 bg-white border-border-subtle focus:border-primary px-4 md:px-6 text-base" 
                />
                <p className="text-sm md:text-xs text-text-muted italic px-1">Sii specifico e conciso: è la prima cosa che vedrà il pro.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Descrizione breve</Label>
                <Textarea 
                  id="description"
                  name="description" 
                  defaultValue={initialData?.description || ""}
                  placeholder="Descrivi il team, il progetto e cosa cerchi..." 
                  className="rounded-2xl min-h-[140px] md:min-h-[160px] resize-none bg-white border-border-subtle focus:border-primary p-4 md:p-6 text-base" 
                />
              </div>
            </div>
          </section>

          <section className="space-y-5 md:space-y-8">
            <div className="flex items-center gap-3 md:gap-4 border-b border-border-subtle pb-4 md:pb-6">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Euro size={20} />
              </div>
              <h2 className="text-2xl md:text-3xl font-display italic text-text-primary leading-tight">Budget e Tipo Contratto</h2>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div className="space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Tipo di Retribuzione</Label>
                  <Select name="rateType" value={rateType} onValueChange={(v: string | null) => setRateType((v ?? "daily") as "ral_annual" | "daily" | "hourly")}>
                    <SelectTrigger className="rounded-2xl h-14 w-full bg-white border-border-subtle px-4 md:px-6 text-base font-bold text-text-primary">
                      <SelectValue>
                        {rateTypeLabels[rateType as keyof typeof rateTypeLabels]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border-subtle shadow-premium">
                      <SelectItem value="ral_annual">RAL Annua (€)</SelectItem>
                      <SelectItem value="daily">Tariffa Giornaliera (€/gg)</SelectItem>
                      <SelectItem value="hourly">Tariffa Oraria (€/ora)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMinEur" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Budget Minimo</Label>
                    <div className="relative">
                      <Input 
                        id="budgetMinEur"
                        name="budgetMinEur" 
                        type="number" 
                        required 
                        defaultValue={initialData?.budgetMinEur || ""}
                        placeholder="Min" 
                        inputMode="numeric"
                        className="rounded-2xl h-14 bg-white border-border-subtle pl-4 md:pl-6 pr-10 md:pr-12 text-lg font-bold tabular-nums" 
                      />
                      <span aria-hidden="true" className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-text-muted font-bold text-lg pointer-events-none">€</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMaxEur" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Budget Massimo</Label>
                    <div className="relative">
                      <Input 
                        id="budgetMaxEur"
                        name="budgetMaxEur" 
                        type="number" 
                        required 
                        defaultValue={initialData?.budgetMaxEur || ""}
                        placeholder="Max" 
                        inputMode="numeric"
                        className="rounded-2xl h-14 bg-white border-border-subtle pl-4 md:pl-6 pr-10 md:pr-12 text-lg font-bold tabular-nums" 
                      />
                      <span aria-hidden="true" className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-text-muted font-bold text-lg pointer-events-none">€</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 md:p-6 bg-emerald-50/50 rounded-2xl md:rounded-[2rem] flex gap-3 md:gap-4 text-emerald-900 text-sm italic border border-emerald-100/50">
                <Info size={20} className="shrink-0 text-emerald-600" />
                <p>La trasparenza è obbligatoria. Skillr mostrerà questa fascia direttamente sulla card.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Location & Skills */}
        <div className="space-y-10 md:space-y-16">
          <section className="space-y-5 md:space-y-8">
            <div className="flex items-center gap-3 md:gap-4 border-b border-border-subtle pb-4 md:pb-6">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h2 className="text-2xl md:text-3xl font-display italic text-text-primary leading-tight">Location</h2>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div className="flex items-center justify-between gap-4 p-4 md:p-6 bg-surface-warm/50 rounded-2xl md:rounded-[2rem] border border-border-subtle">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-2xl bg-white border border-border-subtle flex items-center justify-center text-text-muted">
                    <Laptop size={20} />
                  </div>
                  <div>
                    <Label htmlFor="remoteOk" className="font-bold text-text-primary cursor-pointer">Lavoro da remoto</Label>
                    <p className="text-sm md:text-xs text-text-muted">Abilita per attirare candidati da tutta Italia.</p>
                  </div>
                </div>
                <Switch id="remoteOk" name="remoteOk" defaultChecked={initialData?.remoteOk || false} className="data-[state=checked]:bg-primary" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Città (opzionale)</Label>
                <Input 
                  id="location"
                  name="location" 
                  defaultValue={initialData?.location || ""}
                  placeholder="Es: Milano, Roma..." 
                  className="rounded-2xl h-14 bg-white border-border-subtle px-6" 
                />
              </div>
            </div>
          </section>

          <section className="space-y-5 md:space-y-8">
            <div className="flex items-center gap-3 md:gap-4 border-b border-border-subtle pb-4 md:pb-6">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase size={20} />
              </div>
              <h2 className="text-2xl md:text-3xl font-display italic text-text-primary leading-tight">Skill Richieste</h2>
            </div>
            
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-text-muted/80 pl-1">Seleziona i Cluster di riferimento</Label>
                <div className="flex flex-wrap gap-2">
                  {catalog.map(cluster => (
                    <button
                      key={cluster.id}
                      type="button"
                      aria-pressed={selectedClusters.includes(cluster.slug)}
                      onClick={() => {
                        const exists = selectedClusters.includes(cluster.slug);
                        setSelectedClusters(exists 
                          ? selectedClusters.filter(s => s !== cluster.slug)
                          : [...selectedClusters, cluster.slug]
                        );
                      }}
                      className={cn(
                        "pressable min-h-11 px-4 md:px-5 py-2 rounded-xl border text-sm font-bold transition-colors",
                        selectedClusters.includes(cluster.slug)
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                          : "bg-white border-border-subtle text-text-secondary hover:border-primary/40"
                      )}
                    >
                      {cluster.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedClusters.length > 0 && (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center gap-3 px-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-text-muted/80">Seleziona le Skill (max 10)</Label>
                    <span className="shrink-0 text-xs font-black tabular-nums text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {selectedSkills.length}/10
                    </span>
                  </div>
                  <div className="space-y-6 md:max-h-[350px] md:overflow-y-auto overscroll-contain p-4 md:p-6 bg-surface-warm/30 rounded-2xl md:rounded-[2rem] border border-border-subtle scrollbar-thin scrollbar-thumb-border-strong">
                    {catalog.filter(c => selectedClusters.includes(c.slug)).map(cluster => (
                      <div key={cluster.id} className="space-y-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted pl-1">{cluster.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {cluster.skills.map((skill: Skill) => (
                            <button
                              key={skill.id}
                              type="button"
                              aria-pressed={selectedSkills.includes(skill.slug)}
                              onClick={() => {
                                const exists = selectedSkills.includes(skill.slug);
                                if (!exists && selectedSkills.length >= 10) return;
                                setSelectedSkills(exists 
                                  ? selectedSkills.filter(s => s !== skill.slug)
                                  : [...selectedSkills, skill.slug]
                                );
                              }}
                              className={cn(
                                "pressable min-h-11 md:min-h-9 px-4 py-2 rounded-full border text-sm md:text-xs font-bold transition-colors",
                                selectedSkills.includes(skill.slug)
                                  ? "bg-slate-950 border-slate-950 text-white shadow-md"
                                  : "bg-white border-border-strong text-text-secondary hover:bg-surface-warm",
                                !selectedSkills.includes(skill.slug) && selectedSkills.length >= 10 && "opacity-40"
                              )}
                            >
                              {skill.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Phones: sticky action bar above the tab bar. From md: in-flow centred button */}
      <div className="sticky z-20 bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 px-4 py-3 bg-white/90 backdrop-blur-xl border-t border-slate-100 md:static md:mx-0 md:px-0 md:py-0 md:pt-12 md:bg-transparent md:backdrop-blur-none md:border-border-subtle/50 flex justify-center">
        <Button 
          type="submit" 
          disabled={loading} 
          className="pressable w-full md:max-w-md h-13 md:h-16 rounded-2xl text-base md:text-xl font-bold shadow-xl md:shadow-2xl shadow-primary/20 bg-primary hover:bg-primary-dark transition-colors md:transition-all md:hover:scale-[1.02] md:active:scale-[0.98]"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin size-5 md:size-6" /> 
              <span>Salvataggio...</span>
            </div>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
