"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InterviewForm } from "@/components/interviews/InterviewForm";
import { createInterviewEventAction } from "@/app/actions/interviews";
import { InterviewEvent } from "@/types/interview";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NewEventClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreate = async (data: Omit<InterviewEvent, "id" | "companyId" | "createdAt" | "bookingCount">) => {
    setLoading(true);
    const toastId = toast.loading("Creazione evento in corso...");
    
    try {
      const res = await createInterviewEventAction(data);
      
      if (res.success) {
        setIsSuccess(true);
        toast.success("Evento creato!", { id: toastId });
        setTimeout(() => {
          router.push("/dashboard/events");
          router.refresh();
        }, 1000);
      } else {
        // Ensure error is a string
        const errorMsg = typeof res.error === 'string' ? res.error : "Errore durante il salvataggio";
        toast.error(errorMsg, { id: toastId });
      }
    } catch (error) {
      console.error("Client error:", error);
      toast.error("Errore imprevisto nel modulo", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFDFC] p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-display italic font-bold text-slate-950">Evento Creato!</h1>
            <p className="text-slate-500 text-xs">Verrai reindirizzato tra poco.</p>
          </div>
          <Loader2 className="animate-spin text-emerald-500 mx-auto" size={20} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FDFDFC] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <header className="h-20 border-b border-slate-100 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-5">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-950 transition-all border border-transparent hover:border-slate-100">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-display italic font-bold text-slate-950 tracking-tight">Nuovo Evento</h1>
            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">Smart Interview</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/50">
            <Sparkles size={12} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Setup</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto p-10 lg:p-16">
        <div className="max-w-5xl mx-auto">
           <InterviewForm onSubmit={handleCreate} loading={loading} />
        </div>
      </main>
    </div>
  );
}
