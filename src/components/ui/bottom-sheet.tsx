"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile-first sheet: slides up from the bottom, drag the handle (or the sheet) down to
 * dismiss, Escape and backdrop tap close it. On md+ it becomes a centred dialog.
 */
export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Lock the page behind the sheet
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: duration.state, ease: ease.out } }}
            exit={{ opacity: 0, transition: { duration: duration.feedback } }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: spring.sheet }}
            exit={{ y: "100%", transition: { duration: duration.state, ease: ease.in } }}
            className={cn(
              "relative w-full md:max-w-lg max-h-[90dvh] flex flex-col bg-white outline-none",
              "rounded-t-[2rem] md:rounded-[2rem] shadow-premium pb-safe",
              className
            )}
          >
            <div
              className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none md:hidden"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <span className="h-1.5 w-10 rounded-full bg-slate-200" aria-hidden="true" />
            </div>
            {title && (
              <div className="flex items-center justify-between gap-4 px-6 pt-2 md:pt-6 pb-3">
                <h2 id={titleId} className="font-display text-2xl text-slate-950 truncate">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Chiudi"
                  className="pressable shrink-0 w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto overscroll-contain px-6 pb-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
