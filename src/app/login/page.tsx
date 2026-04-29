"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Star, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await signIn("resend", { email, callbackUrl });
    } catch (error) {
      console.error(error);
      alert("Errore nell'invio del magic link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const res = await signIn("credentials", { 
        email, 
        password, 
        callbackUrl,
        redirect: true 
      });
    } catch (error) {
      console.error(error);
      alert("Credenziali non valide.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] flex flex-col items-center justify-center p-6 selection:bg-emerald-100 selection:text-emerald-900">
      <Link 
        href="/" 
        className="absolute top-12 left-12 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={16} /> Torna alla Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
           <span className="font-display text-5xl italic font-bold text-slate-950">
              Skillr<span className="text-emerald-600">.</span>
           </span>
        </div>
        
        <Card className="border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-10 pb-8 px-10">
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-950 mb-2">
              Bentornato
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Accedi per riprendere la tua ricerca di talenti o lavoro.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 px-10">
            <Button 
              variant="outline" 
              disabled={isLoading}
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full h-14 rounded-2xl border-slate-100 bg-white hover:bg-slate-50 hover:border-emerald-200 transition-all font-bold text-slate-700 flex items-center justify-center gap-4 shadow-sm group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.191 2.691 1.245 6.655l4.021 3.11z" />
                <path fill="#34A853" d="M16.04 18.013c-1.09.593-2.325.896-3.613.896a7.077 7.077 0 0 1-6.719-4.856l-4.021 3.11C3.645 21.127 7.564 24 12 24c3.082 0 5.855-1.023 7.855-2.773l-3.815-3.214z" />
                <path fill="#4285F4" d="M19.855 21.227c2.325-2.062 3.655-5.127 3.655-8.864 0-.833-.083-1.636-.233-2.39H12v4.527h6.41c-.267 1.44-.099 2.708-.736 3.842l2.181 2.885z" />
                <path fill="#FBBC05" d="M5.668 14.053a7.033 7.033 0 0 1 0-4.288L1.647 6.655A12.022 12.022 0 0 0 0 12c0 1.91.445 3.718 1.245 5.345l4.423-3.292z" />
              </svg>
              Continua con Google
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-slate-300">
                <span className="bg-white px-4">Oppure via email</span>
              </div>
            </div>

            <form onSubmit={showPassword ? handleCredentialsLogin : handleMagicLink} className="grid gap-3">
               <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="La tua email"
                  required
                  className="flex h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-1 text-sm font-medium transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
               />
               {showPassword && (
                 <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="La tua password"
                    required
                    className="flex h-14 w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-1 text-sm font-medium transition-all placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                 />
               )}
               <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-slate-950 text-white hover:bg-emerald-800 transition-all font-bold text-lg shadow-xl shadow-slate-200"
               >
                 {isLoading ? "Invio in corso..." : showPassword ? "Accedi" : "Invia Magic Link"}
               </Button>
               <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-400 hover:text-emerald-600 font-bold transition-colors"
               >
                 {showPassword ? "Usa il Magic Link (senza password)" : "Preferisci usare una password?"}
               </button>
            </form>
          </CardContent>
          <CardFooter className="pb-10 pt-6 px-10">
            <div className="p-4 bg-emerald-50/50 rounded-2xl w-full border border-emerald-100/50 text-center">
              <p className="text-sm text-slate-600 font-medium">
                Nuovo su Skillr?{" "}
                <button 
                  onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                  className="text-emerald-700 hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                >
                  Crea un account
                </button>
              </p>
            </div>
          </CardFooter>
        </Card>
        
        <div className="px-10 text-center text-[11px] text-slate-400 mt-10 leading-relaxed font-medium">
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
  );
}
