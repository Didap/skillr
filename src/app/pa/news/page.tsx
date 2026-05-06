"use server";

import { getPaNewsAction } from "@/app/actions/news";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  ChevronRight,
  Sparkles,
  Search
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default async function PaNewsPage() {
  const result = await getPaNewsAction();
  const posts = (result.success && result.posts) ? result.posts : [];

  return (
    <div className="min-h-screen bg-pa-gray-cold py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-linear-to-b from-pa-blue/5 to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Navigation & Header */}
        <div className="mb-16">
          <Link href="/pa" className="group inline-flex items-center text-sm font-semibold text-text-secondary hover:text-pa-blue transition-all mb-8">
            <div className="mr-3 h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Torna alla Home PA
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                <span className="text-xs font-bold text-pa-blue uppercase tracking-[0.2em]">Aggiornamenti Tecnici</span>
              </div>
              <h1 className="text-5xl font-display font-bold text-pa-blue leading-tight">
                News & Bandi per la <span className="text-accent">Pubblica Amministrazione</span>
              </h1>
              <p className="text-xl text-text-secondary mt-6 leading-relaxed">
                Approfondimenti tecnici, bandi PNRR e analisi territoriali per guidare l&apos;innovazione nelle politiche attive in Puglia.
              </p>
            </div>
            
            <div className="relative group min-w-[300px]">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-text-muted group-focus-within:text-pa-blue transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Cerca tra i bandi..." 
                className="w-full bg-white border border-pa-gray-cold rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-pa-blue focus:border-pa-blue transition-all outline-hidden font-medium"
              />
            </div>
          </div>
        </div>

        {/* Featured Post (if any) or News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link key={post.id} href={`/pa/news/${post.slug}`} className="group">
                <Card className="h-full border-none shadow-premium hover:shadow-hover bg-white overflow-hidden transition-all duration-500 rounded-3xl flex flex-col">
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    {post.imageUrl ? (
                      <Image 
                        src={post.imageUrl} 
                        alt={post.title} 
                        width={600}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-pa-blue/10 to-pa-blue/5">
                        <BookOpen className="h-12 w-12 text-pa-blue/20" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 backdrop-blur-md text-pa-blue border-none shadow-sm font-bold px-3 py-1 uppercase text-[10px] tracking-wider">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt ? format(new Date(post.publishedAt), "dd MMMM yyyy", { locale: it }) : "Bozza"}
                      </div>
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>5 min lettura</span>
                    </div>
                    <h3 className="text-xl font-bold text-pa-blue mb-4 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed mb-8 line-clamp-3 font-medium">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto pt-4 flex items-center text-pa-blue font-bold text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                      Leggi l&apos;articolo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <div className="bg-white rounded-3xl p-12 shadow-premium inline-block">
                <BookOpen className="h-16 w-16 text-pa-gray-cold mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-pa-blue mb-2">Nessun articolo trovato</h2>
                <p className="text-text-secondary max-w-sm mx-auto">
                  Stiamo preparando i nuovi aggiornamenti sui bandi Puglia 2026. Torna a trovarci presto!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-24 bg-pa-blue rounded-3xl p-8 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Non perdere i prossimi bandi</h2>
              <p className="text-pa-light/80 text-lg">
                Iscriviti alla nostra newsletter istituzionale per ricevere approfondimenti tecnici e notifiche sui bandi in uscita direttamente nella tua PEC.
              </p>
            </div>
            <Link href="/pa/newsletter">
              <Button size="lg" className="bg-accent text-pa-blue hover:bg-white transition-all h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-black/20">
                Iscriviti Ora
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
