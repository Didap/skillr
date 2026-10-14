import { Plus } from "lucide-react";

const QUESTIONS = [
  {
    q: "Quanto costa Helllo?",
    a: "Niente. Il profilo è gratis per tutti.",
  },
  {
    q: "Perché non c'è una chat?",
    a: "Perché skill, tariffa e budget sono già sulla card. Il resto si chiarisce in 30 minuti di call.",
  },
  {
    q: "Chi vede la mia tariffa?",
    a: "Le aziende iscritte. In cambio, tu vedi il budget di ogni offerta.",
  },
  {
    q: "Cosa succede dopo il match?",
    a: "L'azienda propone fino a 3 orari, tu ne scegli uno. Invito, link e promemoria arrivano da soli.",
  },
  {
    q: "Come funzionano le recensioni?",
    a: "Dopo l'orario della call vi valutate a vicenda, da 1 a 5 stelle. La media va sul profilo.",
  },
  {
    q: "Come capisco se un'azienda è seria?",
    a: "Partita IVA obbligatoria, budget obbligatorio e le recensioni di chi ci ha già parlato.",
  },
  {
    q: "Cosa sono gli Smart Interview?",
    a: "Sessioni aperte dalle aziende: prenoti un posto e conosci il team con call brevi, anche senza match.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-20 md:py-32 bg-white scroll-mt-20">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="font-display text-5xl md:text-7xl text-viola-950 leading-tight mb-16 text-center">
          Domande <span className="italic text-rosso-600">frequenti.</span>
        </h2>

        <div className="divide-y divide-viola-100 border-y border-viola-100">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group py-2">
              <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-lg md:text-xl font-bold text-viola-950 tracking-tight">{q}</span>
                <span className="shrink-0 w-10 h-10 rounded-full border-2 border-viola-200 flex items-center justify-center text-viola-500 transition-all group-open:rotate-45 group-open:border-rosso-600 group-open:text-rosso-600">
                  <Plus size={18} />
                </span>
              </summary>
              <p className="pb-6 pr-4 md:pr-16 text-viola-500 font-medium leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
