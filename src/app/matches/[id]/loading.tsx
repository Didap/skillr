import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-20 border-b border-border-subtle bg-white/80 backdrop-blur-md flex items-center px-6 shrink-0 sticky top-0 z-50">
        <div className="max-w-5xl w-full mx-auto flex items-center">
          <div className="w-10 h-10 rounded-full bg-surface-warm flex items-center justify-center mr-4">
            <ArrowLeft size={20} className="text-text-muted opacity-20" />
          </div>
          <Skeleton className="h-8 w-48 bg-surface-warm" />
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 lg:p-12">
        <div className="space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-border-subtle shadow-premium overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center">
                <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-surface-warm shrink-0" />
                
                <div className="flex-1 space-y-6">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-24 bg-surface-warm rounded-full" />
                    <Skeleton className="h-12 w-3/4 bg-surface-warm" />
                    <Skeleton className="h-8 w-1/2 bg-surface-warm" />
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-surface-warm" />
                    <Skeleton className="h-4 w-5/6 bg-surface-warm" />
                  </div>

                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 bg-surface-warm rounded-lg" />
                    <Skeleton className="h-6 w-24 bg-surface-warm rounded-lg" />
                    <Skeleton className="h-6 w-16 bg-surface-warm rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border-subtle/50 p-12 bg-surface/10">
              <div className="flex flex-col items-center gap-6">
                <Skeleton className="h-6 w-32 bg-surface-warm rounded-full" />
                <Skeleton className="h-16 w-64 bg-surface-warm rounded-2xl" />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
