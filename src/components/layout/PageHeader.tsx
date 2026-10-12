import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type PageHeaderProps = {
  /** Short context line; shown from md up, hidden on phones to keep the bar one line */
  subtitle?: string;
  /** Back destination: renders a chevron button before the title */
  backHref?: string;
  /** Right-side controls. On phones keep them icon-sized (h-11 w-11) */
  actions?: React.ReactNode;
  className?: string;
} & (
  | { title: string; loading?: never }
  /** For loading.tsx: a skeleton bar where the title will stream in */
  | { title?: never; loading: true }
);

/**
 * Sticky top bar shared by every logged-in page. Compact on phones (56px, one-line title,
 * safe-area aware), roomier on desktop like the original headers.
 */
export function PageHeader({ title, loading, subtitle, backHref, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 shrink-0 border-b border-slate-100/80 bg-white/80 backdrop-blur-xl pt-safe",
        className
      )}
    >
      <div className="h-14 md:h-24 px-4 md:px-10 flex items-center gap-2 md:gap-4">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Indietro"
            className="pressable shrink-0 -ml-2 w-11 h-11 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft size={22} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {loading ? (
            <Skeleton className="h-7 w-40 md:w-56 rounded-full" />
          ) : (
            <h1 className="font-display text-2xl md:text-3xl text-slate-950 truncate leading-tight">{title}</h1>
          )}
          {subtitle && (
            <p className="hidden md:block text-sm font-semibold text-slate-500 truncate">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
