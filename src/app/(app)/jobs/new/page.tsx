"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
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
      <PageHeader title="Nuova ricerca" subtitle="Configura la tua ricerca attiva" backHref="/jobs" />

      <main className="flex-1 overflow-y-auto overscroll-contain bg-white md:bg-crema pb-tabbar">
        <div className="max-w-4xl mx-auto px-4 pt-6 md:p-12">
          <div className="bg-white md:rounded-card md:p-12">
            <JobForm
              onSubmit={handleSubmit}
              submitLabel="Pubblica ricerca"
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
