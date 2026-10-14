"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileTabBar } from "./MobileTabBar";
import { pageEnter } from "@/lib/motion";
import { ChatRealtimeProvider } from "@/components/chat/ChatRealtimeProvider";

/**
 * Logged-in app frame. Desktop: sidebar + scrolling content column. Phone: full-width
 * content with a bottom tab bar; pages reserve its height with the `pb-tabbar` utility
 * on their own scroll container.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The first page of a visit is server-rendered: fading it in from 0 would keep it invisible
  // until hydration, so it renders as is. Pages reached by client navigation ease in. The
  // shell stays mounted across sections (single (app) layout), so this is set once per visit.
  const [landingPath] = useState(pathname);

  return (
    <ChatRealtimeProvider>
      <div className="h-dvh bg-background flex overflow-hidden">
        <DashboardSidebar />
        {/* Keyed by route: each page eases in, so tab switches read as a change of place */}
        <motion.div
          key={pathname}
          initial={pathname === landingPath ? false : pageEnter.initial}
          animate={pageEnter.animate}
          className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
        >
          {children}
        </motion.div>
        <MobileTabBar />
      </div>
    </ChatRealtimeProvider>
  );
}
