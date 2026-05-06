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
import { Button } from "@/components/ui/button";
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
      <div className="bg-pa-gray-cold py-12 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-pa-gray-cold">
        <div className="max-w-4xl mx-auto">
          <Link href="/pa/news" className="group inline-flex items-center text-sm font-semibold text-text-secondary hover:text-pa-blue transition-all mb-12">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Tutte le news
          </Link>
          
          <div className="flex flex-col gap-6">
            <Badge className="w-fit bg-pa-blue/10 text-pa-blue border-none font-bold px-3 py-1 uppercase text-xs tracking-widest">
              {post.category}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-pa-blue leading-tight tracking-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-pa-blue/50" />
                {post.publishedAt ? format(new Date(post.publishedAt), "dd MMMM yyyy", { locale: it }) : "Bozza"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-pa-blue/50" />
                5 minuti di lettura
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-pa-blue/50 cursor-pointer hover:text-pa-blue" />
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
          <p className="text-xl md:text-2xl text-pa-blue/80 font-medium leading-relaxed italic mb-12 border-l-4 border-accent pl-8">
            {post.excerpt}
          </p>

          {/* Article Main Content */}
          <div className="prose prose-lg prose-slate max-w-none prose-headings:text-pa-blue prose-headings:font-display prose-headings:font-bold prose-p:text-text-secondary prose-p:leading-relaxed prose-strong:text-pa-blue prose-a:text-pa-blue prose-a:font-bold hover:prose-a:text-accent transition-colors">
            {/* 
              Per semplicità rendering HTML, ma idealmente useremmo un parser markdown. 
              Dato che i dati vengono dall'azione, facciamo un mapping di base o usiamo dangerouslySetInnerHTML
            */}
            <div 
              className="space-y-6 whitespace-pre-wrap font-medium"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>

          {/* Institutional Note */}
          <div className="mt-20 p-8 bg-pa-gray-cold/50 rounded-3xl border border-pa-gray-cold">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-white rounded-lg shadow-sm">
                <Tag className="h-5 w-5 text-pa-blue" />
              </div>
              <div>
                <h4 className="font-bold text-pa-blue mb-1">Nota Istituzionale</h4>
                <p className="text-sm text-text-muted leading-relaxed font-medium">
                  Le informazioni contenute in questo articolo sono puramente informative e basate sugli atti ufficiali della Regione Puglia e del Ministero del Lavoro. Per i testi di legge definitivi, consultare sempre il BURP (Bollettino Ufficiale della Regione Puglia).
                </p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="mt-16 bg-white border-2 border-pa-blue rounded-3xl p-8 md:p-12 shadow-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pa-blue/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-pa-blue mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-accent" />
                Interessato a questo bando?
              </h3>
              <p className="text-text-secondary mb-8 text-lg font-medium leading-relaxed">
                Skillr può supportare il tuo ente nel match con i profili professionali più adatti per i progetti legati a questa iniziativa. Richiedi una demo del sistema di matching.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/pa">
                  <Button className="bg-pa-blue text-white hover:bg-pa-blue-dark h-12 px-8 rounded-xl font-bold w-full sm:w-auto">
                    Richiedi Demo Match
                  </Button>
                </Link>
                <Link href="/pa/newsletter">
                  <Button variant="outline" className="border-pa-blue text-pa-blue hover:bg-pa-blue/5 h-12 px-8 rounded-xl font-bold w-full sm:w-auto">
                    Iscriviti alla Newsletter
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-20 pt-12 border-t border-slate-100 flex justify-between items-center">
            <Link href="/pa/news" className="text-sm font-bold text-pa-blue hover:text-accent transition-colors uppercase tracking-widest flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Articolo Precedente
            </Link>
            <Link href="/pa/news" className="text-sm font-bold text-pa-blue hover:text-accent transition-colors uppercase tracking-widest flex items-center">
              Articolo Successivo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
