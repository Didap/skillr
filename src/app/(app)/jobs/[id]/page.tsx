import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getJobById } from "@/app/actions/jobs";
import { getJobApplicants } from "@/app/actions/applications";
import { JobDetailClient } from "./JobDetailClient";
import { getSkillLabelMap } from "@/lib/skill-catalog";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "company") {
    redirect("/dashboard");
  }

  const [jobRes, applicantsRes, labelBySlug] = await Promise.all([
    getJobById(id),
    getJobApplicants(id),
    getSkillLabelMap(),
  ]);

  if (jobRes.error || !jobRes.data) {
    notFound();
  }

  return (
    <JobDetailClient 
      job={jobRes.data} 
      initialApplicants={applicantsRes.data || []} 
      skillLabels={Object.fromEntries(labelBySlug)}
    />
  );
}
