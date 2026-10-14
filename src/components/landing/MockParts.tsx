import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

// Small pieces shared by the decorative product mocks on the landing (hero card,
// "come funziona" previews, trust profile). They are illustrations: keep them aria-hidden.

/** Skill chip: rosa pill with viola text; white on rosa surfaces, crema for neutral meta. */
export function MockChip({
  children,
  tone = "rosa",
}: {
  children: React.ReactNode;
  tone?: "rosa" | "white" | "crema";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[13px] leading-4 font-medium text-viola",
        tone === "rosa" && "bg-rosa",
        tone === "white" && "bg-white",
        tone === "crema" && "bg-crema"
      )}
    >
      {children}
    </span>
  );
}

/** The positive swipe action: rosso pill with the white wordmark + "!". */
export function HellloPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-12 items-center justify-center gap-0.5 rounded-full bg-rosso px-6 text-white",
        className
      )}
    >
      <Logo title={null} className="h-6 text-white" />
      <span className="text-2xl leading-none font-bold">!</span>
    </span>
  );
}

/** Round icon button look: white circle with a 1px viola outline. */
export function IconCircle({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-viola bg-white text-viola",
        className
      )}
    >
      <Icon size={20} strokeWidth={1.75} />
    </span>
  );
}

/** Swipe action bar under a mock card: pass, helllo!, save. */
export function MockActionBar({ pass, save }: { pass: LucideIcon; save: LucideIcon }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <IconCircle icon={pass} />
      <HellloPill className="flex-1" />
      <IconCircle icon={save} />
    </div>
  );
}
