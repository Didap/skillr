"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { ChatVisibilityContext } from "@/components/chat/ChatVisibility";

// Two columns only where both fit next to the full sidebar
const WIDE = "(min-width: 1280px)";

function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(WIDE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE).matches,
    () => false
  );
}

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "details", label: "Dettagli" },
] as const;

/** Phones and tablets: "Chat" / "Dettagli" tabs, chat first. From xl: details | chat. */
export function MatchDetailLayout({ details, chat }: { details: React.ReactNode; chat: React.ReactNode | null }) {
  const [tab, setTab] = useState<"chat" | "details">("chat");
  const wide = useWide();
  if (!chat) return <>{details}</>;

  return (
    <div className="flex-1 min-h-0 flex flex-col xl:flex-row">
      <div role="tablist" aria-label="Sezioni del match" className="xl:hidden shrink-0 flex gap-1 px-4 pt-3 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`match-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`match-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "pressable h-10 flex-1 rounded-full text-chip font-semibold transition-colors",
              tab === t.id ? "bg-viola text-white" : "bg-crema text-viola"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        id="match-panel-details"
        role="tabpanel"
        aria-labelledby="match-tab-details"
        className={cn("flex-1 min-h-0 min-w-0 flex-col", tab === "details" ? "flex" : "hidden xl:flex")}
      >
        {details}
      </div>

      <section
        id="match-panel-chat"
        role="tabpanel"
        aria-labelledby="match-tab-chat"
        className={cn(
          "min-h-0 flex-col pb-tabbar xl:w-[26rem] 2xl:w-[30rem] xl:shrink-0 xl:border-l xl:border-viola/15",
          tab === "chat" ? "flex flex-1 xl:flex-none" : "hidden xl:flex"
        )}
      >
        <ChatVisibilityContext.Provider value={wide || tab === "chat"}>{chat}</ChatVisibilityContext.Provider>
      </section>
    </div>
  );
}
