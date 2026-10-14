"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
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
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <PageHeader title="Modifica ricerca" subtitle="Aggiorna i dettagli dell'annuncio" backHref="/jobs" />

      <main className="flex-1 overflow-y-auto overscroll-contain bg-white pb-tabbar">
        <div className="max-w-4xl mx-auto px-4 pt-6 md:p-12">
          <div className="bg-white md:rounded-[2.5rem] md:border md:border-viola-100 md:shadow-premium md:p-12">
            <JobForm 
              initialData={initialData}
              onSubmit={handleSubmit}
              submitLabel="Salva Modifiche"
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
