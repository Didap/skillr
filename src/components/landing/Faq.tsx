import { Plus } from "lucide-react";

const QUESTIONS = [
  {
    q: "Quanto costa Skillr?",
    a: "Creare il profilo è gratuito, sia per i professionisti sia per le aziende.",
  },
  {
    q: "Perché non c'è una chat?",
    a: "Perché le chat diventano lunghe trattative che non portano a niente. Su Skillr le informazioni che contano (skill, tariffa, budget) sono già sulla card. Dopo il match si passa direttamente a una call di 30 minuti, che chiarisce più di cento messaggi.",
  },
  {
    q: "Chi vede la mia tariffa?",
    a: "Le aziende registrate, quando il tuo profilo compare nel loro swipe. Allo stesso modo, ogni offerta mostra ai professionisti la sua fascia di budget. La trasparenza vale in entrambe le direzioni.",
  },
  {
    q: "Cosa succede dopo il match?",
    a: "Entrambi ricevete una email. L'azienda propone fino a 3 orari, il professionista ne sceglie uno e l'invito con il link Google Meet (o Zoom, Teams…) arriva nel calendario di tutti e due, con un promemoria prima dell'incontro.",
  },
  {
    q: "Come funzionano le recensioni?",
    a: "Si sbloccano dopo la call. Professionista e azienda si valutano a vicenda con un voto da 1 a 5 stelle e un commento facoltativo. La media resta visibile sul profilo.",
  },
  {
    q: "Come vengono verificate le aziende?",
    a: "Per registrarsi un'azienda deve indicare la Partita IVA e dichiarare che i dati forniti sono veritieri. Ogni offerta deve poi indicare una fascia di budget, senza eccezioni.",
  },
  {
    q: "Cosa sono gli Smart Interview?",
    a: "Sessioni organizzate dalle aziende in cui più professionisti prenotano un posto per conoscere il team con call brevi. Sono pensate per farsi notare anche prima di un match.",
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
