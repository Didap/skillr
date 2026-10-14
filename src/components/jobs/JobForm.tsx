"use client";

import { useState, useEffect } from "react";
import { Briefcase, Info, MapPin, Laptop, Euro, Loader2, Check } from "lucide-react";
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
            <div className="flex items-center gap-3 md:gap-4 border-b border-viola/15 pb-4 md:pb-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-rosa text-viola flex items-center justify-center" aria-hidden="true">
                <Briefcase size={20} strokeWidth={1.75} />
              </div>
              <h2 className="text-title text-viola">Informazioni base</h2>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-label text-viola">Titolo della ricerca</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={initialData?.title}
                  placeholder="Es: Senior React Developer (Remote)"
                  className="h-12 px-5 text-base"
                />
                <p className="text-label font-normal text-viola-500 px-1">Sii specifico e conciso: è la prima cosa che vedrà il pro.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-label text-viola">Descrizione breve</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={initialData?.description || ""}
                  placeholder="Descrivi il team, il progetto e cosa cerchi..."
                  className="min-h-[140px] md:min-h-[160px] resize-none rounded-3xl p-5 md:p-6 font-prompt text-lg font-medium leading-7"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5 md:space-y-8">
            <div className="flex items-center gap-3 md:gap-4 border-b border-viola/15 pb-4 md:pb-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-rosa text-viola flex items-center justify-center" aria-hidden="true">
                <Euro size={20} strokeWidth={1.75} />
              </div>
              <h2 className="text-title text-viola">Budget e contratto</h2>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div className="space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <Label className="text-label text-viola">Tipo di retribuzione</Label>
                  <Select name="rateType" value={rateType} onValueChange={(v: string | null) => setRateType((v ?? "daily") as "ral_annual" | "daily" | "hourly")}>
                    <SelectTrigger className="h-12! w-full px-5 text-base font-medium">
                      <SelectValue>
                        {rateTypeLabels[rateType as keyof typeof rateTypeLabels]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ral_annual">RAL Annua (€)</SelectItem>
                      <SelectItem value="daily">Tariffa Giornaliera (€/gg)</SelectItem>
                      <SelectItem value="hourly">Tariffa Oraria (€/ora)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMinEur" className="text-label text-viola">Budget minimo</Label>
                    <div className="relative">
                      <Input
                        id="budgetMinEur"
                        name="budgetMinEur"
                        type="number"
                        required
                        defaultValue={initialData?.budgetMinEur || ""}
                        placeholder="Min"
                        inputMode="numeric"
                        className="h-14 pl-5 pr-10 text-xl md:text-xl font-bold tabular-nums" 
                      />
                      <span aria-hidden="true" className="absolute right-5 top-1/2 -translate-y-1/2 text-viola-500 font-bold text-lg pointer-events-none">€</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMaxEur" className="text-label text-viola">Budget massimo</Label>
                    <div className="relative">
                      <Input
                        id="budgetMaxEur"
                        name="budgetMaxEur"
                        type="number"
                        required
                        defaultValue={initialData?.budgetMaxEur || ""}
                        placeholder="Max"
                        inputMode="numeric"
                        className="h-14 pl-5 pr-10 text-xl md:text-xl font-bold tabular-nums" 
                      />
                      <span aria-hidden="true" className="absolute right-5 top-1/2 -translate-y-1/2 text-viola-500 font-bold text-lg pointer-events-none">€</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 md:p-6 bg-rosa rounded-card flex gap-3 md:gap-4 text-viola text-body font-medium">
                <Info size={20} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
                <p>La trasparenza è obbligatoria. Helllo mostrerà questa fascia direttamente sulla card.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Location & Skills */}
        <div className="space-y-10 md:space-y-16">
          <section className="space-y-5 md:space-y-8">
            <div className="flex items-center gap-3 md:gap-4 border-b border-viola/15 pb-4 md:pb-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-rosa text-viola flex items-center justify-center" aria-hidden="true">
                <MapPin size={20} strokeWidth={1.75} />
              </div>
              <h2 className="text-title text-viola">Sede</h2>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div className="flex items-center justify-between gap-4 p-5 md:p-6 bg-crema rounded-card">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-full bg-white flex items-center justify-center text-viola" aria-hidden="true">
                    <Laptop size={20} strokeWidth={1.75} />
                  </div>
                  <div>
                    <Label htmlFor="remoteOk" className="text-body font-bold text-viola cursor-pointer">Lavoro da remoto</Label>
                    <p className="text-label font-normal text-viola-500">Abilita per attirare candidati da tutta Italia.</p>
                  </div>
                </div>
                <Switch id="remoteOk" name="remoteOk" defaultChecked={initialData?.remoteOk || false} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-label text-viola">Città (opzionale)</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={initialData?.location || ""}
                  placeholder="Es: Milano, Roma..."
                  className="h-12 px-5 text-base"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5 md:space-y-8">
            <div className="flex items-center gap-3 md:gap-4 border-b border-viola/15 pb-4 md:pb-6">
              <div className="w-11 h-11 shrink-0 rounded-full bg-rosa text-viola flex items-center justify-center" aria-hidden="true">
                <Briefcase size={20} strokeWidth={1.75} />
              </div>
              <h2 className="text-title text-viola">Skill richieste</h2>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <Label className="text-label text-viola">Settori di riferimento</Label>
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
                        "pressable min-h-11 px-4 md:px-5 py-2 rounded-full border text-chip text-viola inline-flex items-center gap-1.5 transition-colors",
                        selectedClusters.includes(cluster.slug)
                          ? "bg-rosa border-rosa"
                          : "bg-white border-viola/15 hover:bg-crema"
                      )}
                    >
                      {selectedClusters.includes(cluster.slug) && <Check size={14} strokeWidth={2.5} className="-ml-1 shrink-0" aria-hidden="true" />}
                      {cluster.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedClusters.length > 0 && (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center gap-3 px-1">
                    <Label className="text-label text-viola">Skill (massimo 10)</Label>
                    <span className="shrink-0 text-label font-bold tabular-nums text-viola bg-rosa px-2.5 py-0.5 rounded-full">
                      {selectedSkills.length}/10
                    </span>
                  </div>
                  <div className="space-y-6 md:max-h-[350px] md:overflow-y-auto overscroll-contain p-5 md:p-6 bg-crema rounded-card">
                    {catalog.filter(c => selectedClusters.includes(c.slug)).map(cluster => (
                      <div key={cluster.id} className="space-y-3">
                        <p className="text-label text-viola-500 pl-1">{cluster.label}</p>
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
                                "pressable min-h-11 md:min-h-9 px-4 py-2 rounded-full border text-chip text-viola inline-flex items-center gap-1.5 transition-colors",
                                selectedSkills.includes(skill.slug)
                                  ? "bg-rosa border-rosa"
                                  : "bg-white border-white hover:border-viola/15",
                                !selectedSkills.includes(skill.slug) && selectedSkills.length >= 10 && "opacity-40"
                              )}
                            >
                              {selectedSkills.includes(skill.slug) && <Check size={14} strokeWidth={2.5} className="-ml-1 shrink-0" aria-hidden="true" />}
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
      <div className="sticky z-20 bottom-0 -mx-4 px-4 py-3 bg-white border-t border-viola/15 md:static md:mx-0 md:px-0 md:py-0 md:pt-10 md:bg-transparent flex justify-center">
        <Button
          type="submit"
          disabled={loading}
          className="w-full md:max-w-md h-13 md:h-14 text-base md:text-lg"
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
