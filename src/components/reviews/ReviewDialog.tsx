"use client";

import { useCallback, useEffect, useRef } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ReviewForm } from "./ReviewForm";

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: string;
  interviewBookingId?: string;
  targetName: string;
}

// Bottom sheet on phones (drag to dismiss), centred dialog from md: BottomSheet handles both.
export function ReviewDialog({
  isOpen,
  onClose,
  matchId,
  interviewBookingId,
  targetName
}: ReviewDialogProps) {
  // BottomSheet re-runs its open effect (focus + scroll lock) when onClose changes identity.
  // Parents pass inline arrows and re-render on a timer, which would pull focus out of the
  // textarea mid-sentence: hand the sheet a stable callback instead.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const handleClose = useCallback(() => onCloseRef.current(), []);

  return (
    <BottomSheet open={isOpen} onClose={handleClose} title="Com'è andata?">
      <ReviewForm
        matchId={matchId}
        interviewBookingId={interviewBookingId}
        targetName={targetName}
        onSuccess={handleClose}
        showHeading={false}
      />
    </BottomSheet>
  );
}
