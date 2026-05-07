"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  Zap, 
  Calendar as CalendarIcon, 
  CalendarRange, 
  User, 
  Settings, 
  LogOut, 
  Briefcase 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  return (
    <aside className="w-24 md:w-72 border-r border-slate-100 bg-white flex flex-col p-6 z-50 shrink-0">
      <div className="flex items-center gap-3 px-3 mb-12">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="hidden md:block font-display text-2xl italic font-black tracking-tight text-slate-950">
            Skillr<span className="text-emerald-600">.</span>
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 flex flex-col gap-2">
        <SidebarLink 
          href="/dashboard" 
          icon={<Zap size={20} />} 
          label="Match" 
          active={pathname === "/dashboard"} 
        />
        <SidebarLink 
          href="/matches" 
          icon={<CalendarIcon size={20} />} 
          label="I miei Match" 
          active={pathname.startsWith("/matches")}
        />
        <SidebarLink 
          href="/dashboard/calendar" 
          icon={<CalendarRange size={20} />} 
          label="Calendario" 
          active={pathname === "/dashboard/calendar"}
        />
        
        {session.user.role === 'professional' && (
          <SidebarLink 
            href="/dashboard/smart-interviews" 
            icon={<Zap size={20} />} 
            label="Smart Interviews" 
            active={pathname === "/dashboard/smart-interviews"}
          />
        )}
        
        {session.user.role === 'company' && (
          <>
            <SidebarLink 
              href="/jobs" 
              icon={<Briefcase size={20} />} 
              label="Ricerche Attive" 
              active={pathname.startsWith("/jobs")}
            />
            <SidebarLink 
              href="/dashboard/events" 
              icon={<Zap size={20} />} 
              label="Smart Interviews" 
              active={pathname === "/dashboard/events"}
            />
          </>
        )}
        
        <SidebarLink 
          href="/profile" 
          icon={<User size={20} />} 
          label="Profilo" 
          active={pathname === "/profile"}
        />
      </nav>

      <div className="pt-6 border-t border-slate-50 flex flex-col gap-2">
        <SidebarLink 
          href="/settings" 
          icon={<Settings size={20} />} 
          label="Impostazioni" 
          active={pathname === "/settings"}
        />
        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold text-sm group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="hidden md:block">Esci</span>
        </button>
      </div>

      <div className="mt-auto pt-8 px-4 hidden md:flex flex-wrap gap-x-4 gap-y-2 opacity-40 hover:opacity-100 transition-opacity">
        <Link href="/privacy" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy</Link>
        <Link href="/terms" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Termini</Link>
        <Link href="/cookies" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Cookies</Link>
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
          ? "bg-slate-950 text-white shadow-xl shadow-slate-200" 
          : "text-slate-400 hover:text-slate-950 hover:bg-slate-50"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-emerald-400" : "")}>
        {icon}
      </span>
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}
