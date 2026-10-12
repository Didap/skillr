"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { InterviewForm } from "@/components/interviews/InterviewForm";
import { createInterviewEventAction } from "@/app/actions/interviews";
import { InterviewEvent } from "@/types/interview";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { duration, ease } from "@/lib/motion";

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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFDFC] p-6 pb-tabbar">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: duration.view, ease: ease.out } }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display italic font-bold text-slate-950">Evento Creato!</h1>
            <p className="text-slate-500 text-sm">Verrai reindirizzato tra poco.</p>
          </div>
          <Loader2 className="animate-spin motion-reduce:animate-none text-emerald-500 mx-auto" size={20} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFDFC]">
      <PageHeader
        title="Nuovo evento"
        subtitle="Smart Interview"
        backHref="/dashboard/events"
        actions={
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/50">
            <Sparkles size={12} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Setup</span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar pb-tabbar">
        <main className="w-full mx-auto px-4 pt-6 pb-2 md:p-10 lg:p-16">
          <div className="max-w-5xl mx-auto">
            <InterviewForm onSubmit={handleCreate} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}
