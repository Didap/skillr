"use server";

import { getPaPostBySlugAction } from "@/app/actions/news";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Share2, 
  Clock, 
  Tag, 
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PaPostPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPaPostBySlugAction(slug);
  
  if (!result.success || !result.post) {
    notFound();
  }

  const { post } = result;

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Hero */}
      <div className="bg-crema py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/pa/news" className="group inline-flex items-center rounded-full text-sm font-semibold text-viola-500 hover:text-blu transition-colors mb-12">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
            Tutte le news
          </Link>
          
          <div className="flex flex-col gap-6">
            <Badge className="h-auto w-fit bg-white text-viola px-3 py-1 text-label">
              {post.category}
            </Badge>
            <h1 className="text-display md:text-5xl lg:text-6xl md:leading-tight font-display font-bold text-viola">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-viola-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blu" aria-hidden="true" />
                {post.publishedAt ? format(new Date(post.publishedAt), "dd MMMM yyyy", { locale: it }) : "Bozza"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blu" aria-hidden="true" />
                5 minuti di lettura
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-blu cursor-pointer" aria-hidden="true" />
                Condividi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Article Lead / Excerpt */}
          <p className="text-xl md:text-2xl text-viola font-medium leading-relaxed mb-12 border-l-4 border-blu pl-6 md:pl-8">
            {post.excerpt}
          </p>

          {/* Article Main Content */}
          <div className="max-w-none text-lg text-viola leading-relaxed [&_h2]:mt-10 [&_h2]:text-title [&_h2]:font-bold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_strong]:font-semibold [&_a]:font-semibold [&_a]:text-blu [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-blu-800">
            {/* 
              Per semplicità rendering HTML, ma idealmente useremmo un parser markdown. 
              Dato che i dati vengono dall'azione, facciamo un mapping di base o usiamo dangerouslySetInnerHTML
            */}
            <div 
              className="space-y-6 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>

          {/* Institutional Note */}
          <div className="mt-20 p-6 md:p-8 bg-crema rounded-card">
            <div className="flex items-start gap-4">
              <div className="shrink-0 h-10 w-10 bg-white rounded-full flex items-center justify-center" aria-hidden="true">
                <Tag className="h-5 w-5 text-blu" />
              </div>
              <div>
                <h2 className="font-bold text-viola mb-1">Nota istituzionale</h2>
                <p className="text-sm text-viola-500 leading-relaxed">
                  Le informazioni contenute in questo articolo sono puramente informative e basate sugli atti ufficiali della Regione Puglia e del Ministero del Lavoro. Per i testi di legge definitivi, consultare sempre il BURP (Bollettino Ufficiale della Regione Puglia).
                </p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="mt-12 bg-white border border-viola/15 rounded-card p-8 md:p-12">
            <h2 className="text-2xl font-bold text-viola mb-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-blu shrink-0" aria-hidden="true" />
              Interessato a questo bando?
            </h2>
            <p className="text-viola-500 mb-8 text-lg leading-relaxed">
              Helllo può supportare il tuo ente nel match con i profili professionali più adatti per i progetti legati a questa iniziativa. Richiedi una demo del sistema di matching.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/pa" className={cn(buttonVariants({ variant: "default" }), "h-12 px-8 text-base w-full sm:w-auto")}>
                Richiedi demo match
              </Link>
              <Link href="/pa/newsletter" className={cn(buttonVariants({ variant: "outline" }), "h-12 px-8 text-base w-full sm:w-auto")}>
                Iscriviti alla newsletter
              </Link>
            </div>
          </div>

          {/* Footer Navigation */}
          <nav aria-label="Altri articoli" className="mt-20 pt-10 border-t border-viola/15 flex justify-between items-center">
            <Link href="/pa/news" className="rounded-full text-sm font-semibold text-blu hover:text-blu-800 transition-colors flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Articolo precedente
            </Link>
            <Link href="/pa/news" className="rounded-full text-sm font-semibold text-blu hover:text-blu-800 transition-colors flex items-center">
              Articolo successivo
              <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
