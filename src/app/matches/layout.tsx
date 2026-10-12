import { AppShell } from "@/components/layout/AppShell";

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
