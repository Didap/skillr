"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CalendarRange, CircleUser, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { primaryNav } from "./nav-items";

/** Thumb-reach navigation for phones; the sidebar takes over from md up. */
export function MobileTabBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);

  if (!session?.user) return null;

  // Five slots at most: the company has one more destination, so the calendar moves to "Tu"
  const items = primaryNav(session.user.role).slice(0, 4);
  const calendarInSheet = session.user.role === "company";
  const accountActive = pathname.startsWith("/settings") || pathname.startsWith("/profile");

  return (
    <>
      <nav
        aria-label="Navigazione principale"
        className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/85 backdrop-blur-xl pb-safe"
      >
        <ul className="grid grid-cols-5 h-16 px-2">
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
                      className="absolute top-1.5 h-8 w-14 rounded-full bg-emerald-50"
                    />
                  )}
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 2}
                    className={cn("relative transition-colors", active ? "text-emerald-700" : "text-slate-400")}
                  />
                  <span
                    className={cn(
                      "relative text-[11px] font-bold tracking-tight transition-colors",
                      active ? "text-slate-950" : "text-slate-500"
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
                  className="absolute top-1.5 h-8 w-14 rounded-full bg-emerald-50"
                />
              )}
              <CircleUser
                size={21}
                strokeWidth={accountActive ? 2.4 : 2}
                className={cn("relative", accountActive ? "text-emerald-700" : "text-slate-400")}
              />
              <span className={cn("relative text-[11px] font-bold tracking-tight", accountActive ? "text-slate-950" : "text-slate-500")}>
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
              onClick={() => {
                try { localStorage.removeItem("onboarding_draft"); } catch {}
                signOut({ callbackUrl: "/" });
              }}
              className="pressable w-full flex items-center gap-4 h-14 px-4 rounded-2xl text-red-600 font-bold hover:bg-red-50"
            >
              <LogOut size={20} />
              Esci
            </button>
          </li>
        </ul>
        <div className="mt-6 pt-4 border-t border-slate-100 flex gap-6 text-xs font-bold text-slate-500">
          <Link href="/privacy" onClick={() => setAccountOpen(false)}>Privacy</Link>
          <Link href="/terms" onClick={() => setAccountOpen(false)}>Termini</Link>
          <Link href="/cookies" onClick={() => setAccountOpen(false)}>Cookies</Link>
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
        className="pressable flex items-center gap-4 h-14 px-4 rounded-2xl text-slate-900 font-bold hover:bg-slate-50"
      >
        <span className="text-slate-400">{icon}</span>
        {label}
      </Link>
    </li>
  );
}
