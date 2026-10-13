import { AppShell } from "@/components/layout/AppShell";

// One shell for every logged-in section, so switching tabs keeps the sidebar and the
// tab bar mounted (and the active-tab pill can slide between them).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
