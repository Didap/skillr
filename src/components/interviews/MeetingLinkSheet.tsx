"use client";

import { useState } from "react";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { updateMeetingLinkAction } from "@/app/actions/interviews";

interface MeetingLinkSheetProps {
  /** The event whose link is being edited; the sheet is open while it is set. */
  event: { id: string; meetingLink: string | null } | null;
  /** Optional line under the sheet title (the event name, in lists). */
  subtitle?: string;
  onClose: () => void;
  /** Called with the saved link once the server accepted it; the sheet then closes itself. */
  onSaved: (link: string, eventId: string) => void;
}

/** Organizer tool: set or change an event's meeting link. */
export function MeetingLinkSheet({ event, subtitle, onClose, onSaved }: MeetingLinkSheetProps) {
  return (
    <BottomSheet open={!!event} onClose={onClose} title="Link del meeting">
      {event && (
        // Mounted on open, so the field starts from the event's current link each time
        <MeetingLinkForm key={event.id} event={event} subtitle={subtitle} onClose={onClose} onSaved={onSaved} />
      )}
    </BottomSheet>
  );
}

function MeetingLinkForm({
  event,
  subtitle,
  onClose,
  onSaved,
}: Omit<MeetingLinkSheetProps, "event"> & { event: NonNullable<MeetingLinkSheetProps["event"]> }) {
  const [newLink, setNewLink] = useState(event.meetingLink || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newLink) return;
    setLoading(true);
    const res = await updateMeetingLinkAction(event.id, newLink);
    if (res.success) {
      // The server stores the normalized link (https:// added if missing): show that one
      onSaved(("meetingLink" in res && res.meetingLink) || newLink.trim(), event.id);
      onClose();
      toast.success("Link aggiornato con successo!");
    } else {
      toast.error(res.error || "Errore durante l'aggiornamento");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-4"
    >
      {subtitle && <p className="text-sm text-viola-500 truncate -mt-2">{subtitle}</p>}
      <div className="relative">
        <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-viola-400 pointer-events-none" />
        <Input
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          aria-label="Link del meeting"
          placeholder="https://meet.google.com/..."
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          className="h-14 pl-12 pr-4 rounded-full bg-crema border-transparent text-base text-viola placeholder:text-viola-400"
        />
      </div>
      <p className="text-label text-viola-500 ml-4">Solo i professionisti iscritti vedranno questo link.</p>
      <button
        type="submit"
        disabled={loading || !newLink}
        className="pressable w-full h-14 rounded-full bg-rosso hover:bg-rosso-600 text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />}
        Salva link
      </button>
    </form>
  );
}
