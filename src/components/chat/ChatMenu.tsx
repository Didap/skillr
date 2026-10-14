"use client";

import { useState } from "react";
import { Ban, Flag, LockOpen, MoreHorizontal, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { blockConversation, unblockConversation } from "@/app/actions/chat";
import { ReportSheet } from "./ReportSheet";

interface ChatMenuProps {
  matchId: string;
  viewerId: string;
  otherName: string;
  blockedById: string | null;
  onBlockedChange: (blockedById: string | null) => void;
}

const OFFLINE = { error: "Connessione assente. Riprova." } as const;

export function ChatMenu({ matchId, viewerId, otherName, blockedById, onBlockedChange }: ChatMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [report, setReport] = useState<{ block: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const blockedByMe = blockedById === viewerId;

  const block = async () => {
    setBusy(true);
    const res = await blockConversation(matchId).catch(() => OFFLINE);
    setBusy(false);
    if ("error" in res) return void toast.error(res.error);
    onBlockedChange(res.data.blockedById);
    setConfirmBlock(false);
    toast.success("Conversazione bloccata");
  };

  const unblock = async () => {
    const res = await unblockConversation(matchId).catch(() => OFFLINE);
    if ("error" in res) return void toast.error(res.error);
    onBlockedChange(res.data.blockedById);
    if (res.data.blockedById === null) toast.success("Conversazione sbloccata");
  };

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Opzioni della chat"
        aria-haspopup="dialog"
        className="pressable size-10 rounded-full flex items-center justify-center text-viola hover:bg-crema"
      >
        <MoreHorizontal size={22} strokeWidth={1.75} />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Opzioni della chat">
        <ul className="flex flex-col gap-1">
          {blockedByMe ? (
            <MenuItem icon={<LockOpen size={22} strokeWidth={1.75} />} label="Sblocca la conversazione" onClick={choose(() => void unblock())} />
          ) : (
            !blockedById && (
              <MenuItem icon={<Ban size={22} strokeWidth={1.75} />} label={`Blocca ${otherName}`} onClick={choose(() => setConfirmBlock(true))} />
            )
          )}
          <MenuItem icon={<Flag size={22} strokeWidth={1.75} />} label="Segnala" onClick={choose(() => setReport({ block: false }))} />
          {!blockedById && (
            <MenuItem
              icon={<ShieldAlert size={22} strokeWidth={1.75} />}
              label="Segnala e blocca"
              destructive
              onClick={choose(() => setReport({ block: true }))}
            />
          )}
        </ul>
      </BottomSheet>

      <ConfirmSheet
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        onConfirm={() => void block()}
        loading={busy}
        title={`Bloccare ${otherName}?`}
        description="Nessuno dei due potrà più scrivere in questa chat. Il match e il colloquio restano. Puoi sbloccarla quando vuoi."
        confirmText="Blocca"
      />

      <ReportSheet
        open={report !== null}
        block={report?.block ?? false}
        matchId={matchId}
        otherName={otherName}
        onClose={() => setReport(null)}
        onReported={(id) => {
          if (id) onBlockedChange(id);
        }}
      />
    </>
  );
}

function MenuItem({ icon, label, onClick, destructive = false }: { icon: React.ReactNode; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "pressable w-full flex items-center gap-4 h-14 px-4 rounded-full font-semibold",
          destructive ? "text-rosso-700 hover:bg-rosso-50" : "text-viola hover:bg-crema"
        )}
      >
        {icon}
        {label}
      </button>
    </li>
  );
}
