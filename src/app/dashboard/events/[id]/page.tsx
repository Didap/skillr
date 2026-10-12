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

  // isBooked / isOwner / isPast are computed by the action for the current viewer
  const { isBooked, isOwner, isPast, ...event } = res.data;
  const isProfessional = session.user.role === 'professional';

  return (
    <EventDetailClient
      event={event}
      isBooked={isBooked}
      isProfessional={isProfessional}
      isOwner={isOwner}
      isPast={isPast}
    />
  );
}
