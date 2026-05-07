import { getAvailableEventsAction } from "@/app/actions/interviews";
import SmartInterviewsClient from "./SmartInterviewsClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Smart Interviews | Skillr",
  description: "Partecipa alle sessioni di matching rapido con le migliori aziende.",
};

export default async function SmartInterviewsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'professional') {
    redirect("/dashboard");
  }

  const res = await getAvailableEventsAction();
  const events = res.success ? res.data : [];

  return <SmartInterviewsClient initialEvents={events || []} />;
}
