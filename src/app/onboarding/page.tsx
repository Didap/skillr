"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { User, Building2, ChevronRight, Check, Zap, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence, useIsPresent } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { registerUserAction } from "@/app/actions/auth";
import { verifyEmailCodeAction, generateVerificationCode } from "@/app/actions/verification";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { getMetadataCatalog } from "@/app/actions/metadata";
import { validateItalianVAT } from "@/lib/vat";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FileCardUpload } from "@/components/ui/file-card-upload";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { credentialsErrorMessage } from "@/components/auth/login-errors";
import { duration, ease } from "@/lib/motion";
import { ONBOARDING_DRAFT_KEY as DRAFT_KEY } from "@/lib/onboarding-draft";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Phones: each step portals its Indietro/Continua buttons into one fixed bottom bar that lives
// outside the animated step, so the bar stays put while the step content slides.
const StepNavSlot = createContext<HTMLElement | null>(null);

// Forward steps arrive from the right, going back arrives from the left.
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
  center: { opacity: 1, x: 0, transition: { duration: duration.state, ease: ease.out } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -32, transition: { duration: duration.feedback, ease: ease.in } }),
};

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

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Slide direction follows whichever way the step number moved, wherever it was changed from
  const [prevStepSeen, setPrevStepSeen] = useState(0);
  const [direction, setDirection] = useState(1);
  if (step !== prevStepSeen) {
    setDirection(step > prevStepSeen ? 1 : -1);
    setPrevStepSeen(step);
  }
  const [navSlot, setNavSlot] = useState<HTMLElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<"professional" | "company" | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(undefined);
  // Without a site key (local dev) there is no widget; the server skips the check as well.
  const turnstileReady = !TURNSTILE_SITE_KEY || !!turnstileToken;

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
    bioLong: "",
    cvUrl: "",
    portfolioUrls: [] as string[],
    companyName: "",
    vatNumber: "",
    vatDisclaimerAccepted: false,
    email: "",
    password: "",
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    async function fetchCatalog() {
      const res = await getMetadataCatalog();
      if (res.success) {
        setCatalog(res.data);
      }
    }
    fetchCatalog();
  }, []);

  useEffect(() => {
    // Persistent state recovery
    const savedData = localStorage.getItem(DRAFT_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      Promise.resolve().then(() => {
        if (parsed.role) setRole(parsed.role);
        if (parsed.formData) {
          // Older drafts stored the email and the plaintext password: never restore those.
          const restored = { ...parsed.formData };
          delete restored.email;
          delete restored.password;
          setFormData(prev => ({ ...prev, ...restored }));
        }
        // Se l'utente è appena tornato da un login, saltiamo allo step 2 (dati personali)
        if (status === "authenticated" && step === 1) {
          setStep(2);
        }
      });
    }
  }, [status, step]);

  useEffect(() => {
    if (role) {
      // The draft sits in localStorage in clear text: keep credentials out of it.
      const draft = { ...formData, email: undefined, password: undefined };
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ role, formData: draft, step }));
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

  // Turnstile tokens are single use: drop the one just sent and ask the widget for a new one.
  const consumeTurnstile = () => {
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  // A new step starts at its top: on phones the previous step may have been scrolled far down
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Flexible widget fills the row (min 300px); on the narrowest phones it borrows a little of
  // the card padding so it is never clipped.
  const turnstileWidget = TURNSTILE_SITE_KEY ? (
    <div className="-mx-3 sm:mx-0">
      <Turnstile
        ref={turnstileRef}
        siteKey={TURNSTILE_SITE_KEY}
        options={{ theme: "light", size: "flexible" }}
        onSuccess={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
        onError={() => setTurnstileToken(null)}
      />
    </div>
  ) : null;

  const handleComplete = async () => {
    if (isSubmitting || !role) return;
    
    setIsSubmitting(true);
    
    try {
      // Profile fields only: the email and password never leave the account step.
      const result = await completeOnboardingAction({
        role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        photoUrl: formData.photoUrl,
        topSkills: formData.topSkills,
        selectedClusters: formData.selectedClusters,
        rateAmount: formData.rateAmount,
        rateType: formData.rateType,
        bio: formData.bio,
        bioLong: formData.bioLong,
        cvUrl: formData.cvUrl,
        portfolioUrls: formData.portfolioUrls,
        companyName: formData.companyName,
        vatNumber: formData.vatNumber,
        vatDisclaimerAccepted: formData.vatDisclaimerAccepted,
      });
      
      if (result.success) {
        localStorage.removeItem(DRAFT_KEY);
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
    <div className="min-h-dvh flex items-center justify-center">
      <Zap className="text-rosso-500 animate-pulse motion-reduce:animate-none" size={48} />
    </div>
  );

  // Steps are 0-based: professionals go through 0-7, companies through 0-2.
  const totalSteps = role === "professional" ? 8 : 3;

  return (
    <StepNavSlot.Provider value={navSlot}>
    <div className="min-h-dvh bg-background flex flex-col items-center justify-start md:justify-center px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-6 selection:bg-rosso-100 selection:text-rosso-900">
      <div className="max-w-lg w-full">
        {/* Header: compact with a segmented progress strip on phones, centred with a step badge from md up */}
        <div className="mb-5 md:mb-8 md:text-center">
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rosso-50 text-rosso-700 text-[11px] font-black uppercase tracking-[0.15em] mb-4">
            <Zap size={10} fill="currentColor" /> Step {step + 1} di {totalSteps}
          </div>
          <div className="flex items-baseline justify-between gap-4 mb-3 md:mb-0 md:block">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-viola-950 tracking-tight">
              Configura Profilo
            </h1>
            <span className="md:hidden text-sm font-bold text-viola-500 tabular-nums shrink-0" aria-label={`Step ${step + 1} di ${totalSteps}`}>
              {step + 1}/{totalSteps}
            </span>
          </div>
          <div className="flex md:hidden gap-1.5" aria-hidden="true">
            {Array.from({ length: totalSteps }, (_, i) => (
              <span key={i} className="h-1.5 flex-1 rounded-full bg-viola-100 overflow-hidden">
                <span
                  className={cn(
                    "block h-full rounded-full bg-rosso-500 origin-left transition-transform duration-300 ease-out motion-reduce:transition-none",
                    i <= step ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </span>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="hidden md:flex mb-8 justify-between items-center relative px-6">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-viola-100 -translate-y-1/2 z-0 rounded-full" />
          <motion.div 
            className="absolute top-1/2 left-0 h-1 bg-rosso-500 -translate-y-1/2 z-0 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
          />
          {Array.from({ length: totalSteps }, (_, i) => i).map((i) => (
            <div 
              key={i}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 shadow-sm",
                step === i ? "bg-rosso-600 border-rosso-600 text-white scale-125 ring-4 ring-rosso-500/20" : 
                step > i ? "bg-rosso-500 border-rosso-500 text-white" : 
                "bg-white border-viola-100 text-viola-300"
              )}
            >
              {step > i ? <Check size={14} strokeWidth={4} /> : <span className="font-black text-[10px]">{i + 1}</span>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* overflow-visible lets the skill counter stay sticky while the page scrolls */}
            <Card className="border-viola-100 shadow-premium rounded-[2rem] bg-white overflow-visible">
              {step === 0 && (
                <>
                  <CardHeader className="text-center pt-8 md:pt-10 pb-2 md:pb-4 px-5 md:px-8">
                    <CardTitle className="text-3xl font-display font-bold text-viola-950">Chi sei?</CardTitle>
                    <CardDescription className="text-viola-500 font-semibold mt-1 text-[15px] md:text-sm">Scegli il tuo ruolo</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 md:px-8 pb-6 md:pb-8 pt-4">
                    <RadioGroup
                      value={role || ""}
                      onValueChange={(val) => setRole(val as "professional" | "company")}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4"
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
                  <StepNav onNext={nextStep} nextDisabled={!role} />
                </>
              )}

              {step === 1 && (
                <StepLayout 
                  title={isVerifyingEmail ? "Verifica la tua email" : (isLoginMode ? "Accedi al tuo account" : "Crea il tuo account")} 
                  description={
                    isVerifyingEmail 
                      ? `Inserisci il codice a 6 cifre inviato a ${formData.email}. Se hai già un account, ti abbiamo scritto come accedere.`  
                      : (isLoginMode ? "Bentornato! Inserisci le tue credenziali." : "Per salvare i tuoi progressi e iniziare a fare swipe.")
                  }
                  onBack={() => isVerifyingEmail ? setIsVerifyingEmail(false) : prevStep()}
                  onNext={() => {}} // Non usato qui
                  hideNext
                >
                  {isVerifyingEmail ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode" className="text-xs font-bold text-viola-500 ml-1 uppercase tracking-widest">Codice di Verifica</Label>
                        <Input 
                          placeholder="000000"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-viola-100 bg-viola-50/30 focus:bg-white transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-bold"
                          maxLength={6}
                        />
                      </div>
                      
                      {turnstileWidget}

                      <Button
                        disabled={isSubmitting || verificationCode.length !== 6 || !turnstileReady}
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
                                turnstileToken: turnstileToken ?? "",
                                redirect: false
                              });
                              consumeTurnstile();

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
                                                    } catch {

                            toast.error("Errore durante la verifica.");
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="w-full h-14 rounded-2xl bg-rosso-600 hover:bg-rosso-700 text-white transition-all font-bold text-lg shadow-xl shadow-rosso-100 flex items-center justify-center gap-2 group"
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
                          type="button"
                          onClick={async () => {
                            toast.info("Invio nuovo codice...");
                            const res = await generateVerificationCode(formData.email);
                            if (res.success) {
                              toast.success("Codice inviato!");
                            } else {
                              toast.error(res.error);
                            }
                          }}
                          className="min-h-11 px-2 text-sm md:text-xs font-bold text-viola-500 hover:text-blu transition-colors"
                        >
                          Non hai ricevuto il codice? <span className="text-blu underline underline-offset-4">Inviamene un altro</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-viola-500 ml-1">Email</Label>
                        <Input 
                          placeholder="mario.rossi@email.com" 
                          type="email"
                          id="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="h-12 md:h-14 px-4 rounded-2xl border-viola-100 bg-viola-50/30 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-bold text-viola-500 ml-1">Password</Label>
                        <Input 
                          placeholder="Minimo 8 caratteri" 
                          type="password"
                          id="password"
                          autoComplete={isLoginMode ? "current-password" : "new-password"}
                          value={formData.password}
                          onChange={handleChange}
                          className="h-12 md:h-14 px-4 rounded-2xl border-viola-100 bg-viola-50/30 focus:bg-white transition-colors"
                        />
                      </div>
                      
                      {!isLoginMode && (
                        <div className="flex items-start gap-3 p-4 bg-viola-50/50 rounded-2xl border border-viola-100 mb-2">
                          <input 
                            type="checkbox" 
                            id="legalConsent" 
                            checked={legalConsent} 
                            onChange={(e) => setLegalConsent(e.target.checked)}
                            className="mt-0.5 h-5 w-5 md:h-4 md:w-4 shrink-0 rounded border-viola-300 accent-rosso-600 text-rosso-600 focus:ring-rosso-500 cursor-pointer"
                          />
                          <Label htmlFor="legalConsent" className="block text-[13px] md:text-[11px] font-medium text-viola-500 leading-relaxed cursor-pointer select-none">
                            Accetto i <Link href="/terms" target="_blank" className="text-rosso-600 font-bold underline decoration-rosso-200">Termini di Servizio</Link> e la <Link href="/privacy" target="_blank" className="text-rosso-600 font-bold underline decoration-rosso-200">Privacy Policy</Link> di Helllo.
                          </Label>
                        </div>
                      )}

                      {sendError && !isLoginMode && (
                        <div role="alert" className="p-4 rounded-2xl border border-rosso-100 bg-rosso-50 text-xs font-bold text-rosso-600 leading-relaxed">
                          {sendError} Premi di nuovo &quot;Crea Account&quot; per riprovare.
                        </div>
                      )}

                      {turnstileWidget}

                      <Button
                        disabled={isSubmitting || !formData.email || formData.password.length < 8 || (!isLoginMode && !legalConsent) || !turnstileReady}
                        onClick={async () => {
                          setIsSubmitting(true);
                          setSendError(null);
                          try {
                            if (isLoginMode) {
                              // LOGIN
                              const res = await signIn("credentials", {
                                email: formData.email,
                                password: formData.password,
                                turnstileToken: turnstileToken ?? "",
                                redirect: false
                              });
                              consumeTurnstile();

                              if (res?.error) {
                                toast.error(credentialsErrorMessage(res.code));
                              } else {
                                await update();
                                setStep(2);
                              }
                            } else {
                              // REGISTRATION
                               const res = await registerUserAction({
                                 email: formData.email,
                                 password: formData.password,
                                 turnstileToken: turnstileToken ?? undefined,
                                 legalConsent: legalConsent
                               });
                               consumeTurnstile();

                              if (res.success) {
                                toast.success("Controlla la tua email per continuare.");
                                setIsVerifyingEmail(true);
                              } else if (res.reason === "send_failed") {
                                setSendError(res.error);
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
                        className="w-full h-14 rounded-2xl bg-viola-950 hover:bg-rosso-800 text-white transition-all font-bold text-lg shadow-xl shadow-viola-200 mt-2 flex items-center justify-center gap-2 group"
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
                          <span className="w-full border-t border-viola-100"></span>
                        </div>
                        <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-black text-viola-500">
                          <span className="bg-white px-4">Oppure</span>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                          className="w-full h-12 rounded-xl border-viola-100 bg-white hover:bg-viola-50 transition-all font-bold text-viola-700 flex items-center justify-center gap-3 text-sm"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.191 2.691 1.245 6.655l4.021 3.11z" />
                            <path fill="#34A853" d="M16.04 18.013c-1.09.593-2.325.896-3.613.896a7.077 7.077 0 0 1-6.719-4.856l-4.021 3.11C3.645 21.127 7.564 24 12 24c3.082 0 5.855-1.023 7.855-2.773l-3.815-3.214z" />
                            <path fill="#4285F4" d="M19.855 21.227c2.325-2.062 3.655-5.127 3.655-8.864 0-.833-.083-1.636-.233-2.39H12v4.527h6.41c-.267 1.44-.099 2.708-.736 3.842l2.181 2.885z" />
                            <path fill="#FBBC05" d="M5.668 14.053a7.033 7.033 0 0 1 0-4.288L1.647 6.655A12.022 12.022 0 0 0 0 12c0 1.91.445 3.718 1.245 5.345l4.423-3.292z" />
                          </svg>
                          {isLoginMode ? "Accedi con Google" : "Registrati con Google"}
                        </Button>
                        <div className="text-center">
                          <p className="text-sm md:text-xs text-viola-500 font-medium">
                            {isLoginMode ? "Non hai un account?" : "Hai già un account?"} <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="inline-flex items-center min-h-11 px-1 text-rosso-700 font-bold hover:underline">{isLoginMode ? "Registrati qui" : "Accedi qui"}</button>
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
                  nextDisabled={!formData.firstName.trim() || !formData.lastName.trim()}
                >
                  <div className="grid grid-cols-2 gap-3 md:gap-6">
                    <div className="space-y-3 min-w-0">
                      <Label htmlFor="firstName" className="font-bold text-viola-700 ml-1">Nome</Label>
                      <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="es. Mario" className="h-12 rounded-xl border-viola-100" />
                    </div>
                    <div className="space-y-3 min-w-0">
                      <Label htmlFor="lastName" className="font-bold text-viola-700 ml-1">Cognome</Label>
                      <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="es. Rossi" className="h-12 rounded-xl border-viola-100" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="title" className="font-bold text-viola-700 ml-1">Titolo Professionale</Label>
                    <Input id="title" value={formData.title} onChange={handleChange} placeholder="es. Senior Backend Engineer" className="h-12 rounded-xl border-viola-100" />
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
                  <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                    {catalog.map(cluster => (
                      <button
                        key={cluster.id}
                        type="button"
                        aria-pressed={formData.selectedClusters.includes(cluster.slug)}
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
                          "pressable min-h-14 p-4 rounded-2xl border text-left transition-colors font-bold text-sm leading-snug wrap-break-word",
                          formData.selectedClusters.includes(cluster.slug)
                            ? "bg-rosso-600 border-rosso-600 text-white shadow-lg shadow-rosso-200"
                            : "bg-white border-viola-100 text-viola-600 hover:border-rosso-400"
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
                        <h3 className="text-xs font-black uppercase tracking-widest text-viola-500">{cluster.label}</h3>
                        <div className="flex flex-wrap gap-2">
                          {cluster.skills.map((skill: Skill) => (
                            <button
                              key={skill.id}
                              type="button"
                              aria-pressed={formData.topSkills.includes(skill.slug)}
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
                                "pressable min-h-11 md:min-h-10 px-4 py-2 rounded-full border text-sm transition-colors font-semibold",
                                formData.topSkills.includes(skill.slug)
                                  ? "bg-viola-900 border-viola-900 text-white"
                                  : "bg-white border-viola-100 text-viola-500 hover:border-viola-300"
                              )}
                            >
                              {skill.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Phones: stays in view above the bottom bar while scrolling the skill list */}
                  <div className="sticky z-10 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:static mt-4 p-4 bg-viola-50 rounded-2xl flex justify-between items-center shadow-card md:shadow-none">
                    <span className="text-sm font-bold text-viola-500">Skill selezionate:</span>
                    <span className={cn(
                      "text-xl font-black tabular-nums",
                      formData.topSkills.length === 3 ? "text-rosso-600" : "text-viola-300"
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
                  <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <div className="col-span-2 space-y-3 min-w-0">
                      <Label htmlFor="rateAmount" className="font-bold text-viola-700 ml-1">Tariffa (EUR)</Label>
                      <Input id="rateAmount" value={formData.rateAmount} onChange={handleChange} type="number" inputMode="numeric" placeholder="500" className="h-12 rounded-xl border-viola-100" />
                    </div>
                    <div className="space-y-3 min-w-0">
                      <Label htmlFor="rateType" className="font-bold text-viola-700 ml-1">Tipo</Label>
                      <Select 
                        value={formData.rateType}
                        onValueChange={(val) => setFormData({ ...formData, rateType: val as "daily" | "hourly" | "ral_annual" })}
                      >
                        <SelectTrigger className="h-12! w-full rounded-xl border-viola-100">
                          <SelectValue>
                            {formData.rateType === "daily" ? "Giorno" : 
                             formData.rateType === "hourly" ? "Ora" : 
                             formData.rateType === "ral_annual" ? "RAL" : 
                             "Seleziona tipo"}
                          </SelectValue>
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
                  title="Identità & Documenti" 
                  description="Carica il tuo CV e Portfolio per completare il profilo."
                  onBack={prevStep}
                  onNext={nextStep}
                >
                  <div className="space-y-6">
                    <FileCardUpload 
                      label="Curriculum Vitae (PDF)" 
                      description="Il tuo CV professionale"
                      accept=".pdf"
                      value={formData.cvUrl}
                      onChange={(url) => setFormData({ ...formData, cvUrl: url })}
                    />
                    
                    <FileCardUpload 
                      label="Portfolio / Case Studies" 
                      description="Mostra i tuoi lavori migliori"
                      accept=".pdf,image/*"
                      value={formData.portfolioUrls[0] || ""} // Per ora ne gestiamo uno solo semplice
                      onChange={(url) => setFormData({ ...formData, portfolioUrls: url ? [url] : [] })}
                    />

                    <div className="p-5 bg-viola-50 rounded-3xl border border-viola-100">
                       <p className="text-[11px] text-viola-500 leading-relaxed font-medium">
                        <span className="font-bold text-blu">Nota:</span> I documenti caricati verranno mostrati alle aziende durante la fase di matching per validare le tue competenze.
                       </p>
                    </div>
                  </div>
                </StepLayout>
              )}

              {step === 7 && role === "professional" && (
                <StepLayout 
                  title="Bio & Conclusione" 
                  description="Raccontaci la tua marcia in più."
                  onBack={prevStep}
                  onNext={handleComplete}
                  nextLabel={isSubmitting ? "Salvataggio..." : "Inizia a fare swipe"}
                  loading={isSubmitting}
                >
                  <div className="space-y-3">
                    <Label htmlFor="bioLong" className="font-bold text-viola-700 ml-1">Bio Professionale</Label>
                    <Textarea 
                      id="bioLong" 
                      value={formData.bioLong}
                      onChange={handleChange}
                      placeholder="Raccontaci chi sei in due righe..." 
                      className="min-h-[140px] rounded-[1.5rem] border-viola-100 p-4 focus:ring-2 focus:ring-rosso-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-rosso-50 rounded-2xl border border-rosso-100">
                    <Sparkles className="text-rosso-600" size={24} />
                    <p className="text-xs text-rosso-800 font-bold leading-relaxed italic">
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
                    <Label htmlFor="companyName" className="font-bold text-viola-700 ml-1">Nome Azienda</Label>
                    <Input id="companyName" value={formData.companyName} onChange={handleChange} placeholder="es. Helllo S.r.l." className="h-12 rounded-xl border-viola-100" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="vatNumber" className="font-bold text-viola-700 ml-1">Partita IVA</Label>
                    <Input 
                      id="vatNumber" 
                      value={formData.vatNumber} 
                      onChange={handleChange} 
                      placeholder="11 cifre (es. 12345678901)" 
                      className={cn(
                        "h-12 rounded-xl border-viola-100",
                        formData.vatNumber.length > 0 && !validateItalianVAT(formData.vatNumber) && "border-rosso-500 focus:ring-rosso-500",
                        formData.vatNumber.length > 0 && validateItalianVAT(formData.vatNumber) && "border-rosso-500 focus:ring-rosso-500"
                      )} 
                      maxLength={13} 
                    />
                    {formData.vatNumber.length > 0 && !validateItalianVAT(formData.vatNumber) && (
                      <p className="text-xs md:text-[11px] text-rosso-600 font-bold ml-1">Formato Partita IVA non valido.</p>
                    )}
                  </div>
                  <PhotoUpload 
                    label="Logo Aziendale" 
                    value={formData.photoUrl} 
                    onChange={(url) => setFormData({ ...formData, photoUrl: url })} 
                  />
                  
                  {/* Disclaimer */}
                  <div className="mt-6 p-5 bg-viola-50 rounded-3xl border border-viola-100 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Switch 
                          checked={formData.vatDisclaimerAccepted}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, vatDisclaimerAccepted: checked }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-viola-700 leading-none">Assunzione di Responsabilità</Label>
                        <p className="text-[11px] text-viola-500 leading-relaxed">
                          Dichiaro che i dati forniti sono veritieri. La piattaforma non si assume responsabilità per dichiarazioni false o mendaci.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-rosso-50 rounded-2xl border border-rosso-100 mt-4">
                    <ShieldCheck className="text-rosso-600" size={24} />
                    <p className="text-xs md:text-[11px] text-rosso-800 font-bold leading-relaxed">
                      La verifica della P.IVA garantisce che sulla piattaforma ci siano solo realtà professionali serie.
                    </p>
                  </div>
                </StepLayout>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phones: fixed step navigation; each step portals its buttons in here (hidden when empty) */}
      <div
        ref={setNavSlot}
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-viola-100 bg-white/90 backdrop-blur-xl px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] empty:hidden"
      />
    </div>
    </StepNavSlot.Provider>
  );
}

function RoleOption({ id, value, icon, label, description, isSelected }: { id: string, value: string, icon: React.ReactNode, label: string, description: string, isSelected: boolean }) {
  return (
    <div className="relative group h-full">
      <RadioGroupItem value={value} id={id} className="sr-only" />
      <Label
        htmlFor={id}
        className={cn(
          "pressable flex flex-row sm:flex-col items-center sm:justify-between gap-4 sm:gap-0 rounded-3xl border-4 p-4 pr-12 sm:p-6 cursor-pointer transition-colors h-full relative overflow-hidden",
          isSelected
            ? "bg-rosso-600 border-rosso-600 text-white shadow-2xl shadow-rosso-200 ring-4 ring-rosso-500/20"
            : "bg-white border-viola-50 text-viola-900 hover:border-rosso-200 hover:bg-viola-50 shadow-sm"
        )}
      >
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 right-4 sm:top-3 sm:right-3 sm:translate-y-0 transition-[opacity,scale] duration-200",
          isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}>
          <div className="bg-white text-rosso-600 rounded-full p-1 shadow-lg">
            <Check size={14} strokeWidth={4} />
          </div>
        </div>

        <div className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center transition-[background-color,color,scale] duration-300 sm:mb-4",
          isSelected ? "bg-white/20 text-white" : "bg-viola-50 text-viola-500 group-hover:scale-105"
        )}>
           {icon}
        </div>

        <div className="flex flex-col sm:items-center min-w-0">
          <span className={cn(
            "sm:text-center font-black text-lg mb-0.5",
            isSelected ? "text-white" : "text-viola-900"
          )}>
            {label}
          </span>

          <span className={cn(
            "text-[11px] font-black uppercase tracking-wider sm:tracking-widest leading-tight sm:text-center",
            isSelected ? "text-rosso-50" : "text-viola-500"
          )}>
            {description}
          </span>
        </div>
      </Label>
    </div>
  );
}

type StepNavProps = {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  loading?: boolean;
  nextDisabled?: boolean;
  hideNext?: boolean;
};

function StepNav({ onBack, onNext, nextLabel = "Continua", loading = false, nextDisabled = false, hideNext = false }: StepNavProps) {
  const slot = useContext(StepNavSlot);
  // While a step animates out its buttons stay on screen (the phone bar sits in the same
  // spot for every step): ignore taps on them, or a quick double tap would skip a step.
  const isPresent = useIsPresent();
  const handleNext = () => {
    if (isPresent) onNext();
  };
  const handleBack = onBack && (() => {
    if (isPresent) onBack();
  });
  const nextContent = (
    <>
      {loading ? <Loader2 className="animate-spin" size={18} /> : null}
      <span className="truncate">{nextLabel}</span>
      <ChevronRight className="h-5 w-5 shrink-0 md:group-hover:translate-x-1 transition-transform" />
    </>
  );

  return (
    <>
      {/* In the card from md up; on phones only when there is no bottom bar (the account step) */}
      <CardFooter
        className={cn(
          "px-5 md:px-8 pt-2 flex justify-between gap-4",
          onBack ? "pb-6 md:pb-10" : "pb-8 pt-0",
          !hideNext && "hidden md:flex"
        )}
      >
        {onBack && (
          <Button variant="ghost" onClick={handleBack} className="pressable rounded-xl h-12 px-6 font-black text-viola-500 hover:text-viola-900 text-sm">Indietro</Button>
        )}
        {!hideNext && (
          <Button
            onClick={handleNext}
            disabled={loading || nextDisabled}
            className={cn(
              "pressable group rounded-2xl h-14 px-10 bg-viola-950 hover:bg-rosso-800 text-white transition-colors font-black text-base shadow-xl shadow-viola-200 flex items-center justify-center gap-2",
              !onBack && "w-full text-lg"
            )}
          >
            {nextContent}
          </Button>
        )}
      </CardFooter>

      {!hideNext && slot && createPortal(
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="pressable shrink-0 rounded-2xl h-12 px-4 font-black text-viola-500 hover:text-viola-900 text-[15px]"
            >
              Indietro
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={loading || nextDisabled}
            className="pressable flex-1 min-w-0 rounded-2xl h-12 px-5 bg-viola-950 hover:bg-rosso-800 text-white transition-colors font-black text-base flex items-center justify-center gap-2"
          >
            {nextContent}
          </Button>
        </div>,
        slot
      )}
    </>
  );
}

function StepLayout({ title, description, children, ...nav }: StepNavProps & { title: string, description: string, children: React.ReactNode, onBack: () => void }) {
  return (
    <>
      <CardHeader className="px-5 md:px-8 pt-6 md:pt-8 pb-2 md:pb-4">
        <CardTitle className="text-2xl font-display font-bold text-viola-950">{title}</CardTitle>
        <CardDescription className="text-viola-500 font-medium text-[15px] md:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-5 md:px-8 pb-6 md:pb-8 pt-2 space-y-4">
        {children}
      </CardContent>
      <StepNav {...nav} />
    </>
  );
}
