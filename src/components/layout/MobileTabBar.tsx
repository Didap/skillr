"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CalendarRange, CircleUser, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { primaryNav, LEGAL_LINKS, isOwnProfile } from "./nav-items";
import { signOutAndClearDraft } from "@/lib/sign-out";

/** Thumb-reach navigation for phones; the sidebar takes over from md up. */
export function MobileTabBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);

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
        className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-viola-100 bg-white/85 backdrop-blur-xl pb-safe"
      >
        <ul className="grid grid-cols-5 h-(--tabbar-h) px-2">
          {items.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="pressable relative h-full flex flex-col items-center justify-center gap-1"
                >
                  {active && (
                    <motion.span
                      layoutId="tabbar-pill"
                      transition={spring.snappy}
                      className="absolute top-1.5 h-8 w-14 rounded-full bg-rosso-50"
                    />
                  )}
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 2}
                    className={cn("relative transition-colors", active ? "text-rosso-700" : "text-viola-400")}
                  />
                  <span
                    className={cn(
                      "relative text-[11px] font-bold tracking-tight transition-colors",
                      active ? "text-viola-950" : "text-viola-500"
                    )}
                  >
                    {item.short}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setAccountOpen(true)}
              aria-haspopup="dialog"
              className="pressable relative w-full h-full flex flex-col items-center justify-center gap-1"
            >
              {accountActive && (
                <motion.span
                  layoutId="tabbar-pill"
                  transition={spring.snappy}
                  className="absolute top-1.5 h-8 w-14 rounded-full bg-rosso-50"
                />
              )}
              <CircleUser
                size={21}
                strokeWidth={accountActive ? 2.4 : 2}
                className={cn("relative", accountActive ? "text-rosso-700" : "text-viola-400")}
              />
              <span className={cn("relative text-[11px] font-bold tracking-tight", accountActive ? "text-viola-950" : "text-viola-500")}>
                Tu
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <BottomSheet open={accountOpen} onClose={() => setAccountOpen(false)} title={session.user.name || "Il tuo account"}>
        <ul className="flex flex-col gap-1">
          {calendarInSheet && (
            <SheetLink href="/dashboard/calendar" icon={<CalendarRange size={20} />} label="Calendario" onNavigate={() => setAccountOpen(false)} />
          )}
          <SheetLink href="/profile" icon={<User size={20} />} label="Il mio profilo" onNavigate={() => setAccountOpen(false)} />
          <SheetLink href="/settings" icon={<Settings size={20} />} label="Impostazioni" onNavigate={() => setAccountOpen(false)} />
          <li>
            <button
              onClick={() => signOutAndClearDraft()}
              className="pressable w-full flex items-center gap-4 h-14 px-4 rounded-2xl text-rosso-600 font-bold hover:bg-rosso-50"
            >
              <LogOut size={20} />
              Esci
            </button>
          </li>
        </ul>
        <div className="mt-6 pt-4 border-t border-viola-100 flex gap-6 text-xs font-bold text-viola-500">
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
        className="pressable flex items-center gap-4 h-14 px-4 rounded-2xl text-viola-900 font-bold hover:bg-viola-50"
      >
        <span className="text-viola-400">{icon}</span>
        {label}
      </Link>
    </li>
  );
}
