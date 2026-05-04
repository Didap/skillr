import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Termini di Servizio | Skillr",
};

export default function TermsPage() {
  return (
    <LegalPage title="Termini di Servizio" lastUpdated="4 Maggio 2026">
      <section>
        <h2>1. Accettazione dei Termini</h2>
        <p>
          L&apos;accesso e l&apos;utilizzo di Skillr sono soggetti ai seguenti Termini di Servizio. Registrandoti o utilizzando la piattaforma, accetti di essere vincolato da questi termini.
        </p>
      </section>

      <section>
        <h2>2. Descrizione del Servizio</h2>
        <p>
          Skillr è una piattaforma di matching professionale basata sul modello &quot;doppio opt-in&quot; e &quot;zero chat&quot;. Il servizio permette a professionisti e aziende di incontrarsi tramite uno swipe reciproco e di fissare direttamente call conoscitive.
        </p>
      </section>

      <section>
        <h2>3. Obblighi dell&apos;Utente</h2>
        <p>Utilizzando Skillr, ti impegni a:</p>
        <ul>
          <li>Fornire informazioni veritiere e aggiornate nel tuo profilo.</li>
          <li>Utilizzare la piattaforma in modo professionale e rispettoso.</li>
          <li>Non creare account multipli o falsi (bot).</li>
          <li>Rispettare gli appuntamenti (call) fissati tramite il sistema.</li>
        </ul>
      </section>

      <section>
        <h2>4. Trasparenza e Tariffe</h2>
        <p>
          Skillr promuove la trasparenza radicale. Le aziende si impegnano a indicare budget reali e i professionisti a indicare le proprie tariffe o RAL desiderate. È vietato inserire dati fuorvianti al solo scopo di attirare l&apos;attenzione.
        </p>
      </section>

      <section>
        <h2>5. Responsabilità</h2>
        <p>
          Skillr agisce esclusivamente come intermediario tecnologico per facilitare l&apos;incontro tra le parti. Non siamo responsabili per l&apos;esito dei colloqui, per la qualità del lavoro svolto o per eventuali controversie tra utenti.
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
