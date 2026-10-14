"use client";

import Image from "next/image";
import { Briefcase, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEventDayShort } from "@/lib/rome-time";

export interface MyApplication {
  id: string;
  status: "pending" | "rejected";
  createdAt: Date | string | null;
  jobTitle: string;
  location: string | null;
  companyName: string;
  companyLogo: string | null;
}

// Loaded by the page together with the matches (getMatches), so both arrive in one call.
export type MyApplicationsResult = { success: true; data: MyApplication[] } | { success?: undefined; error: string };

// Professional side of /matches: applications still waiting for the company, or turned down.
// Accepted applications are not here, they are already in the match list.
export function MyApplications({ result }: { result: MyApplicationsResult }) {
  const applications = result.success ? result.data : null;
  const error = result.success ? null : result.error || "Errore durante il caricamento delle candidature";

  return (
    <section className="mt-10 md:mt-16 pt-8 md:pt-12 border-t border-viola-100" aria-labelledby="my-applications-title">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-rosso-50 flex items-center justify-center text-rosso-600 shrink-0">
          <Briefcase size={18} aria-hidden="true" />
        </div>
        <h2 id="my-applications-title" className="text-lg md:text-xl font-bold text-viola-950">Le tue candidature</h2>
        {applications && applications.length > 0 && (
          <span className="ml-auto text-xs font-bold text-viola-400 tabular-nums">{applications.length}</span>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-rosso-600 bg-rosso-50 border border-rosso-100 rounded-2xl p-4 md:p-6">
          {error}
        </p>
      ) : applications && applications.length > 0 ? (
        <ul className="grid gap-3">
          {applications.map((app) => {
            const pending = app.status === "pending";
            return (
              <li
                key={app.id}
                className="flex items-center gap-3 md:gap-5 min-h-16 p-4 md:p-5 rounded-3xl bg-white border border-viola-50 shadow-card"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-viola-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {app.companyLogo ? (
                    <Image src={app.companyLogo} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span className="font-display text-2xl text-viola-400">{app.companyName[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-viola-950 truncate">{app.jobTitle}</p>
                  <p className="text-sm text-viola-500 font-medium truncate">
                    {app.companyName}
                    {app.location ? ` · ${app.location}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold leading-none",
                        pending
                          ? "bg-amber-50 text-amber-800 border-amber-100"
                          : "bg-viola-50 text-viola-500 border-viola-200"
                      )}
                    >
                      {pending ? <Clock size={12} aria-hidden="true" /> : <XCircle size={12} aria-hidden="true" />}
                      {pending ? "In valutazione" : "Non selezionata"}
                    </span>
                    {app.createdAt && (
                      <span className="text-xs font-semibold text-viola-400">
                        Inviata il {formatEventDayShort(app.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-viola-500 font-medium text-center px-5 py-8 bg-viola-50/50 rounded-2xl border border-dashed border-viola-200">
          Nessuna candidatura in attesa. Le ricerche a cui ti candidi con uno swipe a destra appaiono qui.
        </p>
      )}
    </section>
  );
}
