"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createJob } from "@/app/actions/jobs";
import { JobForm } from "@/components/jobs/JobForm";
import { toast } from "sonner";

import { JobData } from "@/types/job";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: JobData) {
    setLoading(true);

    const res = await createJob(data);
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
    } else {
      toast.success("Ricerca pubblicata con successo!");
      router.push("/jobs");
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <header className="h-24 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-40 shrink-0">
        <div>
          <h1 className="text-2xl font-display italic font-bold text-slate-950 tracking-tight">Nuova Ricerca</h1>
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-0.5">Configura la tua ricerca attiva</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/jobs">
            <Button variant="outline" className="rounded-xl h-12 px-6 border-slate-200 hover:bg-slate-50 gap-2 transition-all">
              <ArrowLeft size={18} />
              <span className="font-bold text-sm">Torna alle ricerche</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 md:p-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 md:p-12">
            <JobForm 
              onSubmit={handleSubmit}
              submitLabel="Pubblica Ricerca"
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
