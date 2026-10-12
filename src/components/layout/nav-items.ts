import {
  Zap,
  Heart,
  CalendarRange,
  Briefcase,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type Role = "professional" | "company" | "pa_admin" | null | undefined;

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile tab bar */
  short: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

const discover: NavItem = {
  href: "/dashboard",
  label: "Scopri",
  short: "Scopri",
  icon: Zap,
  isActive: (p) => p === "/dashboard",
};

const matches: NavItem = {
  href: "/matches",
  label: "I miei Match",
  short: "Match",
  icon: Heart,
  isActive: (p) => p.startsWith("/matches"),
};

const calendar: NavItem = {
  href: "/dashboard/calendar",
  label: "Calendario",
  short: "Agenda",
  icon: CalendarRange,
  isActive: (p) => p.startsWith("/dashboard/calendar"),
};

const jobs: NavItem = {
  href: "/jobs",
  label: "Ricerche Attive",
  short: "Offerte",
  icon: Briefcase,
  isActive: (p) => p.startsWith("/jobs"),
};

const companyEvents: NavItem = {
  href: "/dashboard/events",
  label: "Smart Interviews",
  short: "Eventi",
  icon: Sparkles,
  isActive: (p) => p.startsWith("/dashboard/events"),
};

const professionalEvents: NavItem = {
  href: "/dashboard/smart-interviews",
  label: "Smart Interviews",
  short: "Eventi",
  icon: Sparkles,
  isActive: (p) => p.startsWith("/dashboard/smart-interviews") || p.startsWith("/dashboard/events/"),
};

/** Primary destinations, in the same order on the sidebar and the mobile tab bar. */
export function primaryNav(role: Role): NavItem[] {
  if (role === "company") return [discover, matches, jobs, companyEvents, calendar];
  return [discover, matches, professionalEvents, calendar];
}
