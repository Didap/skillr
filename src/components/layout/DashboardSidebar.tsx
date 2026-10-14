"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { LogoMark } from "@/components/brand/LogoMark";
import { primaryNav, LEGAL_LINKS, isOwnProfile } from "./nav-items";
import { signOutAndClearDraft } from "@/lib/sign-out";

export function DashboardSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  return (
    <aside className="hidden md:flex w-24 lg:w-72 border-r border-viola/15 bg-white flex-col p-6 z-40 shrink-0">
      <div className="flex items-center justify-center lg:justify-start px-1 lg:px-3 mb-12">
        <Link href="/dashboard" aria-label="Helllo" className="flex items-center rounded-full">
          {/* Collapsed rail: the round "lll" badge; full sidebar: the wordmark */}
          <LogoMark className="size-11 lg:hidden" />
          <Logo title={null} className="hidden lg:block h-9" />
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {primaryNav(session.user.role).map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            icon={<item.icon size={22} strokeWidth={1.75} />}
            label={item.label}
            active={item.isActive(pathname)}
          />
        ))}
        <SidebarLink
          href="/profile"
          icon={<User size={22} strokeWidth={1.75} />}
          label="Profilo"
          active={isOwnProfile(pathname, session.user.id)}
        />
      </nav>

      <div className="pt-6 border-t border-viola/15 flex flex-col gap-1">
        <SidebarLink
          href="/settings"
          icon={<Settings size={22} strokeWidth={1.75} />}
          label="Impostazioni"
          active={pathname.startsWith("/settings")}
        />
        <button
          onClick={() => signOutAndClearDraft()}
          className="pressable flex items-center justify-center lg:justify-start gap-4 h-12 px-3.5 lg:px-4 rounded-full text-viola-500 hover:text-rosso-700 hover:bg-rosso-50 transition-colors font-semibold text-sm"
        >
          <LogOut size={22} strokeWidth={1.75} />
          <span className="hidden lg:block">Esci</span>
        </button>
      </div>

      <div className="mt-auto pt-8 px-4 hidden lg:flex flex-wrap gap-x-4 gap-y-2">
        {LEGAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="text-label text-viola-400 hover:text-viola transition-colors">{label}</Link>
        ))}
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        // Same language as the mobile tab bar: viola line icons, the active item in a rosa pill
        "pressable flex items-center justify-center lg:justify-start gap-4 h-12 px-3.5 lg:px-4 rounded-full transition-colors font-semibold text-sm text-viola",
        active ? "bg-rosa" : "hover:bg-crema"
      )}
    >
      {icon}
      <span className="hidden lg:block">{label}</span>
    </Link>
  );
}
