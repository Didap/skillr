"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Conferma",
  cancelText = "Annulla",
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  // Close on ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
        window.addEventListener("keydown", handleEsc);
        document.body.style.overflow = "hidden";
    }
    return () => {
        window.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />
          
          {/* Dialog Container */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm",
                    variant === "danger" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    <AlertCircle size={32} />
                  </div>
                  
                  <h3 className="text-2xl font-display italic font-bold text-slate-950 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{description}</p>
                </div>

                <div className="flex flex-col gap-2 mt-8">
                  <Button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={cn(
                      "w-full rounded-2xl h-14 font-black text-lg transition-all active:scale-95",
                      variant === "danger" 
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-100" 
                        : "bg-slate-950 hover:bg-emerald-800 text-white shadow-xl shadow-slate-200"
                    )}
                  >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             <span>Elaborazione...</span>
                        </div>
                    ) : confirmText}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-full rounded-2xl h-12 font-bold text-slate-400 hover:text-slate-950 hover:bg-slate-50 transition-all"
                  >
                    {cancelText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
