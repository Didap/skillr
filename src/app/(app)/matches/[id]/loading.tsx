import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";

// Mirrors the match detail layout (sticky PageHeader, profile block, scheduling block)
// so nothing jumps when the real page streams in.
export default function Loading() {
  return (
    <>
      <PageHeader loading backHref="/matches" />

      <PageBody>
        <main className="max-w-5xl w-full mx-auto px-4 py-5 md:p-8 lg:p-12" aria-busy="true" aria-label="Caricamento del match">
          <div className="md:bg-white md:rounded-card md:border md:border-viola/15 md:overflow-hidden">
            <section className="bg-viola-100 rounded-card md:rounded-none p-6 md:p-12">
              <div className="flex flex-row gap-4 md:gap-10 items-center">
                <Skeleton className="w-20 h-20 md:w-36 md:h-36 rounded-[1.25rem] md:rounded-card bg-viola-200 shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 md:h-11 w-3/4 rounded-full bg-viola-200" />
                  <Skeleton className="h-5 md:h-7 w-1/2 rounded-full bg-viola-200" />
                </div>
              </div>
              <div className="mt-5 md:mt-8 md:pl-46 space-y-5">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full rounded-full bg-viola-200" />
                  <Skeleton className="h-5 w-5/6 rounded-full bg-viola-200" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-9 w-20 rounded-full bg-viola-200" />
                  <Skeleton className="h-9 w-24 rounded-full bg-viola-200" />
                  <Skeleton className="h-9 w-16 rounded-full bg-viola-200" />
                </div>
              </div>
            </section>

            <section className="mt-6 md:mt-0 bg-white rounded-card border border-viola/15 md:rounded-none md:border-0 p-6 md:p-12">
              <div className="flex flex-col items-center gap-4 md:gap-6">
                <Skeleton className="h-8 w-3/4 md:w-80 bg-crema rounded-full" />
                <Skeleton className="h-4 w-2/3 md:w-96 bg-crema rounded-full" />
                <Skeleton className="h-14 w-full md:w-64 bg-crema rounded-full" />
              </div>
            </section>
          </div>
        </main>
      </PageBody>
    </>
  );
}
