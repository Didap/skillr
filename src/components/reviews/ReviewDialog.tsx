"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ReviewForm } from "./ReviewForm";

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: string;
  interviewBookingId?: string;
  targetId: string;
  targetName: string;
}

export function ReviewDialog({
  isOpen,
  onClose,
  matchId,
  interviewBookingId,
  targetId,
  targetName
}: ReviewDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-10 right-10 text-slate-300 hover:text-slate-950 transition-colors p-2 hover:bg-slate-50 rounded-full"
            >
              <X size={24} />
            </button>
            <div className="p-12">
              <ReviewForm
                matchId={matchId}
                interviewBookingId={interviewBookingId}
                targetId={targetId}
                targetName={targetName}
                onSuccess={onClose}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
