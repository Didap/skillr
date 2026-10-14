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
    <div className="bg-white p-8 md:p-10 rounded-card border border-viola/15 text-center max-w-lg w-full" aria-live="polite">
      {status === "loading" && (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-14 w-14 text-blu animate-spin mb-6" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-viola">Verifica in corso...</h1>
          <p className="text-viola-500 mt-2">Attendere prego mentre confermiamo la tua iscrizione.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center py-8 animate-in zoom-in duration-500">
          <div className="rounded-full bg-blu-50 p-4 mb-6">
            <CheckCircle2 className="h-14 w-14 text-blu" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-viola mb-2">Iscrizione confermata!</h1>
          <p className="text-viola-500 mb-8">
            Grazie per aver confermato il tuo indirizzo email. Inizierai a ricevere i nostri aggiornamenti sui bandi NEET e le politiche attive in Puglia.
          </p>
          <Link href="/pa" className={cn(buttonVariants({ variant: "outline" }), "w-full h-12 text-base")}>
            Torna alla Home PA
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center py-8 animate-in zoom-in duration-500">
          <div className="rounded-full bg-rosso-50 p-4 mb-6">
            <XCircle className="h-14 w-14 text-rosso-700" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-viola mb-2">Iscrizione non riuscita</h1>
          <p className="text-viola-500 mb-8">
            {errorMessage}
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Link href="/pa/newsletter" className={cn(buttonVariants({ variant: "default" }), "w-full h-12 text-base")}>
              Riprova a iscriverti
            </Link>
            <Link href="/pa" className={cn(buttonVariants({ variant: "outline" }), "w-full h-12 text-base")}>
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
    <div className="min-h-screen bg-crema flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white p-10 rounded-card border border-viola/15 flex justify-center items-center h-64 w-full max-w-lg">
          <Loader2 className="h-12 w-12 text-blu animate-spin" aria-hidden="true" />
        </div>
      }>
        <ConfirmNewsletterContent />
      </Suspense>
    </div>
  );
}
