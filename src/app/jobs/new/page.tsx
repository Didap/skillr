"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, Info, MapPin, Laptop, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createJob } from "@/app/actions/jobs";
import { getMetadataCatalog } from "@/app/actions/metadata";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useState(() => {
    async function fetchCatalog() {
      const res = await getMetadataCatalog();
      if (res.success) setCatalog(res.data);
    }
    fetchCatalog();
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      skills: selectedSkills,
      budgetMinEur: parseInt(formData.get("budgetMinEur") as string),
      budgetMaxEur: parseInt(formData.get("budgetMaxEur") as string),
      rateType: formData.get("rateType") as any,
      location: formData.get("location") as string,
      remoteOk: formData.get("remoteOk") === "on",
    };

    const res = await createJob(data);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/jobs");
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-20 border-b border-border-subtle bg-white flex items-center px-6 sticky top-0 z-40">
        <Link href="/jobs" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium">
          <ArrowLeft size={20} /> Ricerche
        </Link>
        <div className="mx-auto font-bold font-display italic text-xl">Nuova Ricerca Attiva</div>
        <div className="w-20" />
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-12">
        <div className="bg-white rounded-3xl border border-border-subtle shadow-card p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Informazioni Base
              </h2>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Titolo della ricerca</label>
                <Input name="title" required placeholder="Es: Senior React Developer (Remote)" className="rounded-xl h-12" />
                <p className="text-xs text-text-muted italic">Sii specifico e conciso: è la prima cosa che vedrà il pro.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Descrizione breve</label>
                <Textarea name="description" placeholder="Descrivi il team, il progetto e cosa cerchi..." className="rounded-xl min-h-[120px] resize-none" />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-border-subtle">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Euro size={20} className="text-primary" /> Budget e Tipo Contratto
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-secondary">Tipo di Retribuzione</label>
                  <Select name="rateType" defaultValue="daily">
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Scegli..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ral_annual">RAL Annua (€)</SelectItem>
                      <SelectItem value="daily">Tariffa Giornaliera (€/gg)</SelectItem>
                      <SelectItem value="hourly">Tariffa Oraria (€/ora)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary">Min (€)</label>
                    <Input name="budgetMinEur" type="number" required placeholder="Min" className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary">Max (€)</label>
                    <Input name="budgetMaxEur" type="number" required placeholder="Max" className="rounded-xl h-12" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl flex gap-3 text-emerald-800 text-sm italic border border-emerald-100">
                <Info size={20} className="shrink-0" />
                La trasparenza è obbligatoria. Skillr mostrerà questa fascia direttamente sulla card.
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-border-subtle">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <MapPin size={20} className="text-primary" /> Location
              </h2>

              <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border-subtle">
                 <div className="flex items-center gap-3">
                    <Laptop size={20} className="text-text-secondary" />
                    <div>
                       <p className="font-semibold text-text-primary">Lavoro da remoto</p>
                       <p className="text-xs text-text-muted">Abilita per attirare candidati da tutta Italia.</p>
                    </div>
                 </div>
                 <Switch name="remoteOk" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary">Città (opzionale)</label>
                <Input name="location" placeholder="Es: Milano, Roma..." className="rounded-xl h-12" />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-border-subtle">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Skill Richieste
              </h2>
              
              <div className="space-y-4">
                <label className="text-sm font-semibold text-text-secondary">Seleziona i Cluster di riferimento</label>
                <div className="flex flex-wrap gap-2">
                  {catalog.map(cluster => (
                    <button
                      key={cluster.id}
                      type="button"
                      onClick={() => {
                        const exists = selectedClusters.includes(cluster.slug);
                        setSelectedClusters(exists 
                          ? selectedClusters.filter(s => s !== cluster.slug)
                          : [...selectedClusters, cluster.slug]
                        );
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-bold transition-all",
                        selectedClusters.includes(cluster.slug)
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-border-subtle text-text-secondary hover:border-primary"
                      )}
                    >
                      {cluster.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedClusters.length > 0 && (
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-text-secondary">Seleziona le Skill (max 10)</label>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto p-4 bg-surface rounded-2xl border border-border-subtle">
                    {catalog.filter(c => selectedClusters.includes(c.slug)).map(cluster => (
                      <div key={cluster.id} className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{cluster.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {cluster.skills.map((skill: any) => (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => {
                                const exists = selectedSkills.includes(skill.slug);
                                if (!exists && selectedSkills.length >= 10) return;
                                setSelectedSkills(exists 
                                  ? selectedSkills.filter(s => s !== skill.slug)
                                  : [...selectedSkills, skill.slug]
                                );
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                                selectedSkills.includes(skill.slug)
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-border-strong text-text-secondary hover:bg-surface-warm"
                              )}
                            >
                              {skill.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs text-text-muted font-bold">
                    <span>Skill selezionate:</span>
                    <span>{selectedSkills.length}/10</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-8">
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-full text-lg shadow-xl shadow-primary/20">
                {loading ? "Pubblicazione in corso..." : "Pubblica Ricerca"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
