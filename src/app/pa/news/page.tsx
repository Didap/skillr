"use server";

import { getPaNewsAction } from "@/app/actions/news";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  Newspaper,
  Search
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default async function PaNewsPage() {
  const result = await getPaNewsAction();
  const posts = (result.success && result.posts) ? result.posts : [];

  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Navigation & Header */}
        <div className="mb-16">
          <Link href="/pa" className="group inline-flex items-center rounded-full text-sm font-semibold text-viola-500 hover:text-blu transition-colors mb-8">
            <span className="mr-3 h-9 w-9 rounded-full border border-viola/15 bg-white flex items-center justify-center" aria-hidden="true">
              <ArrowLeft className="h-4 w-4" />
            </span>
            Torna alla Home PA
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4 text-blu">
                <Newspaper className="h-5 w-5" aria-hidden="true" />
                <span className="text-label">Aggiornamenti tecnici</span>
              </div>
              <h1 className="text-display md:text-5xl md:leading-tight font-display font-bold text-viola">
                News & Bandi per la <span className="text-blu">Pubblica Amministrazione</span>
              </h1>
              <p className="text-xl text-viola-500 mt-6 leading-relaxed">
                Approfondimenti tecnici, bandi PNRR e analisi territoriali per guidare l&apos;innovazione nelle politiche attive in Puglia.
              </p>
            </div>

            <div className="relative min-w-[300px]">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-viola-500" aria-hidden="true" />
              </div>
              <input
                type="text"
                aria-label="Cerca tra i bandi"
                placeholder="Cerca tra i bandi..."
                className="w-full h-12 bg-crema rounded-full pl-11 pr-4 text-viola placeholder:text-viola-500 border border-transparent focus-visible:border-blu focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Featured Post (if any) or News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link key={post.id} href={`/pa/news/${post.slug}`} className="group rounded-card">
                <Card className="h-full py-0 gap-0 hover:ring-blu/40 transition-shadow flex flex-col">
                  <div className="aspect-video bg-crema relative overflow-hidden">
                    {post.imageUrl ? (
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-crema bg-[url(/brand/pattern-crema.svg)] bg-cover bg-center" aria-hidden="true" />
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge variant="outline" className="h-auto border-transparent px-3 py-1 text-label">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-label text-viola-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.publishedAt ? format(new Date(post.publishedAt), "dd MMMM yyyy", { locale: it }) : "Bozza"}
                      </div>
                      <div className="h-1 w-1 rounded-full bg-viola-300" aria-hidden="true" />
                      <span>5 min lettura</span>
                    </div>
                    <h3 className="text-xl font-bold text-viola mb-3 group-hover:text-blu transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-viola-500 text-sm leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto pt-2 flex items-center text-blu font-semibold text-sm">
                      Leggi l&apos;articolo
                      <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="bg-crema rounded-card p-12 inline-block">
                <BookOpen className="h-14 w-14 text-viola-300 mx-auto mb-6" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-viola mb-2">Nessun articolo trovato</h2>
                <p className="text-viola-500 max-w-sm mx-auto">
                  Stiamo preparando i nuovi aggiornamenti sui bandi Puglia 2026. Torna a trovarci presto!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-24 bg-blu rounded-card p-8 md:p-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl text-center lg:text-left">
              <h2 className="text-title md:text-4xl md:leading-tight font-bold text-white mb-6">Non perdere i prossimi bandi</h2>
              <p className="text-blu-100 text-lg">
                Iscriviti alla nostra newsletter istituzionale per ricevere approfondimenti tecnici e notifiche sui bandi in uscita direttamente nella tua PEC.
              </p>
            </div>
            <Link
              href="/pa/newsletter"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-14 px-10 text-base font-bold border-white text-blu-800 hover:bg-blu-50 focus-visible:outline-white"
              )}
            >
              Iscriviti ora
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
