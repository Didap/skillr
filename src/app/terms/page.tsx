import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Termini di Servizio | Helllo",
};

export default function TermsPage() {
  return (
    <LegalPage title="Termini di Servizio" lastUpdated="4 Maggio 2026">
      <section>
        <h2>1. Accettazione dei Termini</h2>
        <p>
          L&apos;accesso e l&apos;utilizzo di Helllo sono soggetti ai seguenti Termini di Servizio. Registrandoti o utilizzando la piattaforma, accetti di essere vincolato da questi termini.
        </p>
      </section>

      <section>
        <h2>2. Descrizione del Servizio</h2>
        <p>
          Helllo è una piattaforma di matching professionale basata sul modello &quot;doppio opt-in&quot;. Il servizio permette a professionisti e aziende di incontrarsi tramite uno swipe reciproco, scriversi in chat dopo il match e fissare call conoscitive.
        </p>
      </section>

      <section>
        <h2>3. Obblighi dell&apos;Utente</h2>
        <p>Utilizzando Helllo, ti impegni a:</p>
        <ul>
          <li>Fornire informazioni veritiere e aggiornate nel tuo profilo.</li>
          <li>Utilizzare la piattaforma in modo professionale e rispettoso.</li>
          <li>Non creare account multipli o falsi (bot).</li>
          <li>Rispettare gli appuntamenti (call) fissati tramite il sistema.</li>
          <li>Usare la chat solo per scopi professionali legati al match: niente spam, molestie, contenuti offensivi o richieste di denaro.</li>
          <li>Non condividere in chat dati personali di terzi senza il loro consenso.</li>
        </ul>
        <p>
          Ogni utente può bloccare una conversazione o segnalarla. In caso di segnalazione il team di Helllo può leggere gli ultimi messaggi della conversazione segnalata e sospendere gli account che violano questi termini.
        </p>
      </section>

      <section>
        <h2>4. Trasparenza e Tariffe</h2>
        <p>
          Helllo promuove la trasparenza radicale. Le aziende si impegnano a indicare budget reali e i professionisti a indicare le proprie tariffe o RAL desiderate. È vietato inserire dati fuorvianti al solo scopo di attirare l&apos;attenzione.
        </p>
      </section>

      <section>
        <h2>5. Responsabilità</h2>
        <p>
          Helllo agisce esclusivamente come intermediario tecnologico per facilitare l&apos;incontro tra le parti. Non siamo responsabili per l&apos;esito dei colloqui, per la qualità del lavoro svolto o per eventuali controversie tra utenti.
        </p>
      </section>

      <section>
        <h2>6. Risoluzione del Contratto</h2>
        <p>
          Ci riserviamo il diritto di sospendere o chiudere il tuo account in caso di violazione di questi termini, comportamento scorretto o segnalazioni verificate da parte di altri utenti.
        </p>
      </section>

      <section>
        <h2>7. Modifiche ai Termini</h2>
        <p>
          Potremmo aggiornare questi termini periodicamente. L&apos;utilizzo continuativo della piattaforma dopo la pubblicazione delle modifiche costituirà accettazione dei nuovi termini.
        </p>
      </section>
    </LegalPage>
  );
}
