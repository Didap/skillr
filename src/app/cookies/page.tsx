import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Cookie Policy | Skillr",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="4 Maggio 2026">
      <section>
        <h2>Cosa sono i Cookie?</h2>
        <p>
          I cookie sono piccoli file di testo che vengono salvati sul tuo dispositivo quando visiti un sito web. Ci aiutano a far funzionare correttamente la piattaforma e a migliorare la tua esperienza d&apos;uso.
        </p>
      </section>

      <section>
        <h2>Tipologie di Cookie che utilizziamo</h2>
        
        <h3>1. Cookie Tecnici (Necessari)</h3>
        <p>
          Questi cookie sono indispensabili per il corretto funzionamento della piattaforma. Includono:
        </p>
        <ul>
          <li><strong>Autenticazione:</strong> Utilizzati da NextAuth per mantenerti collegato durante la sessione.</li>
          <li><strong>Sicurezza:</strong> Protezione contro attacchi CSRF e bot.</li>
          <li><strong>Preferenze:</strong> Salvataggio di impostazioni base dell&apos;interfaccia.</li>
        </ul>

        <h3>2. Cookie di Terze Parti</h3>
        <p>
          Alcuni servizi integrati potrebbero rilasciare cookie propri:
        </p>
        <ul>
          <li><strong>Google:</strong> Utilizzati per l&apos;integrazione con Google Calendar e le mappe (se presenti).</li>
          <li><strong>Cloudinary:</strong> Per l&apos;ottimizzazione e la visualizzazione delle immagini di profilo.</li>
          <li><strong>Pusher:</strong> Per gestire le notifiche in tempo reale all&apos;interno della dashboard.</li>
        </ul>
      </section>

      <section>
        <h2>Come gestire i Cookie</h2>
        <p>
          Puoi controllare o eliminare i cookie tramite le impostazioni del tuo browser. Tieni presente che disabilitando i cookie tecnici alcune funzionalità di Skillr (come l&apos;accesso al profilo) potrebbero non essere disponibili.
        </p>
      </section>

      <section>
        <h2>Modifiche alla Policy</h2>
        <p>
          Potremmo aggiornare questa Cookie Policy per riflettere modifiche ai nostri servizi o per obblighi normativi. Ti invitiamo a consultarla regolarmente.
        </p>
      </section>
    </LegalPage>
  );
}
