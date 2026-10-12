import { Plus } from "lucide-react";

const QUESTIONS = [
  {
    q: "Quanto costa Skillr?",
    a: "Niente. Creare il profilo è gratis, per i professionisti e per le aziende.",
  },
  {
    q: "Perché non c'è una chat?",
    a: "Perché le chat si allungano e raramente arrivano a una decisione. Su Skillr skill, tariffa e budget sono già sulla card, quindi dopo il match si passa a una call di 30 minuti.",
  },
  {
    q: "Chi vede la mia tariffa?",
    a: "Le aziende iscritte, quando il tuo profilo compare tra quelli da valutare. Vale anche al contrario: ogni offerta mostra il suo budget ai professionisti.",
  },
  {
    q: "Cosa succede dopo il match?",
    a: "Vi arriva una email. L'azienda propone fino a 3 orari, il professionista ne sceglie uno e l'invito con il link (Google Meet, Zoom o Teams) entra nel calendario di entrambi. Prima della call arriva anche un promemoria.",
  },
  {
    q: "Come funzionano le recensioni?",
    a: "Si sbloccano passato l'orario della call. Professionista e azienda si valutano a vicenda da 1 a 5 stelle, con un commento se vogliono. La media compare sul profilo.",
  },
  {
    q: "Come capisco se un'azienda è seria?",
    a: "Ogni azienda si registra con la Partita IVA e dichiara che i dati sono veri, e nessuna offerta va online senza budget. Il resto lo dicono le recensioni di chi ci ha già fatto una call.",
  },
  {
    q: "Cosa sono gli Smart Interview?",
    a: "Sessioni organizzate dalle aziende: più professionisti prenotano un posto e conoscono il team con call brevi. Servono a farsi notare anche senza un match.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-32 bg-white scroll-mt-20">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="font-display text-5xl md:text-7xl text-slate-950 leading-tight mb-16 text-center">
          Domande <span className="italic text-emerald-600">frequenti.</span>
        </h2>

        <div className="divide-y divide-slate-100 border-y border-slate-100">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group py-2">
              <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-lg md:text-xl font-bold text-slate-950 tracking-tight">{q}</span>
                <span className="shrink-0 w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 transition-all group-open:rotate-45 group-open:border-emerald-600 group-open:text-emerald-600">
                  <Plus size={18} />
                </span>
              </summary>
              <p className="pb-6 pr-4 md:pr-16 text-slate-500 font-medium leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
