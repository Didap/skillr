"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  Info, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { savePaLead } from "@/app/actions/pa";
import { cn } from "@/lib/utils";
import { Turnstile } from "@marsidev/react-turnstile";

const entityTypes = [
  { value: "municipality", label: "Comune" },
  { value: "region", label: "Regione" },
  { value: "cpi", label: "Centro per l'Impiego" },
  { value: "ngo", label: "Cooperativa sociale o ETS" },
  { value: "foundation", label: "Fondazione o Ente Formativo" },
];

const roles = [
  { value: "dirigente", label: "Dirigente / Funzionario" },
  { value: "assessore", label: "Assessore / Politico" },
  { value: "consulente", label: "Consulente Tecnico" },
  { value: "altro", label: "Altro" },
];

const services = [
  { value: "match", label: "Matching Algoritmico (GG+ / GOL)" },
  { value: "outreach", label: "Skillr Outreach (Attrazione Talenti)" },
  { value: "codesign", label: "Skillr Co-Design (Partner Bandi)" },
];

export default function PaLeadForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [deadline, setDeadline] = useState<Date>();
  const [entityType, setEntityType] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Pre-fill service from query params
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && services.some(s => s.value === serviceParam)) {
      setService(serviceParam);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (!turnstileToken) {
      toast.error("Per favore, completa la verifica anti-spam");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      organization: formData.get("organization") as string,
      entityType: entityType,
      role: role,
      service: service,
      deadline: deadline,
      notes: formData.get("notes") as string,
      turnstileToken: turnstileToken,
    };

    try {
      const res = await savePaLead(data as any);
      if (res.success) {
        toast.success("Richiesta inviata con successo!");
        (e.target as HTMLFormElement).reset();
        setDeadline(undefined);
        setEntityType("");
        setRole("");
        setService("");
        setTurnstileToken(null);
      } else {
        toast.error(res.error || "Si è verificato un errore.");
      }
    } catch (err) {
      toast.error("Errore durante l'invio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-20">
      
      {/* Intestazione Rapida */}
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-4xl font-serif italic text-pa-blue">Richiedi una demo istituzionale</h2>
        <p className="text-slate-500 max-w-xl mx-auto">Compila il modulo per essere ricontattato entro 24 ore dai nostri esperti PA.</p>
      </div>

      {/* Card Form Unificata */}
      <div className="bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,76,129,0.1)] border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
          
          {/* Sezione 1: Referente */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <User size={18} className="text-pa-blue-light" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-pa-blue">Profilo Referente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-[11px] font-bold text-slate-500 ml-1">Nome e Cognome</Label>
                <Input id="fullName" name="fullName" required placeholder="Mario Rossi" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl focus:bg-white transition-all px-4" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-bold text-slate-500 ml-1">Email Istituzionale</Label>
                <Input id="email" name="email" type="email" required placeholder="m.rossi@comune.it" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl focus:bg-white transition-all px-4" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[11px] font-bold text-slate-500 ml-1">Telefono (Opzionale)</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+39 ..." className="h-12 bg-slate-50/50 border-slate-100 rounded-xl focus:bg-white transition-all px-4" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-[11px] font-bold text-slate-500 ml-1">Il Tuo Ruolo</Label>
                <Select value={role} onValueChange={(v) => setRole(v ?? "")} required>
                  <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl px-4 text-pa-blue text-sm">
                    <SelectValue placeholder="Seleziona ruolo">
                      {role ? roles.find(r => r.value === role)?.label : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sezione 2: Ente */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <Building2 size={18} className="text-pa-blue-light" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-pa-blue">Dettagli Ente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="organization" className="text-[11px] font-bold text-slate-500 ml-1">Amministrazione</Label>
                <Input id="organization" name="organization" required placeholder="Es. Regione Puglia" className="h-12 bg-slate-50/50 border-slate-100 rounded-xl focus:bg-white transition-all px-4" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entityType" className="text-[11px] font-bold text-slate-500 ml-1">Tipo di Ente</Label>
                <Select value={entityType} onValueChange={(v) => setEntityType(v ?? "")} required>
                  <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl px-4 text-pa-blue text-sm">
                    <SelectValue placeholder="Scegli tipo">
                      {entityType ? entityTypes.find(e => e.value === entityType)?.label : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {entityTypes.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="service" className="text-[11px] font-bold text-slate-500 ml-1">Servizio Richiesto</Label>
                <Select value={service} onValueChange={(v) => setService(v ?? "")} required>
                  <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl px-4 text-pa-blue text-sm">
                    <SelectValue placeholder="Quale soluzione ti serve?">
                      {service ? services.find(s => s.value === service)?.label : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {services.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-[11px] font-bold text-slate-500 ml-1">Data Scadenza Bando</Label>
                <DatePicker value={deadline} onChange={setDeadline} disablePast placeholder="Seleziona data" className="h-12 w-full bg-slate-50/50 border-slate-100 rounded-xl px-4 text-sm flex items-center" />
              </div>
            </div>
          </div>

          {/* Sezione 3: Note */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <FileText size={18} className="text-pa-blue-light" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-pa-blue">Esigenze Specifiche</h3>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-[11px] font-bold text-slate-500 ml-1">Messaggio o Note</Label>
              <Textarea id="notes" name="notes" placeholder="Descrivi qui i tuoi dubbi o le tue necessità particolari..." className="min-h-[120px] bg-slate-50/50 border-slate-100 rounded-xl focus:bg-white transition-all p-4 text-sm resize-none" />
            </div>
          </div>

          {/* Footer Form */}
          <div className="pt-8 border-t border-slate-50 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-md">
                <Lock size={16} className="text-pa-blue-light shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  I tuoi dati sono protetti e verranno utilizzati solo per scopi istituzionali secondo il GDPR.
                </p>
              </div>

              <div className="shrink-0 scale-90">
                <Turnstile 
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"} 
                  onSuccess={(t) => setTurnstileToken(t)}
                  options={{ theme: 'light' }}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-16 rounded-xl text-lg font-bold shadow-lg shadow-pa-blue/20 bg-pa-blue hover:bg-pa-blue-dark active:scale-[0.98] transition-all flex items-center justify-center gap-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              {loading ? "Invio in corso..." : "Invia Richiesta Istituzionale"}
            </Button>
          </div>
        </form>
      </div>

      <div className="text-center pt-8">
        <div className="inline-flex items-center gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-pa-blue-light" /> Risposta in 24h
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-pa-blue-light" /> Supporto Dedicato
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-pa-blue-light" /> pa@skillr.it
          </div>
        </div>
      </div>
    </div>
  );
}
