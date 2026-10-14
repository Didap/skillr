"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Textarea } from "@/components/ui/textarea";
import { reportConversation } from "@/app/actions/chat";
import { safeAction } from "@/lib/chat/call-action";
import { CHAT_REPORT_REASONS, type ChatReportReason } from "@/lib/chat/types";

interface ReportSheetProps {
  open: boolean;
  block: boolean;
  matchId: string;
  otherName: string;
  onClose: () => void;
  onReported: (blockedById: string | null) => void;
}

export function ReportSheet({ open, block, matchId, otherName, onClose, onReported }: ReportSheetProps) {
  const [reason, setReason] = useState<ChatReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason || busy) return;
    setBusy(true);
    const res = await safeAction(reportConversation(matchId, { reason, details: details || undefined, block }));
    setBusy(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(block ? "Segnalazione inviata. Conversazione bloccata." : "Segnalazione inviata. Grazie.");
    onReported(res.data.blockedById);
    setReason(null);
    setDetails("");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={() => !busy && onClose()} title={block ? `Segnala e blocca ${otherName}` : `Segnala ${otherName}`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-viola">Cosa è successo?</legend>
          <div className="flex flex-col gap-1">
            {CHAT_REPORT_REASONS.map((r) => (
              <label key={r.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full px-3 hover:bg-crema">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="size-4 accent-viola"
                />
                <span className="text-body text-viola">{r.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Dettagli (facoltativo)"
          aria-label="Dettagli della segnalazione"
        />
        <p className="text-label text-viola-500">
          Il team di Helllo leggerà gli ultimi messaggi di questa conversazione per valutare la segnalazione.
        </p>
        <button
          type="submit"
          disabled={!reason || busy}
          className="pressable inline-flex h-12 items-center justify-center gap-2 rounded-full bg-destructive px-5 text-[15px] font-bold text-white hover:bg-rosso-800 disabled:opacity-60"
        >
          {busy && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />}
          {block ? "Segnala e blocca" : "Invia segnalazione"}
        </button>
      </form>
    </BottomSheet>
  );
}
