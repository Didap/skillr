"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MatchOverlay } from "@/components/swipe/MatchOverlay";
import { Button } from "@/components/ui/button";

const PARTIES = {
  professional: { name: "Luca", image: null, detail: "Junior Graphic Designer" },
  company: { name: "Studio Nord", image: null, detail: "Agenzia di branding" },
};

export function MatchPreview() {
  const [open, setOpen] = useState(true);
  const [run, setRun] = useState(0);
  const [role, setRole] = useState<"professional" | "company">("professional");

  const replay = (next = role) => {
    setRole(next);
    setOpen(false);
    setRun((n) => n + 1);
    requestAnimationFrame(() => setOpen(true));
  };

  return (
    <main className="min-h-dvh bg-crema p-6 flex flex-col items-center justify-center gap-3">
      <Button onClick={() => replay()}>Rivedi il match</Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => replay("professional")}>Vista professionista</Button>
        <Button variant="outline" onClick={() => replay("company")}>Vista azienda</Button>
      </div>
      <AnimatePresence>
        {open && (
          <MatchOverlay
            key={run}
            parties={PARTIES}
            viewerRole={role}
            matchId="preview"
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
