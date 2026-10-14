"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { User, Building2, ChevronRight, Check, ShieldCheck, Sparkles, Loader2, AlertCircle } from "lucide-react";
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
import { Logo } from "@/components/brand/Logo";
import { LogoMark } from "@/components/brand/LogoMark";

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
    <div className="min-h-dvh flex items-center justify-center bg-crema" role="status" aria-label="Caricamento">
      <LogoMark className="size-14 animate-pulse motion-reduce:animate-none" />
    </div>
  );

  // Steps are 0-based: professionals go through 0-7, companies through 0-2.
  const totalSteps = role === "professional" ? 8 : 3;

  return (
    <StepNavSlot.Provider value={navSlot}>
    <div className="min-h-dvh bg-crema flex flex-col items-center justify-start md:justify-center px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:p-6">
      <div className="max-w-lg w-full">
        {/* Header: wordmark, headline and a segmented progress strip (viola track, rosso fill) */}
        <div className="mb-5 md:mb-8">
          <Logo className="h-8 md:h-9 mb-5 md:mb-8" />
          <div className="flex items-end justify-between gap-4 mb-3">
            <h1 className="text-title text-viola">
              Piacere di <span className="font-script text-rosso">conoscerti</span>
            </h1>
            <span className="text-label text-viola-500 tabular-nums shrink-0 pb-1" aria-label={`Passo ${step + 1} di ${totalSteps}`}>
              {step + 1}/{totalSteps}
            </span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: totalSteps }, (_, i) => (
              <span key={i} className="h-1.5 flex-1 rounded-full bg-viola/15 overflow-hidden">
                <span
                  className={cn(
                    "block h-full rounded-full bg-rosso origin-left transition-transform duration-300 ease-out motion-reduce:transition-none",
                    i <= step ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </span>
            ))}
          </div>
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
            <Card className="overflow-visible">
              {step === 0 && (
                <>
                  <CardHeader className="pt-6 md:pt-8 pb-2 px-5 md:px-8">
                    <CardTitle className="text-title text-viola">Chi sei?</CardTitle>
                    <CardDescription className="text-body text-viola-500">Scegli il tuo ruolo.</CardDescription>
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
                        <Label htmlFor="verificationCode" className="text-label text-viola">Codice di verifica</Label>
                        <Input 
                          placeholder="000000"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-16 text-center text-3xl font-bold tabular-nums tracking-[0.5em] placeholder:tracking-normal placeholder:text-base placeholder:font-medium"
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
                        className="group w-full h-14 text-base gap-2"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                          <>
                            <span>Verifica e continua</span>
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
                          className="min-h-11 px-2 rounded-full text-sm text-viola-500 hover:text-viola transition-colors"
                        >
                          Non hai ricevuto il codice? <span className="font-bold text-viola underline decoration-viola/40 underline-offset-4">Inviamene un altro</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-label text-viola">Email</Label>
                        <Input
                          placeholder="mario.rossi@email.com"
                          type="email"
                          id="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="h-12 md:h-14 px-5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-label text-viola">Password</Label>
                        <Input
                          placeholder="Minimo 8 caratteri"
                          type="password"
                          id="password"
                          autoComplete={isLoginMode ? "current-password" : "new-password"}
                          value={formData.password}
                          onChange={handleChange}
                          className="h-12 md:h-14 px-5"
                        />
                      </div>

                      {!isLoginMode && (
                        <div className="flex items-start gap-3 p-4 bg-crema rounded-2xl mb-2">
                          <input
                            type="checkbox"
                            id="legalConsent"
                            checked={legalConsent}
                            onChange={(e) => setLegalConsent(e.target.checked)}
                            className="mt-0.5 h-5 w-5 md:h-4 md:w-4 shrink-0 rounded border-viola-300 accent-rosso cursor-pointer"
                          />
                          <Label htmlFor="legalConsent" className="block text-label font-normal text-viola-500 leading-relaxed cursor-pointer select-none">
                            Accetto i <Link href="/terms" target="_blank" className="text-viola font-bold underline decoration-viola/40 underline-offset-2 hover:decoration-viola">Termini di Servizio</Link> e la <Link href="/privacy" target="_blank" className="text-viola font-bold underline decoration-viola/40 underline-offset-2 hover:decoration-viola">Privacy Policy</Link> di Helllo.
                          </Label>
                        </div>
                      )}

                      {sendError && !isLoginMode && (
                        <div role="alert" className="flex items-start gap-3 p-4 rounded-2xl bg-rosso-50 text-label text-destructive leading-relaxed">
                          <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
                          <p>{sendError} Premi di nuovo &quot;Crea account&quot; per riprovare.</p>
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
                        className="group w-full h-14 mt-2 text-base gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <span>{isLoginMode ? "Accedi" : "Crea account"}</span>
                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-viola/15"></span>
                        </div>
                        <div className="relative flex justify-center text-label text-viola-500">
                          <span className="bg-white px-4">oppure</span>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <Button
                          variant="outline"
                          onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                          className="w-full h-12 gap-3 text-sm font-bold"
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
                          <p className="text-sm text-viola-500">
                            {isLoginMode ? "Non hai un account?" : "Hai già un account?"} <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="inline-flex items-center min-h-11 px-1 rounded-full text-viola font-bold underline decoration-viola/40 underline-offset-4 hover:decoration-viola">{isLoginMode ? "Registrati qui" : "Accedi qui"}</button>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </StepLayout>
              )}

              {step === 2 && role === "professional" && (
                <StepLayout 
                  title="Dati personali"
                  description="Come ti presenterai agli altri."
                  onBack={prevStep}
                  onNext={nextStep}
                  nextDisabled={!formData.firstName.trim() || !formData.lastName.trim()}
                >
                  <div className="grid grid-cols-2 gap-3 md:gap-6">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="firstName" className="text-label text-viola">Nome</Label>
                      <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="es. Mario" className="h-12 px-5" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="lastName" className="text-label text-viola">Cognome</Label>
                      <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="es. Rossi" className="h-12 px-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-label text-viola">Titolo professionale</Label>
                    <Input id="title" value={formData.title} onChange={handleChange} placeholder="es. Senior Backend Engineer" className="h-12 px-5" />
                  </div>
                  <PhotoUpload
                    label="Foto profilo"
                    value={formData.photoUrl} 
                    onChange={(url) => setFormData({ ...formData, photoUrl: url })} 
                  />
                </StepLayout>
              )}

              {step === 3 && role === "professional" && (
                <StepLayout 
                  title="I tuoi settori"
                  description="In quali settori ti muovi? Puoi sceglierne più di uno."
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
                          "pressable min-h-14 p-4 rounded-2xl border text-left transition-colors font-bold text-sm text-viola leading-snug wrap-break-word flex items-start justify-between gap-2",
                          formData.selectedClusters.includes(cluster.slug)
                            ? "bg-rosa border-rosa"
                            : "bg-white border-viola/15 hover:bg-crema"
                        )}
                      >
                        <span className="min-w-0">{cluster.label}</span>
                        {formData.selectedClusters.includes(cluster.slug) && (
                          <Check size={16} strokeWidth={2.5} className="shrink-0 mt-0.5" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                </StepLayout>
              )}

              {step === 4 && role === "professional" && (
                <StepLayout 
                  title="Le tue 3 skill"
                  description="Scegli esattamente 3 competenze chiave."
                  onBack={prevStep}
                  onNext={nextStep}
                  nextDisabled={formData.topSkills.length !== 3}
                >
                  <div className="space-y-6">
                    {catalog.filter(c => formData.selectedClusters.includes(c.slug)).map(cluster => (
                      <div key={cluster.id} className="space-y-3">
                        <h3 className="text-label text-viola-500">{cluster.label}</h3>
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
                                "pressable min-h-11 md:min-h-10 px-4 py-2 rounded-full border text-chip text-viola inline-flex items-center gap-1.5 transition-colors",
                                formData.topSkills.includes(skill.slug)
                                  ? "bg-rosa border-rosa"
                                  : "bg-white border-viola/15 hover:bg-crema"
                              )}
                            >
                              {formData.topSkills.includes(skill.slug) && (
                                <Check size={14} strokeWidth={2.5} className="shrink-0 -ml-1" aria-hidden="true" />
                              )}
                              {skill.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Phones: stays in view above the bottom bar while scrolling the skill list */}
                  <div className="sticky z-10 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:static mt-4 py-3 px-5 bg-crema rounded-full flex justify-between items-center shadow-card md:shadow-none">
                    <span className="text-sm font-medium text-viola">Skill selezionate</span>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-xl font-bold tabular-nums",
                      formData.topSkills.length === 3 ? "text-viola" : "text-viola-400"
                    )}>
                      {formData.topSkills.length === 3 && <Check size={18} strokeWidth={2.5} aria-hidden="true" />}
                      {formData.topSkills.length}/3
                    </span>
                  </div>
                </StepLayout>
              )}

              {step === 5 && role === "professional" && (
                <StepLayout 
                  title="Tariffa e RAL"
                  description="La trasparenza è il nostro valore: la cifra si vede sulla tua card."
                  onBack={prevStep}
                  onNext={nextStep}
                >
                  <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <div className="col-span-2 space-y-2 min-w-0">
                      <Label htmlFor="rateAmount" className="text-label text-viola">Tariffa (EUR)</Label>
                      <Input id="rateAmount" value={formData.rateAmount} onChange={handleChange} type="number" inputMode="numeric" placeholder="500" className="h-14 px-5 text-xl md:text-xl font-bold tabular-nums" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="rateType" className="text-label text-viola">Tipo</Label>
                      <Select
                        value={formData.rateType}
                        onValueChange={(val) => setFormData({ ...formData, rateType: val as "daily" | "hourly" | "ral_annual" })}
                      >
                        <SelectTrigger className="h-14! w-full px-4 text-base font-medium">
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
                  title="CV e portfolio"
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

                    <div className="p-5 bg-crema rounded-2xl">
                       <p className="text-label font-normal text-viola-500 leading-relaxed">
                        <span className="font-bold text-viola">Nota:</span> I documenti caricati verranno mostrati alle aziende durante la fase di matching per validare le tue competenze.
                       </p>
                    </div>
                  </div>
                </StepLayout>
              )}

              {step === 7 && role === "professional" && (
                <StepLayout 
                  title="La tua bio"
                  description="Raccontaci la tua marcia in più."
                  onBack={prevStep}
                  onNext={handleComplete}
                  nextLabel={isSubmitting ? "Salvataggio..." : "Inizia a fare swipe"}
                  loading={isSubmitting}
                >
                  {/* Prompt card: the bio is the user's own voice, so it is written in Prompt style */}
                  <div className="rounded-card bg-rosa p-5 md:p-6 space-y-2 has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring has-[textarea:focus-visible]:ring-offset-2">
                    <Label htmlFor="bioLong" className="text-label text-viola">Bio professionale</Label>
                    <Textarea
                      id="bioLong"
                      value={formData.bioLong}
                      onChange={handleChange}
                      placeholder="Raccontaci chi sei in due righe..."
                      className="min-h-[140px] p-0 rounded-none border-0 bg-transparent font-prompt text-xl leading-7 md:text-prompt font-medium text-viola placeholder:text-viola/60 resize-none hover:border-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-crema rounded-2xl">
                    <Sparkles className="text-viola shrink-0" size={22} aria-hidden="true" />
                    <p className="text-label text-viola leading-relaxed">
                      I profili con una bio chiara e onesta ricevono il 40% di match in più.
                    </p>
                  </div>
                </StepLayout>
              )}

              {step === 2 && role === "company" && (
                <StepLayout 
                  title="Dati aziendali"
                  description="Verifichiamo la tua azienda per la sicurezza di tutti."
                  onBack={prevStep}
                  onNext={handleComplete}
                  nextLabel={isSubmitting ? "Salvataggio..." : "Conferma e inizia"}
                  loading={isSubmitting}
                  nextDisabled={!validateItalianVAT(formData.vatNumber) || !formData.vatDisclaimerAccepted || !formData.companyName}
                >
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-label text-viola">Nome azienda</Label>
                    <Input id="companyName" value={formData.companyName} onChange={handleChange} placeholder="es. Helllo S.r.l." className="h-12 px-5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber" className="text-label text-viola">Partita IVA</Label>
                    <Input
                      id="vatNumber"
                      value={formData.vatNumber}
                      onChange={handleChange}
                      placeholder="11 cifre (es. 12345678901)"
                      aria-invalid={formData.vatNumber.length > 0 && !validateItalianVAT(formData.vatNumber)}
                      aria-describedby={formData.vatNumber.length > 0 && !validateItalianVAT(formData.vatNumber) ? "vatNumber-error" : undefined}
                      className={cn(
                        "h-12 px-5 tabular-nums",
                        formData.vatNumber.length > 0 && validateItalianVAT(formData.vatNumber) && "border-success"
                      )}
                      maxLength={13}
                    />
                    {formData.vatNumber.length > 0 && !validateItalianVAT(formData.vatNumber) && (
                      <p id="vatNumber-error" className="flex items-center gap-1.5 text-label text-destructive">
                        <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
                        Formato Partita IVA non valido.
                      </p>
                    )}
                  </div>
                  <PhotoUpload
                    label="Logo aziendale"
                    value={formData.photoUrl}
                    onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                  />

                  {/* Disclaimer */}
                  <div className="mt-6 p-5 bg-crema rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        <Switch
                          id="vatDisclaimer"
                          checked={formData.vatDisclaimerAccepted}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, vatDisclaimerAccepted: checked }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="vatDisclaimer" className="text-sm font-bold text-viola leading-snug cursor-pointer">Assunzione di responsabilità</Label>
                        <p className="text-label font-normal text-viola-500 leading-relaxed">
                          Dichiaro che i dati forniti sono veritieri. La piattaforma non si assume responsabilità per dichiarazioni false o mendaci.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-rosa rounded-2xl mt-4">
                    <ShieldCheck className="text-viola shrink-0" size={22} aria-hidden="true" />
                    <p className="text-label text-viola leading-relaxed">
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
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-viola/15 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] empty:hidden"
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
          "pressable flex flex-row sm:flex-col items-center sm:justify-between gap-4 sm:gap-0 rounded-card border p-4 pr-12 sm:p-6 cursor-pointer transition-colors h-full relative overflow-hidden text-viola peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          isSelected
            ? "bg-rosa border-rosa"
            : "bg-white border-viola/15 hover:bg-crema"
        )}
      >
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 right-4 sm:top-4 sm:right-4 sm:translate-y-0 transition-[opacity,scale] duration-200",
          isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}>
          <div className="bg-viola text-white rounded-full p-1">
            <Check size={14} strokeWidth={3} />
          </div>
        </div>

        <div className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full flex items-center justify-center transition-[background-color,scale] duration-300 sm:mb-4",
          isSelected ? "bg-white" : "bg-crema group-hover:scale-105"
        )}>
           {icon}
        </div>

        <div className="flex flex-col sm:items-center min-w-0">
          <span className="sm:text-center font-bold text-lg mb-0.5">
            {label}
          </span>

          <span className={cn(
            "text-label font-normal sm:text-center",
            isSelected ? "text-viola" : "text-viola-500"
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
          <Button variant="outline" onClick={handleBack} className="h-14 px-6 text-base">Indietro</Button>
        )}
        {!hideNext && (
          <Button
            onClick={handleNext}
            disabled={loading || nextDisabled}
            className={cn(
              "group h-14 px-10 text-base gap-2",
              !onBack && "w-full"
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
              variant="outline"
              onClick={handleBack}
              className="shrink-0 h-12 px-5 text-[15px]"
            >
              Indietro
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={loading || nextDisabled}
            className="flex-1 min-w-0 h-12 px-5 text-base gap-2"
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
        <CardTitle className="text-title text-viola">{title}</CardTitle>
        <CardDescription className="text-body text-viola-500">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-5 md:px-8 pb-6 md:pb-8 pt-2 space-y-4">
        {children}
      </CardContent>
      <StepNav {...nav} />
    </>
  );
}
