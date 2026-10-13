"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { getEventParticipantsAction } from "@/app/actions/interviews";
import { ParticipantList, type Participant } from "@/components/interviews/ParticipantList";

interface ParticipantsSheetProps {
  /** The event whose bookings are shown; the sheet is open while it is set. */
  event: { id: string; title: string } | null;
  onClose: () => void;
}

/** Organizer tool: who booked an event. Loads the list each time it opens. */
export function ParticipantsSheet({ event, onClose }: ParticipantsSheetProps) {
  return (
    <BottomSheet open={!!event} onClose={onClose} title="Iscritti">
      {event && (
        <>
          <p className="-mt-2 mb-4 text-sm text-slate-500 truncate">{event.title}</p>
          <LoadedParticipants key={event.id} eventId={event.id} />
        </>
      )}
    </BottomSheet>
  );
}

function LoadedParticipants({ eventId }: { eventId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getEventParticipantsAction(eventId).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setParticipants(res.data || []);
      } else {
        toast.error(res.error || "Errore nel caricamento dei partecipanti");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return <ParticipantList loading={loading} participants={participants} />;
}
