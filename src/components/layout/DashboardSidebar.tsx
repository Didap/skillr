"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Zap, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNav, LEGAL_LINKS, isOwnProfile } from "./nav-items";
import { signOutAndClearDraft } from "@/lib/sign-out";

export function DashboardSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  return (
    <aside className="hidden md:flex w-24 lg:w-72 border-r border-viola-100 bg-viola-50/40 backdrop-blur-xl flex-col p-6 z-40 shrink-0">
      <div className="flex items-center gap-3 px-3 mb-12">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-viola-950 rounded-xl flex items-center justify-center text-white shadow-lg shadow-viola-200">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="hidden lg:block font-display text-2xl font-black tracking-tight text-viola-950">
            Helllo<span className="text-rosso-600">.</span>
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 flex flex-col gap-2">
        {primaryNav(session.user.role).map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            icon={<item.icon size={20} />}
            label={item.label}
            active={item.isActive(pathname)}
          />
        ))}
        <SidebarLink 
          href="/profile" 
          icon={<User size={20} />} 
          label="Profilo" 
          active={isOwnProfile(pathname, session.user.id)}
        />
      </nav>

      <div className="pt-6 border-t border-viola-100 flex flex-col gap-2">
        <SidebarLink 
          href="/settings" 
          icon={<Settings size={20} />} 
          label="Impostazioni" 
          active={pathname.startsWith("/settings")}
        />
        <button 
          onClick={() => signOutAndClearDraft()}
          className="flex items-center gap-4 p-4 rounded-2xl text-viola-400 hover:text-rosso-500 hover:bg-rosso-50/50 transition-all font-bold text-sm group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="hidden lg:block">Esci</span>
        </button>
      </div>

      <div className="mt-auto pt-8 px-4 hidden lg:flex flex-wrap gap-x-4 gap-y-2 opacity-30 hover:opacity-100 transition-opacity">
        {LEGAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="text-[10px] font-bold text-viola-400 hover:text-viola-900 transition-colors uppercase tracking-widest">{label}</Link>
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
        "flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm group",
        active 
          ? "bg-viola-950 text-white shadow-xl shadow-viola-200" 
          : "text-viola-400 hover:text-viola-950 hover:bg-viola-50"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-rosso-400" : "")}>
        {icon}
      </span>
      <span className="hidden lg:block">{label}</span>
    </Link>
  );
}
