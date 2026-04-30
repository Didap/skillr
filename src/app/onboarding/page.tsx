"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { User, Building2, ChevronRight, ChevronLeft, Check, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { registerUserAction } from "@/app/actions/auth";
import { verifyEmailCodeAction, generateVerificationCode } from "@/app/actions/verification";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { Turnstile } from "@marsidev/react-turnstile";
import { getMetadataCatalog } from "@/app/actions/metadata";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { validateItalianVAT } from "@/lib/vat";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<"professional" | "company" | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    photoUrl: "",
    selectedClusters: [] as string[],
    topSkills: [] as string[],
    secondarySkills: [] as string[],
    rateAmount: "",
    rateType: "daily" as "daily" | "hourly" | "ral_annual",
    bio: "",
    companyName: "",
    vatNumber: "",
    vatDisclaimerAccepted: false,
    email: "",
    password: "",
  });

  const [catalog, setCatalog] = useState<any[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    async function fetchCatalog() {
      setIsCatalogLoading(true);
      const res = await getMetadataCatalog();
      if (res.success) {
        setCatalog(res.data);
      }
      setIsCatalogLoading(false);
    }
    fetchCatalog();
  }, []);

  useEffect(() => {
    // Persistent state recovery
    const savedData = localStorage.getItem("onboarding_draft");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setRole(parsed.role);
      setFormData(prev => ({ ...prev, ...parsed.formData }));
      // Se l'utente è appena tornato da un login, saltiamo allo step 2 (dati personali)
      if (status === "authenticated" && step === 1) {
        setStep(2);
      }
    }
  }, [status]);

  useEffect(() => {
    if (role) {
      localStorage.setItem("onboarding_draft", JSON.stringify({ role, formData, step }));
    }
  }, [role, formData, step]);

  const nextStep = () => {
    // Basic validation per step
    if (step === 0 && !role) return;
    setStep((s) => s + 1);
  };
  
  const prevStep = () => setStep((s) => s - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id || e.target.name]: e.target.value });
  };

  const handleComplete = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    console.log("Submitting onboarding data...");
    
    try {
      const result = await completeOnboardingAction({
        role,
        ...formData
      });
      
      if (result.success) {
        console.log("Onboarding success, updating session...");
        await update({ role }); // Refresh session with new role
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Si è verificato un errore durante il salvataggio.");
      }
    } catch (err) {
      console.error("Onboarding submission error:", err);
      toast.error("Errore di connessione. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <Zap className="text-emerald-500 animate-pulse" size={48} />
    </div>
  );

  // DEBUG INFO - Rimuovere dopo il test
  console.log("DEBUG ONBOARDING:", { status, role: session?.user?.role });

  return (
    <div className="min-h-screen bg-[#FDFDFC] flex flex-col items-center justify-center p-6 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-lg w-full">
        {/* Progress Header */}
        <div className="mb-8 text-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-[0.15em] mb-4">
              <Zap size={10} fill="currentColor" /> Step {step + 1} di {role === 'professional' ? 7 : 3}
           </div>
           <h1 className="font-display text-4xl italic font-bold text-slate-950 tracking-tight">
              Configura Profilo
           </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex justify-between items-center relative px-6">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
          <motion.div 
            className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / (role === 'professional' ? 6 : 3)) * 100}%` }}
          />
          {[0, 1, 2, 3, 4, 5, 6].filter(i => i <= (role === 'professional' ? 6 : 3)).map((i) => (
            <div 
              key={i}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 shadow-sm",
                step === i ? "bg-emerald-600 border-emerald-600 text-white scale-125 ring-4 ring-emerald-500/20" : 
                step > i ? "bg-emerald-500 border-emerald-500 text-white" : 
                "bg-white border-slate-100 text-slate-300"
              )}
            >
              {step > i ? <Check size={14} strokeWidth={4} /> : <span className="font-black text-[10px]">{i + 1}</span>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className="border-slate-100 shadow-premium rounded-[2rem] bg-white">
              {step === 0 && (
                <>
                  <CardHeader className="text-center pt-10 pb-4">
                    <CardTitle className="text-3xl font-display italic font-bold text-slate-950">Chi sei?</CardTitle>
                    <CardDescription className="text-slate-500 font-semibold mt-1">Scegli il tuo ruolo</CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 pt-4">
                    <RadioGroup 
                      value={role || ""}
                      onValueChange={(val) => setRole(val as any)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <RoleOption 
                        id="professional" 
                        value="professional" 
                        icon={<User size={32} />} 
                        label="Professionista" 
                        description="Cerco nuove opportunità"
                        isSelected={role === "professional"}
                      />
                      <RoleOption 
                        id="company" 
                        value="company" 
                        icon={<Building2 size={32} />} 
                        label="Azienda" 
                        description="Cerco talenti da inserire"
                        isSelected={role === "company"}
                      />
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className="px-8 pb-8 pt-0">
                    <Button 
                      disabled={!role} 
                      onClick={nextStep} 
                      className="w-full rounded-2xl h-14 text-lg font-black bg-slate-950 hover:bg-emerald-800 text-white transition-all shadow-xl shadow-slate-200 group flex items-center justify-center gap-2"
                    >
                      <span>Continua</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </>
              )}

              {step === 1 && (
                <StepLayout 
                  title={isVerifyingEmail ? "Verifica la tua email" : (isLoginMode ? "Accedi al tuo account" : "Crea il tuo account")} 
                  description={
                    isVerifyingEmail 
                      ? `Abbiamo inviato un codice a 6 cifre a ${formData.email}` 
                      : (isLoginMode ? "Bentornato! Inserisci le tue credenziali." : "Per salvare i tuoi progressi e iniziare a fare swipe.")
                  }
                  onBack={() => isVerifyingEmail ? setIsVerifyingEmail(false) : prevStep()}
                  onNext={() => {}} // Non usato qui
                  hideNext
                >
                  {isVerifyingEmail ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode" className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Codice di Verifica</Label>
                        <Input 
                          placeholder="000000" 
                          type="text" 
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-bold"
                          maxLength={6}
                        />
                      </div>
                      
                      <Button 
                        disabled={isSubmitting || verificationCode.length !== 6}
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            const res = await verifyEmailCodeAction(formData.email, verificationCode);
                            if (res.success) {
                              toast.success("Email verificata con successo!");
                              // Now login automatically
                              const signInRes = await signIn("credentials", { 
                                email: formData.email, 
                                password: formData.password, 
                                redirect: false 
                              });
                              
                              if (signInRes?.error) {
                                toast.error("Verifica completata, ma errore nel login. Per favore accedi manualmente.");
                                setIsVerifyingEmail(false);
                                setIsLoginMode(true);
                              } else {
                                await update();
                                setStep(2);
                              }
                            } else {
                              toast.error(res.error || "Codice non valido.");
                            }
                          } catch (err) {
                            toast.error("Errore durante la verifica.");
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-bold text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 group"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                          <>
                            <span>Verifica e Continua</span>
                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>

                      <div className="text-center">
                        <button 
                          onClick={async () => {
                            toast.info("Invio nuovo codice...");
                            await generateVerificationCode(formData.email);
                            toast.success("Codice inviato!");
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-pa-blue transition-colors"
                        >
                          Non hai ricevuto il codice? <span className="text-pa-blue underline underline-offset-4">Inviamene un altro</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-slate-500 ml-1">Email</Label>
                        <Input 
                          placeholder="mario.rossi@email.com" 
                          type="email" 
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-bold text-slate-500 ml-1">Password</Label>
                        <Input 
                          placeholder="Minimo 8 caratteri" 
                          type="password" 
                          id="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all"
                        />
                      </div>
                      
                      {!isLoginMode && (
                        <div className="py-2 flex justify-center">
                          <Turnstile 
                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} 
                            options={{ theme: "light" }}
                            onSuccess={(token) => setTurnstileToken(token)}
                          />
                        </div>
                      )}

                      <Button 
                        disabled={isSubmitting || !formData.email || formData.password.length < 8 || (!isLoginMode && !turnstileToken)}
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            if (isLoginMode) {
                              // LOGIN
                              const res = await signIn("credentials", { 
                                email: formData.email, 
                                password: formData.password, 
                                redirect: false 
                              });
                              
                              if (res?.error) {
                                toast.error("Credenziali non valide.");
                              } else {
                                await update();
                                setStep(2);
                              }
                            } else {
                              // REGISTRATION
                              const res = await registerUserAction({ 
                                email: formData.email, 
                                password: formData.password,
                                turnstileToken
                              });

                              if (res.success) {
                                if (res.message) {
                                  toast.info(res.message);
                                } else {
                                  toast.success("Account creato! Verifica la tua email.");
                                }
                                setIsVerifyingEmail(true);
                              } else {
                                toast.error(res.error || "Errore nella registrazione");
                              }
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error("Si è verificato un errore.");
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-emerald-800 text-white transition-all font-bold text-lg shadow-xl shadow-slate-200 mt-2 flex items-center justify-center gap-2 group"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <span>{isLoginMode ? "Accedi" : "Crea Account"}</span>
                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-slate-100"></span>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-slate-300">
                          <span className="bg-white px-4">Oppure</span>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                          className="w-full h-12 rounded-xl border-slate-100 bg-white hover:bg-slate-50 transition-all font-bold text-slate-700 flex items-center justify-center gap-3 text-sm"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.191 2.691 1.245 6.655l4.021 3.11z" />
                            <path fill="#34A853" d="M16.04 18.013c-1.09.593-2.325.896-3.613.896a7.077 7.077 0 0 1-6.719-4.856l-4.021 3.11C3.645 21.127 7.564 24 12 24c3.082 0 5.855-1.023 7.855-2.773l-3.815-3.214z" />
                            <path fill="#4285F4" d="M19.855 21.227c2.325-2.062 3.655-5.127 3.655-8.864 0-.833-.083-1.636-.233-2.39H12v4.527h6.41c-.267 1.44-.099 2.708-.736 3.842l2.181 2.885z" />
                            <path fill="#FBBC05" d="M5.668 14.053a7.033 7.033 0 0 1 0-4.288L1.647 6.655A12.022 12.022 0 0 0 0 12c0 1.91.445 3.718 1.245 5.345l4.423-3.292z" />
                          </svg>
                          {isLoginMode ? "Accedi con Google" : "Registrati con Google"}
                        </Button>
                        <div className="text-center mt-2">
                          <p className="text-[11px] text-slate-400 font-medium">
                            {isLoginMode ? "Non hai un account?" : "Hai già un account?"} <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-emerald-600 font-bold hover:underline">{isLoginMode ? "Registrati qui" : "Accedi qui"}</button>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </StepLayout>
              )}

              {step === 2 && role === "professional" && (
                <StepLayout 
                  title="Dati Personali" 
                  description="Come ti presenterai agli altri."
                  onBack={prevStep}
                  onNext={nextStep}
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="firstName" className="font-bold text-slate-700 ml-1">Nome</Label>
                      <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="es. Mario" className="h-12 rounded-xl border-slate-100" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="lastName" className="font-bold text-slate-700 ml-1">Cognome</Label>
                      <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="es. Rossi" className="h-12 rounded-xl border-slate-100" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="title" className="font-bold text-slate-700 ml-1">Titolo Professionale</Label>
                    <Input id="title" value={formData.title} onChange={handleChange} placeholder="es. Senior Backend Engineer" className="h-12 rounded-xl border-slate-100" />
                  </div>
                  <PhotoUpload 
                    label="Foto Profilo" 
                    value={formData.photoUrl} 
                    onChange={(url) => setFormData({ ...formData, photoUrl: url })} 
                  />
                </StepLayout>
              )}

              {step === 3 && role === "professional" && (
                <StepLayout 
                  title="Macro Cluster" 
                  description="In quali settori ti muovi?"
                  onBack={prevStep}
                  onNext={nextStep}
                  nextDisabled={formData.selectedClusters.length === 0}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {catalog.map(cluster => (
                      <button
                        key={cluster.id}
                        onClick={() => {
                          const exists = formData.selectedClusters.includes(cluster.slug);
                          setFormData({
                            ...formData,
                            selectedClusters: exists 
                              ? formData.selectedClusters.filter(s => s !== cluster.slug)
                              : [...formData.selectedClusters, cluster.slug]
                          });
                        }}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all font-bold text-sm",
                          formData.selectedClusters.includes(cluster.slug)
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200"
                            : "bg-white border-slate-100 text-slate-600 hover:border-emerald-400"
                        )}
                      >
                        {cluster.label}
                      </button>
                    ))}
                  </div>
                </StepLayout>
              )}

              {step === 4 && role === "professional" && (
                <StepLayout 
                  title="Le tue Top 3 Skill" 
                  description="Scegli esattamente 3 competenze chiave."
                  onBack={prevStep}
                  onNext={nextStep}
                  nextDisabled={formData.topSkills.length !== 3}
                >
                  <div className="space-y-6">
                    {catalog.filter(c => formData.selectedClusters.includes(c.slug)).map(cluster => (
                      <div key={cluster.id} className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{cluster.label}</h3>
                        <div className="flex flex-wrap gap-2">
                          {cluster.skills.map((skill: any) => (
                            <button
                              key={skill.id}
                              onClick={() => {
                                const exists = formData.topSkills.includes(skill.slug);
                                if (!exists && formData.topSkills.length >= 3) return;
                                setFormData({
                                  ...formData,
                                  topSkills: exists 
                                    ? formData.topSkills.filter(s => s !== skill.slug)
                                    : [...formData.topSkills, skill.slug]
                                });
                              }}
                              className={cn(
                                "px-4 py-2 rounded-full border text-sm transition-all font-semibold",
                                formData.topSkills.includes(skill.slug)
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                              )}
                            >
                              {skill.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">Skill selezionate:</span>
                    <span className={cn(
                      "text-xl font-black tabular-nums",
                      formData.topSkills.length === 3 ? "text-emerald-600" : "text-slate-300"
                    )}>
                      {formData.topSkills.length}/3
                    </span>
                  </div>
                </StepLayout>
              )}

              {step === 5 && role === "professional" && (
                <StepLayout 
                  title="Tariffa & RAL" 
                  description="La trasparenza è il nostro valore."
                  onBack={prevStep}
                  onNext={nextStep}
                >
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-3">
                      <Label htmlFor="rateAmount" className="font-bold text-slate-700 ml-1">Tariffa (EUR)</Label>
                      <Input id="rateAmount" value={formData.rateAmount} onChange={handleChange} type="number" placeholder="500" className="h-12 rounded-xl border-slate-100" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="rateType" className="font-bold text-slate-700 ml-1">Tipo</Label>
                      <Select 
                        value={formData.rateType}
                        onValueChange={(val) => setFormData({ ...formData, rateType: val as any })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Giorno</SelectItem>
                          <SelectItem value="hourly">Ora</SelectItem>
                          <SelectItem value="ral_annual">RAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </StepLayout>
              )}

              {step === 6 && role === "professional" && (
                <StepLayout 
                  title="Bio & Conclusione" 
                  description="Raccontaci la tua marcia in più."
                  onBack={prevStep}
                  onNext={handleComplete}
                  nextLabel={isSubmitting ? "Salvataggio..." : "Inizia a fare swipe"}
                  loading={isSubmitting}
                >
                  <div className="space-y-3">
                    <Label htmlFor="bio" className="font-bold text-slate-700 ml-1">Bio Breve</Label>
                    <Textarea 
                      id="bio" 
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Raccontaci chi sei in due righe..." 
                      className="min-h-[140px] rounded-[1.5rem] border-slate-100 p-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <Sparkles className="text-emerald-600" size={24} />
                    <p className="text-xs text-emerald-800 font-bold leading-relaxed italic">
                      I profili con una bio chiara e onesta ricevono il 40% di match in più.
                    </p>
                  </div>
                </StepLayout>
              )}

              {step === 2 && role === "company" && (
                <StepLayout 
                  title="Dati Aziendali" 
                  description="Verifichiamo la tua azienda per la sicurezza di tutti."
                  onBack={prevStep}
                  onNext={handleComplete}
                  nextLabel={isSubmitting ? "Salvataggio..." : "Conferma e Inizia"}
                  loading={isSubmitting}
                  nextDisabled={!validateItalianVAT(formData.vatNumber) || !formData.vatDisclaimerAccepted || !formData.companyName}
                >
                  <div className="space-y-3">
                    <Label htmlFor="companyName" className="font-bold text-slate-700 ml-1">Nome Azienda</Label>
                    <Input id="companyName" value={formData.companyName} onChange={handleChange} placeholder="es. Skillr S.r.l." className="h-12 rounded-xl border-slate-100" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="vatNumber" className="font-bold text-slate-700 ml-1">Partita IVA</Label>
                    <Input 
                      id="vatNumber" 
                      value={formData.vatNumber} 
                      onChange={handleChange} 
                      placeholder="11 cifre (es. 12345678901)" 
                      className={cn(
                        "h-12 rounded-xl border-slate-100",
                        formData.vatNumber.length > 0 && !validateItalianVAT(formData.vatNumber) && "border-red-500 focus:ring-red-500",
                        formData.vatNumber.length > 0 && validateItalianVAT(formData.vatNumber) && "border-emerald-500 focus:ring-emerald-500"
                      )} 
                      maxLength={13} 
                    />
                    {formData.vatNumber.length > 0 && !validateItalianVAT(formData.vatNumber) && (
                      <p className="text-[10px] text-red-500 font-bold ml-1">Formato Partita IVA non valido.</p>
                    )}
                  </div>
                  <PhotoUpload 
                    label="Logo Aziendale" 
                    value={formData.photoUrl} 
                    onChange={(url) => setFormData({ ...formData, photoUrl: url })} 
                  />
                  
                  {/* Disclaimer */}
                  <div className="mt-6 p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Switch 
                          checked={formData.vatDisclaimerAccepted}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, vatDisclaimerAccepted: checked }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-700 leading-none">Assunzione di Responsabilità</Label>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Dichiaro che i dati forniti sono veritieri. La piattaforma non si assume responsabilità per dichiarazioni false o mendaci.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 mt-4">
                    <ShieldCheck className="text-emerald-600" size={24} />
                    <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
                      La verifica della P.IVA garantisce che sulla piattaforma ci siano solo realtà professionali serie.
                    </p>
                  </div>
                </StepLayout>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RoleOption({ id, value, icon, label, description, isSelected }: { id: string, value: string, icon: React.ReactNode, label: string, description: string, isSelected: boolean }) {
  return (
    <div className="relative group h-full">
      <RadioGroupItem value={value} id={id} className="sr-only" />
      <Label
        htmlFor={id}
        className={cn(
          "flex flex-col items-center justify-between rounded-3xl border-4 p-6 cursor-pointer transition-all h-full relative overflow-hidden",
          isSelected 
            ? "bg-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-200 ring-4 ring-emerald-500/20" 
            : "bg-white border-slate-50 text-slate-900 hover:border-emerald-200 hover:bg-slate-50 shadow-sm"
        )}
      >
        <div className={cn(
          "absolute top-3 right-3 transition-all transform",
          isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}>
          <div className="bg-white text-emerald-600 rounded-full p-1 shadow-lg">
            <Check size={14} strokeWidth={4} />
          </div>
        </div>
        
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-4",
          isSelected ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400 group-hover:scale-105"
        )}>
           {icon}
        </div>
        
        <span className={cn(
          "text-center font-black text-lg mb-0.5",
          isSelected ? "text-white" : "text-slate-900"
        )}>
          {label}
        </span>
        
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest leading-tight text-center",
          isSelected ? "text-emerald-100" : "text-slate-400 opacity-80"
        )}>
          {description}
        </span>
      </Label>
    </div>
  );
}

function StepLayout({ title, description, children, onBack, onNext, nextLabel = "Continua", loading = false, nextDisabled = false, hideNext = false }: { title: string, description: string, children: React.ReactNode, onBack: () => void, onNext: () => void, nextLabel?: string, loading?: boolean, nextDisabled?: boolean, hideNext?: boolean }) {
  return (
    <>
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle className="text-2xl font-display font-bold italic text-slate-950">{title}</CardTitle>
        <CardDescription className="text-slate-500 font-medium text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8 pt-2 space-y-4">
        {children}
      </CardContent>
      <CardFooter className="px-8 pb-10 pt-2 flex justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="rounded-xl h-12 px-6 font-black text-slate-400 hover:text-slate-900 text-sm">Indietro</Button>
        {!hideNext && (
          <Button 
            onClick={onNext} 
            disabled={loading || nextDisabled}
            className="rounded-2xl h-14 px-10 bg-slate-950 hover:bg-emerald-800 text-white transition-all font-black text-base shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            <span>{nextLabel}</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </CardFooter>
    </>
  );
}
