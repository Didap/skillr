import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/brand/Logo";

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
 * safe-area aware), roomier on desktop like the original headers. Top-level pages (no back
 * link) carry the wordmark top-left on phones, where there is no sidebar to hold it.
 */
export function PageHeader({ title, loading, subtitle, backHref, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 shrink-0 border-b border-viola/15 bg-white pt-safe",
        className
      )}
    >
      <div className="h-14 md:h-24 px-4 md:px-10 flex items-center gap-2 md:gap-4">
        {!backHref && (
          <Link
            href="/dashboard"
            aria-label="Helllo"
            className="md:hidden shrink-0 flex items-center gap-3 rounded-full"
          >
            <Logo title={null} className="h-7" />
            <span aria-hidden="true" className="h-6 w-px bg-viola/15" />
          </Link>
        )}
        {backHref && (
          <Link
            href={backHref}
            aria-label="Indietro"
            className="pressable shrink-0 -ml-2 w-11 h-11 rounded-full flex items-center justify-center text-viola hover:bg-crema"
          >
            <ChevronLeft size={22} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {loading ? (
            <Skeleton className="h-7 w-32 md:w-56 rounded-full" />
          ) : (
            <h1 className="font-display text-xl font-bold md:text-title text-viola truncate">{title}</h1>
          )}
          {subtitle && (
            <p className="hidden md:block text-sm font-medium text-viola-500 truncate">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
