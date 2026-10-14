import { cn } from "@/lib/utils";

/** Rosso count for unread messages; reads as "3 messaggi non letti" to screen readers. */
export function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rosso px-1.5 text-[11px] font-bold leading-none text-white tabular-nums",
        className
      )}
    >
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{count === 1 ? "1 messaggio non letto" : `${count} messaggi non letti`}</span>
    </span>
  );
}
