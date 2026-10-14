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
    <section className="mt-10 md:mt-14 pt-8 md:pt-10 border-t border-viola/15" aria-labelledby="my-applications-title">
      <div className="flex items-center gap-3 mb-4 md:mb-5">
        <span className="size-10 rounded-full bg-rosa flex items-center justify-center text-viola shrink-0">
          <Briefcase size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 id="my-applications-title" className="text-xl md:text-title font-bold text-viola">Le tue candidature</h2>
        {applications && applications.length > 0 && (
          <span className="ml-auto rounded-full bg-rosa px-3 py-1 text-label text-viola tabular-nums">{applications.length}</span>
        )}
      </div>

      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive bg-rosso-50 rounded-card p-5 md:p-6">
          <XCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : applications && applications.length > 0 ? (
        <ul className="grid gap-3">
          {applications.map((app) => {
            const pending = app.status === "pending";
            return (
              <li
                key={app.id}
                className="flex items-center gap-3 md:gap-5 min-h-16 p-4 md:p-5 rounded-card bg-white border border-viola/15"
              >
                <div className="size-12 md:size-14 rounded-full bg-crema overflow-hidden shrink-0 flex items-center justify-center">
                  {app.companyLogo ? (
                    <Image src={app.companyLogo} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xl font-bold text-viola">{app.companyName[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-viola truncate">{app.jobTitle}</p>
                  <p className="text-sm text-viola-500 font-medium truncate">
                    {app.companyName}
                    {app.location ? ` · ${app.location}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label leading-none",
                        pending ? "bg-rosa text-viola" : "bg-viola-50 text-viola-500"
                      )}
                    >
                      {pending ? <Clock size={14} strokeWidth={1.75} aria-hidden="true" /> : <XCircle size={14} strokeWidth={1.75} aria-hidden="true" />}
                      {pending ? "In valutazione" : "Non selezionata"}
                    </span>
                    {app.createdAt && (
                      <span className="text-label text-viola-400">
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
        <p className="text-body text-viola-500 text-center px-5 py-8 bg-crema rounded-card">
          Nessuna candidatura in attesa. Le ricerche a cui dici helllo con uno swipe a destra appaiono qui.
        </p>
      )}
    </section>
  );
}
