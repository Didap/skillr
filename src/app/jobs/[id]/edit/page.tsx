
import { auth } from "@/auth";
import { getJobById } from "@/app/actions/jobs";
import { redirect } from "next/navigation";
import EditJobClient from "./EditJobClient";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'company') {
    redirect("/login");
  }

  const { id } = await params;
  const res = await getJobById(id);

  if (!res.success || !res.data) {
    redirect("/jobs");
  }

  return <EditJobClient initialData={res.data} />;
}
