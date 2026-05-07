import { getCalendarEventsAction } from "@/app/actions/booking";
import CalendarClient from "./CalendarClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Calendario | Skillr",
  description: "Gestisci i tuoi appuntamenti, interviste e smart interviews in un unico posto.",
};

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const res = await getCalendarEventsAction();
  const events = res.success ? res.data : [];

  return <CalendarClient initialEvents={events || []} />;
}
