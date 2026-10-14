"use client";

import { Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";

interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  loading?: boolean;
}

/** Destructive confirmation: a bottom sheet on phones, a small dialog from md up. */
export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = "Indietro",
  loading = false,
}: ConfirmSheetProps) {
  // No dismissing (Escape, backdrop, drag) while the action is running
  const close = () => {
    if (!loading) onClose();
  };

  return (
    <BottomSheet open={open} onClose={close} title={title}>
      <p className="text-body text-viola-500">{description}</p>
      <div className="mt-6 flex flex-col gap-2 md:flex-row-reverse">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="pressable h-12 md:flex-1 rounded-full bg-destructive px-5 text-[15px] font-bold text-white hover:bg-rosso-800 disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />}
          {confirmText}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="pressable h-12 md:flex-1 rounded-full border border-viola bg-white px-5 text-[15px] font-semibold text-viola hover:bg-crema disabled:opacity-60"
        >
          {cancelText}
        </button>
      </div>
    </BottomSheet>
  );
}
