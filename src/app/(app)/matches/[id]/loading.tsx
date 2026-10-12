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
          <div className="md:bg-white md:rounded-[2.5rem] md:border md:border-border-subtle md:shadow-premium md:overflow-hidden">
            <section className="bg-white rounded-3xl border border-border-subtle shadow-card md:rounded-none md:border-0 md:shadow-none p-5 md:p-12">
              <div className="flex flex-row gap-4 md:gap-12 items-center">
                <Skeleton className="w-20 h-20 md:w-40 md:h-40 rounded-3xl md:rounded-[2.5rem] bg-surface-warm shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 md:h-12 w-3/4 bg-surface-warm" />
                  <Skeleton className="h-5 md:h-8 w-1/2 bg-surface-warm" />
                </div>
              </div>
              <div className="mt-5 md:mt-8 md:pl-52 space-y-5">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-surface-warm" />
                  <Skeleton className="h-4 w-5/6 bg-surface-warm" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-20 bg-surface-warm rounded-lg" />
                  <Skeleton className="h-7 w-24 bg-surface-warm rounded-lg" />
                  <Skeleton className="h-7 w-16 bg-surface-warm rounded-lg" />
                </div>
              </div>
            </section>

            <section className="mt-6 md:mt-0 bg-white rounded-3xl border border-border-subtle shadow-card md:rounded-none md:border-0 md:border-t md:shadow-none p-5 md:p-12">
              <div className="flex flex-col items-center gap-4 md:gap-6">
                <Skeleton className="h-8 w-3/4 md:w-80 bg-surface-warm rounded-full" />
                <Skeleton className="h-4 w-2/3 md:w-96 bg-surface-warm rounded-full" />
                <Skeleton className="h-14 w-full md:w-64 bg-surface-warm rounded-2xl" />
              </div>
            </section>
          </div>
        </main>
      </PageBody>
    </>
  );
}
