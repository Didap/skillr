"use client";

import { Suspense, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { credentialsErrorMessage } from "@/components/auth/login-errors";
import { duration, ease } from "@/lib/motion";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#FDFDFC]" />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      if (error === "CredentialsSignin") {
        toast.error(credentialsErrorMessage(searchParams.get("code")));
      } else {
        toast.error("Si è verificato un errore durante l'accesso.");
      }
      // Puliamo l'URL dall'errore
      router.replace("/login");
    }
  }, [searchParams, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(undefined);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await signIn("resend", { email, callbackUrl });
    } catch (error) {
      console.error(error);
      toast.error("Errore nell'invio del magic link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        turnstileToken: turnstileToken ?? "",
        redirect: false
      });
      // The server has used up this token: get a fresh one for the next attempt.
      setTurnstileToken(null);
      turnstileRef.current?.reset();

      if (result?.error) {
        toast.error(credentialsErrorMessage(result.code));
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Si è verificato un errore imprevisto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#FDFDFC] flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top bar: the back link owns its own row on phones, so it never collides with the logo */}
      <div className="pt-safe shrink-0 md:absolute md:top-12 md:left-12 md:pt-0">
        <div className="h-14 md:h-auto px-2 md:px-0 flex items-center">
          <Link
            href="/"
            aria-label="Torna alla Home"
            className="pressable w-11 h-11 md:w-auto md:h-auto rounded-full flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hover:bg-transparent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Torna alla Home</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.view, ease: ease.out }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6 md:mb-12">
           <span className="font-display text-4xl md:text-5xl italic font-bold text-slate-950">
              Skillr<span className="text-emerald-600">.</span>
           </span>
        </div>
        
        <Card className="border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-8 md:pt-10 pb-4 md:pb-8 px-6 md:px-10">
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-950 mb-2">
              Bentornato
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium text-[15px] md:text-sm">
              Accedi per riprendere la tua ricerca di talenti o lavoro.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 md:px-10">
            <Button 
              variant="outline" 
              disabled={isLoading}
              onClick={() => signIn("google", { callbackUrl })}
              className="pressable w-full h-12 md:h-14 rounded-2xl border-slate-100 bg-white hover:bg-slate-50 hover:border-emerald-200 transition-colors font-bold text-[15px] md:text-sm text-slate-700 flex items-center justify-center gap-3 md:gap-4 shadow-sm group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.191 2.691 1.245 6.655l4.021 3.11z" />
                <path fill="#34A853" d="M16.04 18.013c-1.09.593-2.325.896-3.613.896a7.077 7.077 0 0 1-6.719-4.856l-4.021 3.11C3.645 21.127 7.564 24 12 24c3.082 0 5.855-1.023 7.855-2.773l-3.815-3.214z" />
                <path fill="#4285F4" d="M19.855 21.227c2.325-2.062 3.655-5.127 3.655-8.864 0-.833-.083-1.636-.233-2.39H12v4.527h6.41c-.267 1.44-.099 2.708-.736 3.842l2.181 2.885z" />
                <path fill="#FBBC05" d="M5.668 14.053a7.033 7.033 0 0 1 0-4.288L1.647 6.655A12.022 12.022 0 0 0 0 12c0 1.91.445 3.718 1.245 5.345l4.423-3.292z" />
              </svg>
              Continua con Google
            </Button>
            
            <div className="relative my-2 md:my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-black text-slate-500">
                <span className="bg-white px-4">Oppure via email</span>
              </div>
            </div>

            <form onSubmit={showPassword ? handleCredentialsLogin : handleMagicLink} className="grid gap-3">
               <div className="space-y-1.5">
                 <Label htmlFor="login-email" className="text-xs font-bold text-slate-500 ml-1">Email</Label>
                 <Input 
                    id="login-email"
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="La tua email"
                    required
                    autoComplete="email"
                    className="h-12 md:h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-4"
                 />
               </div>
               {showPassword && (
                 <div className="space-y-1.5">
                   <Label htmlFor="login-password" className="text-xs font-bold text-slate-500 ml-1">Password</Label>
                   <Input 
                      id="login-password"
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="La tua password"
                      required
                      autoComplete="current-password"
                      className="h-12 md:h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-4"
                   />
                 </div>
               )}
               
               {/* Flexible widget fills the row (min 300px); on the narrowest phones it
                   borrows a little of the card padding so it is never clipped */}
               <div className="py-2 -mx-3 sm:mx-0">
                 <Turnstile
                   ref={turnstileRef}
                   siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                   options={{ theme: "light", size: "flexible" }}
                   onSuccess={(token) => setTurnstileToken(token)}
                   onExpire={() => setTurnstileToken(null)}
                 />
               </div>

               <Button 
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="pressable w-full h-14 rounded-2xl bg-slate-950 text-white hover:bg-emerald-800 transition-colors font-bold text-lg shadow-xl shadow-slate-200"
               >
                 {isLoading ? "Invio in corso..." : showPassword ? "Accedi" : "Invia Magic Link"}
               </Button>
               <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="min-h-11 px-3 mx-auto text-sm md:text-xs text-slate-500 hover:text-emerald-600 font-bold transition-colors"
               >
                 {showPassword ? "Usa il Magic Link (senza password)" : "Preferisci usare una password?"}
               </button>
            </form>
          </CardContent>
          <CardFooter className="pb-6 md:pb-10 pt-2 md:pt-6 px-6 md:px-10">
            <div className="px-4 py-1.5 md:py-2 bg-emerald-50/50 rounded-2xl w-full border border-emerald-100/50 text-center">
              <p className="text-sm text-slate-600 font-medium">
                Nuovo su Skillr?{" "}
                <Link 
                  href="/onboarding"
                  className="inline-flex items-center min-h-11 px-1 text-emerald-700 hover:underline font-bold"
                >
                  Crea un account
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
        
        <div className="px-4 md:px-10 text-center text-xs md:text-[11px] text-slate-500 mt-6 md:mt-10 leading-relaxed font-medium">
          Accedendo, confermi di aver letto e accettato i nostri{" "}
          <Link href="/terms" className="text-slate-600 hover:text-emerald-600 font-bold underline decoration-slate-200 underline-offset-4">
            Termini
          </Link>{" "}
          e la{" "}
          <Link href="/privacy" className="text-slate-600 hover:text-emerald-600 font-bold underline decoration-slate-200 underline-offset-4">
            Privacy Policy
          </Link>.
        </div>
      </motion.div>
      </div>
    </div>
  );
}
