"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Loader2, Users } from "lucide-react";

export interface Participant {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  title?: string | null;
  photoUrl?: string | null;
}

/** Booked professionals, used by the participants sheet. */
export function ParticipantList({ loading, participants }: { loading: boolean; participants: Participant[] }) {
  if (loading) {
    return (
      <div className="py-14 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin motion-reduce:animate-none text-emerald-500 size-7" />
        <p className="text-sm text-slate-500 font-medium">Caricamento...</p>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-3">
          <Users size={26} />
        </div>
        <p className="text-[15px] text-slate-500 font-medium">Nessun iscritto per ora.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 -mx-2">
      {participants.map((p) => (
        <li key={p.id}>
          <Link
            href={`/profile/${p.id}`}
            className="pressable flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
              {(p.photoUrl || p.image) ? (
                <Image
                  src={(p.photoUrl || p.image) as string}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Users size={18} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-slate-950 truncate">{p.name || p.email}</p>
              <p className="text-[13px] text-slate-500 truncate">{p.title || "Professionista"}</p>
            </div>
            <ExternalLink size={16} className="text-slate-300 shrink-0" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
