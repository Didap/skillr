"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Briefcase, Clock, XCircle } from "lucide-react";
import { getMyApplications } from "@/app/actions/applications";
import { cn } from "@/lib/utils";

interface MyApplication {
  id: string;
  status: "pending" | "rejected";
  createdAt: Date | string | null;
  jobTitle: string;
  location: string | null;
  companyName: string;
  companyLogo: string | null;
}

// Professional side of /matches: applications still waiting for the company, or turned down.
// Accepted applications are not here, they are already in the match list.
export function MyApplications() {
  const [applications, setApplications] = useState<MyApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await getMyApplications();
      if (res.success) {
        setApplications(res.data || []);
      } else {
        setError(res.error || "Errore durante il caricamento delle candidature");
      }
    }
    load();
  }, []);

  if (!applications && !error) return null;

  return (
    <section className="mt-16 pt-16 border-t border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Briefcase size={20} />
        </div>
        <h2 className="text-xl font-bold text-slate-950">Le tue candidature</h2>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl p-6">
          {error}
        </p>
      ) : applications && applications.length > 0 ? (
        <ul className="grid gap-3">
          {applications.map((app) => {
            const pending = app.status === "pending";
            return (
              <li
                key={app.id}
                className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white border border-slate-50 shadow-card"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {app.companyLogo ? (
                    <Image src={app.companyLogo} alt={app.companyName} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span className="font-display text-2xl italic font-bold text-slate-300">{app.companyName[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-950 truncate">{app.jobTitle}</p>
                  <p className="text-sm text-slate-500 font-medium truncate">
                    {app.companyName}
                    {app.location ? ` · ${app.location}` : ""}
                  </p>
                  {app.createdAt && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                      Inviata il {new Date(app.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border shrink-0",
                    pending
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-slate-50 text-slate-500 border-slate-100"
                  )}
                >
                  {pending ? <Clock size={12} /> : <XCircle size={12} />}
                  {pending ? "In valutazione" : "Non selezionata"}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-400 font-medium italic text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          Nessuna candidatura in attesa. Le ricerche a cui ti candidi con uno swipe a destra appaiono qui.
        </p>
      )}
    </section>
  );
}
