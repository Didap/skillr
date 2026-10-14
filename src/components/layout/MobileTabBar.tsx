"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CalendarRange, CircleUser, LogOut, Settings, User } from "lucide-react";
import { spring } from "@/lib/motion";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { primaryNav, LEGAL_LINKS, isOwnProfile } from "./nav-items";
import { signOutAndClearDraft } from "@/lib/sign-out";
import { useChatRealtime } from "@/components/chat/ChatRealtimeProvider";
import { UnreadBadge } from "@/components/chat/UnreadBadge";

/** Thumb-reach navigation for phones; the sidebar takes over from md up. */
export function MobileTabBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const { unreadTotal } = useChatRealtime();

  if (!session?.user) return null;

  // Five slots at most: the company has one more destination, so the calendar moves to "Tu"
  const items = primaryNav(session.user.role).slice(0, 4);
  const calendarInSheet = session.user.role === "company";
  const accountActive =
    pathname.startsWith("/settings") ||
    isOwnProfile(pathname, session.user.id) ||
    (calendarInSheet && pathname.startsWith("/dashboard/calendar"));

  return (
    <>
      <nav
        aria-label="Navigazione principale"
        className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-viola/15 bg-white pb-safe"
      >
        {/* Icons only, as in the brand file: the label stays for screen readers */}
        <ul className="grid grid-cols-5 h-(--tabbar-h) px-2">
          {items.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="pressable h-full flex items-center justify-center"
                >
                  <TabPill active={active}>
                    <Icon size={24} strokeWidth={1.75} className="relative text-viola" />
                    {item.href === "/matches" && (
                      <UnreadBadge count={unreadTotal} className="absolute top-0.5 right-2.5" />
                    )}
                  </TabPill>
                  <span className="sr-only">{item.short}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setAccountOpen(true)}
              aria-haspopup="dialog"
              className="pressable w-full h-full flex items-center justify-center"
            >
              <TabPill active={accountActive}>
                <CircleUser size={24} strokeWidth={1.75} className="relative text-viola" />
              </TabPill>
              <span className="sr-only">Tu</span>
            </button>
          </li>
        </ul>
      </nav>

      <BottomSheet open={accountOpen} onClose={() => setAccountOpen(false)} title={session.user.name || "Il tuo account"}>
        <ul className="flex flex-col gap-1">
          {calendarInSheet && (
            <SheetLink href="/dashboard/calendar" icon={<CalendarRange size={22} strokeWidth={1.75} />} label="Calendario" onNavigate={() => setAccountOpen(false)} />
          )}
          <SheetLink href="/profile" icon={<User size={22} strokeWidth={1.75} />} label="Il mio profilo" onNavigate={() => setAccountOpen(false)} />
          <SheetLink href="/settings" icon={<Settings size={22} strokeWidth={1.75} />} label="Impostazioni" onNavigate={() => setAccountOpen(false)} />
          <li>
            <button
              onClick={() => signOutAndClearDraft()}
              className="pressable w-full flex items-center gap-4 h-14 px-4 rounded-full text-rosso-700 font-semibold hover:bg-rosso-50"
            >
              <LogOut size={22} strokeWidth={1.75} />
              Esci
            </button>
          </li>
        </ul>
        <div className="mt-6 pt-4 border-t border-viola/15 flex gap-6 text-label text-viola-500">
          {LEGAL_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setAccountOpen(false)}>{label}</Link>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

function SheetLink({ href, icon, label, onNavigate }: { href: string; icon: React.ReactNode; label: string; onNavigate: () => void }) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className="pressable flex items-center gap-4 h-14 px-4 rounded-full text-viola font-semibold hover:bg-crema"
      >
        {icon}
        {label}
      </Link>
    </li>
  );
}

/** The rosa pill behind the active tab; it slides between tabs (shared layoutId). */
function TabPill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className="relative flex h-11 w-16 items-center justify-center">
      {active && (
        <motion.span
          layoutId="tabbar-pill"
          transition={spring.snappy}
          className="absolute inset-0 rounded-full bg-rosa"
        />
      )}
      {children}
    </span>
  );
}
