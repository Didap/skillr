import { getCompanyEvents } from "@/app/actions/interviews";
import EventsClient from "./EventsClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { InterviewEvent } from "@/types/interview";

export const metadata = {
  title: "Smart Interviews | Skillr",
  description: "Gestisci i tuoi eventi di speed-dating aziendale.",
};

export default async function EventsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== 'company') {
    redirect("/dashboard");
  }

  const res = await getCompanyEvents();
  const initialEvents = res.success ? res.data || [] : [];

  return <EventsClient initialEvents={initialEvents as InterviewEvent[]} />;
}
