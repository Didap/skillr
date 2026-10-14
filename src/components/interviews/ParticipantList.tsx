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

// Avatars without a photo: initials on a brand colour, picked from the id so it stays stable
const AVATAR_TONES = ["bg-blu text-white", "bg-viola text-rosa", "bg-rosa text-viola"];

function avatarTone(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

function initials(name: string | null, email: string) {
  const source = (name || email).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

/** Booked professionals, used by the participants sheet. */
export function ParticipantList({ loading, participants }: { loading: boolean; participants: Participant[] }) {
  if (loading) {
    return (
      <div className="py-14 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin motion-reduce:animate-none text-rosso size-7" />
        <p className="text-label text-viola-500">Caricamento...</p>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-14 h-14 bg-rosa rounded-full flex items-center justify-center text-viola mx-auto mb-3">
          <Users size={26} strokeWidth={1.75} />
        </div>
        <p className="text-body text-viola-500">Nessun iscritto per ora.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-viola/15 -mx-2">
      {participants.map((p) => (
        <li key={p.id}>
          <Link
            href={`/profile/${p.id}`}
            className="pressable flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-crema transition-colors"
          >
            <div className={`w-11 h-11 rounded-full overflow-hidden shrink-0 relative ${avatarTone(p.id)}`}>
              {(p.photoUrl || p.image) ? (
                <Image
                  src={(p.photoUrl || p.image) as string}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold" aria-hidden="true">
                  {initials(p.name, p.email)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-bold text-viola truncate">{p.name || p.email}</p>
              <p className="text-label text-viola-500 truncate">{p.title || "Professionista"}</p>
            </div>
            <ExternalLink size={16} className="text-viola-400 shrink-0" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
