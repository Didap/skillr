"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, ease, spring } from "@/lib/motion";

interface BottomActionBarProps {
  children: React.ReactNode;
  /**
   * "bar": full-width strip with a top border (task flows).
   * "floating": rounded card with side margins (single primary action, save prompts).
   */
  variant?: "bar" | "floating";
  /** From md up: "static" keeps it in the page flow, "hidden" removes it (desktop has its own action) */
  desktop?: "static" | "hidden";
  /** Height reserved at the end of the content on phones so nothing hides behind the bar */
  spacerClassName?: string;
  className?: string;
}

/**
 * Primary actions in thumb reach on phones, pinned right above the tab bar. Renders its own
 * spacer, so pages don't hand-tune bottom padding. Rendered conditionally inside
 * <AnimatePresence>, it slides in and out.
 */
export function BottomActionBar({
  children,
  variant = "bar",
  desktop = "hidden",
  spacerClassName = "h-20",
  className,
}: BottomActionBarProps) {
  return (
    <>
      <div aria-hidden="true" className={cn("md:hidden", spacerClassName)} />
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: spring.snappy }}
        exit={{ y: 24, opacity: 0, transition: { duration: duration.feedback, ease: ease.in } }}
        className={cn(
          "fixed inset-x-0 bottom-tabbar z-40",
          variant === "bar"
            ? "flex flex-wrap items-stretch gap-2 px-4 py-3 bg-white border-t border-viola/15 [&>*]:flex-auto"
            : "px-4 pb-3",
          desktop === "hidden"
            ? "md:hidden"
            : "md:static md:z-auto md:p-0 md:bg-transparent md:border-0 md:flex-nowrap md:[&>*]:flex-none md:transform-none! md:opacity-100!",
          className
        )}
      >
        {children}
      </motion.div>
    </>
  );
}
