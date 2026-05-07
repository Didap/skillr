import { auth } from "@/auth";
import { getEventByIdAction } from "@/app/actions/interviews";
import EventDetailClient from "./EventDetailClient";
import { notFound } from "next/navigation";

export default async function EventDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    notFound();
  }

  const res = await getEventByIdAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const event = res.data;
  const isBooked = event.bookings?.some((b: { professionalId: string }) => b.professionalId === session.user.id) || false;
  const isProfessional = session.user.role === 'professional';
  const isOwner = session.user.id === event.companyId;

  return (
    <EventDetailClient 
      event={event} 
      isBooked={isBooked}
      isProfessional={isProfessional}
      isOwner={isOwner}
    />
  );
}
