"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { confirmNewsletterSubscriptionAction } from "@/app/actions/pa";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

function ConfirmNewsletterContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setStatus("error");
        setErrorMessage("Token mancante. Il link potrebbe essere incompleto.");
        return;
      }

      try {
        const result = await confirmNewsletterSubscriptionAction(token);
        if (result.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(result.error || "Impossibile verificare l'iscrizione.");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Si è verificato un errore di rete.");
      }
    }

    confirm();
  }, [token]);

  return (
    <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-100 text-center max-w-lg w-full">
      {status === "loading" && (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-16 w-16 text-pa-blue animate-spin mb-6" />
          <h1 className="text-2xl font-bold text-pa-blue">Verifica in corso...</h1>
          <p className="text-text-secondary mt-2">Attendere prego mentre confermiamo la tua iscrizione.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center py-8 animate-in zoom-in duration-500">
          <div className="rounded-full bg-green-100 p-4 mb-6">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-pa-blue mb-2">Iscrizione Confermata!</h1>
          <p className="text-text-secondary mb-8">
            Grazie per aver confermato il tuo indirizzo email. Inizierai a ricevere i nostri aggiornamenti sui bandi NEET e le politiche attive in Puglia.
          </p>
          <Link href="/pa" className={cn(buttonVariants({ variant: "default" }), "bg-pa-blue text-white hover:bg-pa-blue/90 w-full h-12")}>
            Torna alla Home PA
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center py-8 animate-in zoom-in duration-500">
          <div className="rounded-full bg-red-100 p-4 mb-6">
            <XCircle className="h-16 w-16 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Iscrizione Fallita</h1>
          <p className="text-text-secondary mb-8">
            {errorMessage}
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Link href="/pa/newsletter" className={cn(buttonVariants({ variant: "default" }), "bg-pa-blue text-white hover:bg-pa-blue/90 w-full h-12")}>
              Riprova ad Iscriverti
            </Link>
            <Link href="/pa" className={cn(buttonVariants({ variant: "outline" }), "border-pa-blue text-pa-blue hover:bg-pa-blue/5 w-full h-12")}>
              Torna alla Home PA
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfirmNewsletterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white p-10 rounded-2xl shadow-xl flex justify-center items-center h-64 w-full max-w-lg">
          <Loader2 className="h-12 w-12 text-pa-blue animate-spin" />
        </div>
      }>
        <ConfirmNewsletterContent />
      </Suspense>
    </div>
  );
}
