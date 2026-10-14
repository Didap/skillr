import { Plus } from "lucide-react";

const QUESTIONS = [
  {
    q: "Quanto costa Helllo?",
    a: "Niente. Il profilo è gratis per tutti.",
  },
  {
    q: "Posso scrivere a un'azienda?",
    a: "Sì, dopo il match. La chat si apre solo quando vi siete scelti a vicenda: niente messaggi a freddo.",
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
    <section id="faq" className="py-20 md:py-32 bg-blu scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h2 className="font-display text-display md:text-6xl md:leading-[1.05] tracking-[-0.03em] text-white mb-10 md:mb-14 text-center">
          Domande <span className="font-script text-rosa">frequenti.</span>
        </h2>

        <div className="space-y-3">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group rounded-card bg-white px-5 sm:px-7 text-viola">
              <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none rounded-card [&::-webkit-details-marker]:hidden">
                <span className="text-lg md:text-xl font-bold tracking-tight">{q}</span>
                <span className="shrink-0 size-10 rounded-full border border-viola flex items-center justify-center transition-[rotate,background-color] group-open:rotate-45 group-open:bg-rosa motion-reduce:transition-none">
                  <Plus size={18} strokeWidth={1.75} />
                </span>
              </summary>
              <p className="pb-6 pr-2 md:pr-14 font-prompt text-lg md:text-xl leading-7 font-medium">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
