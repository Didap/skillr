"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { updateJob } from "@/app/actions/jobs";
import { JobForm } from "@/components/jobs/JobForm";
import { toast } from "sonner";

import { JobData } from "@/types/job";

export default function EditJobClient({ initialData }: { initialData: JobData & { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: JobData) {
    setLoading(true);

    const res = await updateJob(initialData.id, data);
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
    } else {
      toast.success("Modifiche salvate con successo!");
      router.push("/jobs");
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-20 border-b border-border-subtle bg-white flex items-center px-6 sticky top-0 z-40">
        <Link href="/jobs" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium">
          <ArrowLeft size={20} /> Ricerche
        </Link>
        <div className="mx-auto font-bold font-display italic text-xl">Modifica Ricerca</div>
        <div className="w-20" />
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12">
        <div className="bg-white rounded-[2.5rem] border border-border-subtle shadow-premium p-8 md:p-16">
          <JobForm 
            initialData={initialData}
            onSubmit={handleSubmit}
            submitLabel="Salva Modifiche"
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
