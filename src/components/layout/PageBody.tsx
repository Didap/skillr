import { cn } from "@/lib/utils";

/**
 * The scrolling area under a PageHeader. AppShell already provides the full-height column;
 * this owns the scroll, contains overscroll, and reserves the mobile tab bar's height.
 */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto overscroll-contain pb-tabbar", className)}>{children}</div>;
}
