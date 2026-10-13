"use client";

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
  return (
    <BottomSheet open={isOpen} onClose={onClose} title="Com'è andata?">
      <ReviewForm
        matchId={matchId}
        interviewBookingId={interviewBookingId}
        targetName={targetName}
        onSuccess={onClose}
      />
    </BottomSheet>
  );
}
