import { db } from "./index";
import { paPosts } from "./schema";

async function seedNews() {
  console.log("Seeding institutional news...");

  const posts = [
    {
      slug: "bandi-neet-puglia-2026-nuove-opportunita",
      title: "Bandi NEET Puglia 2026: Nuove opportunità per i Comuni",
      excerpt: "La Regione Puglia annuncia il nuovo pacchetto di finanziamenti per l'inclusione lavorativa dei giovani NEET tramite il programma GOL e FSE+.",
      content: `
        <h2>Il contesto dei NEET in Puglia</h2>
        <p>La Puglia continua ad affrontare una sfida significativa con oltre 200.000 giovani che non studiano e non lavorano. Il nuovo bando 2026 mira a ridurre questa cifra del 15% entro il prossimo biennio.</p>
        
        <h3>Le principali linee di intervento</h3>
        <ul>
          <li><strong>Digital Skills:</strong> Formazione avanzata per lo sviluppo software e data analysis.</li>
          <li><strong>Green Economy:</strong> Inserimento lavorativo in aziende del settore energie rinnovabili.</li>
          <li><strong>Soft Skills:</strong> Coaching e orientamento al lavoro tramite centri accreditati.</li>
        </ul>

        <h3>Il ruolo dei Centri per l'Impiego (CPI)</h3>
        <p>I CPI avranno un ruolo centrale nella profilazione dei candidati. Skillr si integra nativamente con i flussi di dati regionali per facilitare il matching immediato.</p>
      `,
      category: "bandi" as const,
      publishedAt: new Date(),
    },
    {
      slug: "digitalizzazione-servizi-matching-pa",
      title: "Digitalizzazione: Come l'IA sta cambiando il Matching nella PA",
      excerpt: "Analisi tecnica sulle nuove tecnologie di intelligenza artificiale applicate alla selezione dei profili per gli uffici pubblici territoriali.",
      content: `
        <h2>L'evoluzione del reclutamento pubblico</h2>
        <p>La digitalizzazione della Pubblica Amministrazione non è più solo una scelta, ma una necessità dettata dal PNRR. L'IA permette di analizzare migliaia di CV in pochi secondi, garantendo trasparenza e meritocrazia.</p>
        
        <h3>Perché usare algoritmi di matching?</h3>
        <p>A differenza della ricerca manuale, l'algoritmo di Skillr valuta non solo le competenze tecniche ma anche la compatibilità geografica e la disponibilità immediata, riducendo i tempi di assunzione del 40%.</p>
      `,
      category: "tecnico" as const,
      publishedAt: new Date(),
    },
    {
      slug: "case-study-comune-di-bari-smart-interviews",
      title: "Case Study: Comune di Bari e le Smart Interviews",
      excerpt: "Scopri come il Comune di Bari ha ottimizzato il reclutamento per i progetti straordinari del PNRR utilizzando il sistema di Smart Interviews di Skillr.",
      content: `
        <h2>Il problema: 500 posizioni da coprire in 3 mesi</h2>
        <p>Il Comune di Bari doveva gestire una mole enorme di candidature per i progetti di infrastrutturazione urbana. Il sistema tradizionale era troppo lento.</p>
        
        <h3>La soluzione Skillr</h3>
        <p>Implementando il sistema di video-colloqui asincroni e matching pre-filtrato, il Comune ha completato le selezioni in tempi record, garantendo la partenza di tutti i cantieri nei tempi previsti.</p>
      `,
      category: "case-study" as const,
      publishedAt: new Date(),
    }
  ];

  for (const post of posts) {
    await db.insert(paPosts).values(post).onConflictDoNothing();
  }

  console.log("Seeding news completed!");
}

seedNews().catch(console.error);
