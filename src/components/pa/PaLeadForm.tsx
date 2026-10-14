"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Building2, 
  User, 
  Mail, 
  FileText, 
  Loader2, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Phone
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { savePaLeadAction } from "@/app/actions/pa";
import { Turnstile } from "@marsidev/react-turnstile";

const entityTypes = [
  { value: "municipality", label: "Comune" },
  { value: "region", label: "Regione" },
  { value: "cpi", label: "Centro per l'Impiego" },
  { value: "ngo", label: "Cooperativa sociale o ETS" },
  { value: "foundation", label: "Fondazione o Ente Formativo" },
] as const;

const roles = [
  { value: "dirigente", label: "Dirigente / Funzionario" },
  { value: "assessore", label: "Assessore / Politico" },
  { value: "consulente", label: "Consulente Tecnico" },
  { value: "altro", label: "Altro" },
];

const services = [
  { value: "match", label: "Matching Algoritmico (GG+ / GOL)" },
  { value: "outreach", label: "Helllo Outreach (Attrazione Talenti)" },
  { value: "codesign", label: "Helllo Co-Design (Partner Bandi)" },
] as const;

const formSchema = z.object({
  fullName: z.string().min(2, "Inserisci il tuo nome e cognome completo"),
  email: z.string()
    .email("Inserisci un indirizzo email valido")
    .refine((email) => {
      // Basic institutional email check (just as an example, could be more strict)
      const allowedDomains = [".it", ".gov.it", ".edu.it", ".org"];
      return allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
    }, {
      message: "Utilizza un indirizzo email istituzionale o professionale (.it, .gov.it)"
    }),
  phone: z.string().optional(),
  organization: z.string().min(2, "Indica l'amministrazione o ente di appartenenza"),
  entityType: z.enum(["municipality", "region", "cpi", "ngo", "foundation"], {
    error: "Seleziona il tipo di ente",
  }),
  role: z.string().min(1, "Seleziona il tuo ruolo"),
  service: z.enum(["match", "outreach", "codesign"], {
    error: "Seleziona il servizio di interesse",
  }),
  deadline: z.date().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PaLeadForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      organization: "",
      role: "",
      notes: "",
    },
  });

  // Pre-fill service from query params
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && services.some(s => s.value === serviceParam)) {
      form.setValue("service", serviceParam as FormValues["service"]);
    }
  }, [searchParams, form]);

  async function onSubmit(values: FormValues) {
    if (!turnstileToken) {
      toast.error("Per favore, completa la verifica anti-spam");
      return;
    }

    setLoading(true);
    try {
      const res = await savePaLeadAction({
        ...values,
        turnstileToken,
      });

      if (res.success) {
        toast.success("Richiesta inviata con successo!", {
          description: "Un nostro consulente ti contatterà entro 24 ore."
        });
        form.reset();
        setTurnstileToken(null);
      } else {
        toast.error(res.error || "Si è verificato un errore.");
      }
    } catch {
      toast.error("Errore durante l'invio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-20">
      
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-title md:text-4xl md:leading-tight font-display font-bold text-viola">Richiedi una demo istituzionale</h2>
        <p className="text-viola-500 max-w-xl mx-auto font-medium">Compila il modulo per essere ricontattato dai nostri esperti PA.</p>
      </div>

      <div className="bg-white rounded-card border border-viola/15 overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-12">
            
            {/* Sezione 1: Referente */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-viola/15 pb-4">
                <div className="w-9 h-9 rounded-full bg-blu-50 flex items-center justify-center text-blu" aria-hidden="true">
                   <User size={16} />
                </div>
                <h3 className="text-body font-semibold text-viola">Profilo referente</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-label text-viola ml-1">Nome e cognome</FormLabel>
                      <FormControl>
                        <Input placeholder="Mario Rossi" {...field} className="h-12 px-4" />
                      </FormControl>
                      <FormMessage className="text-label" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-label text-viola ml-1">Email istituzionale</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="m.rossi@comune.it" {...field} className="h-12 px-4" />
                      </FormControl>
                      <FormMessage className="text-label" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-label text-viola ml-1">Telefono (opzionale)</FormLabel>
                      <FormControl>
                        <Input placeholder="+39 ..." {...field} className="h-12 px-4" />
                      </FormControl>
                      <FormMessage className="text-label" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-label text-viola ml-1">Il tuo ruolo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 w-full px-4 text-base md:text-sm">
                            <SelectValue placeholder="Seleziona ruolo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-3xl border-viola/15 shadow-card">
                          {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-label" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sezione 2: Ente */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-viola/15 pb-4">
                <div className="w-9 h-9 rounded-full bg-blu-50 flex items-center justify-center text-blu" aria-hidden="true">
                   <Building2 size={16} />
                </div>
                <h3 className="text-body font-semibold text-viola">Dettagli amministrazione</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-label text-viola ml-1">Nome ente / amministrazione</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Regione Puglia" {...field} className="h-12 px-4" />
                      </FormControl>
                      <FormMessage className="text-label" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entityType"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-label text-viola ml-1">Tipo di ente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 w-full px-4 text-base md:text-sm">
                            <SelectValue placeholder="Scegli tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-3xl border-viola/15 shadow-card">
                          {entityTypes.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-label" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-label text-viola ml-1">Servizio di interesse</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 w-full px-4 text-base md:text-sm">
                            <SelectValue placeholder="Quale soluzione ti serve?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-3xl border-viola/15 shadow-card">
                          {services.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-label" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-label text-viola ml-1">Eventuale scadenza bando</FormLabel>
                      <FormControl>
                        <DatePicker 
                          value={field.value} 
                          onChange={field.onChange} 
                          disablePast 
                          placeholder="Seleziona data" 
                          className="h-12 w-full px-4 [&>span]:text-base" 
                        />
                      </FormControl>
                      <FormMessage className="text-label" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sezione 3: Note */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-viola/15 pb-4">
                <div className="w-9 h-9 rounded-full bg-blu-50 flex items-center justify-center text-blu" aria-hidden="true">
                   <FileText size={16} />
                </div>
                <h3 className="text-body font-semibold text-viola">Dettagli aggiuntivi</h3>
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-label text-viola ml-1">Messaggio o esigenze specifiche</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrivi qui i tuoi dubbi o le tue necessità particolari..." 
                        {...field} 
                        className="min-h-[140px] p-4 resize-none" 
                      />
                    </FormControl>
                    <FormMessage className="text-label" />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer Form */}
            <div className="pt-8 border-t border-viola/15 space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4 p-5 bg-crema rounded-3xl max-w-md">
                  <Lock size={20} className="text-viola-500 shrink-0" aria-hidden="true" />
                  <p className="text-label text-viola-500 leading-relaxed">
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
                className="w-full h-14 gap-3 text-base"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={24} />}
                {loading ? "Invio in corso..." : "Invia richiesta istituzionale"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="text-center pt-12">
        <div className="inline-flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-viola-500 text-label">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blu" aria-hidden="true" /> Risposta in 24h
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blu" aria-hidden="true" /> Supporto dedicato
          </div>
          <div className="flex items-center gap-2">
             <Phone size={16} className="text-blu" aria-hidden="true" /> +39 080 ...
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-blu" aria-hidden="true" /> pa@skillr.it
          </div>
        </div>
      </div>
    </div>
  );
}
