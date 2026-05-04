import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy | Skillr",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="4 Maggio 2026">
      <section>
        <h2>1. Introduzione</h2>
        <p>
          Benvenuto su Skillr. La tua privacy è di fondamentale importanza per noi. Questa Informativa sulla Privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo le tue informazioni quando utilizzi la nostra piattaforma.
        </p>
        <p>
          Utilizzando Skillr, accetti le pratiche descritte in questa informativa. Se non sei d&apos;accordo con i termini qui esposti, ti preghiamo di non accedere alla piattaforma.
        </p>
      </section>

      <section>
        <h2>2. Informazioni che Raccogliamo</h2>
        <h3>Dati forniti dall&apos;utente</h3>
        <ul>
          <li><strong>Dati di Registrazione:</strong> Nome, cognome, indirizzo email e password (criptata).</li>
          <li><strong>Dati del Profilo Professionale:</strong> Titolo professionale, competenze, tariffe/RAL, bio e fotografia (caricata tramite Cloudinary).</li>
          <li><strong>Dati Aziendali:</strong> Nome azienda, Partita IVA (verificata tramite API), sede e logo.</li>
        </ul>
        
        <h3>Dati raccolti automaticamente</h3>
        <p>
          Raccogliamo informazioni tecniche sul tuo dispositivo e sulla tua modalità di utilizzo della piattaforma, inclusi indirizzo IP, tipo di browser e pagine visitate.
        </p>
      </section>

      <section>
        <h2>3. Come Utilizziamo i Tuoi Dati</h2>
        <p>Utilizziamo le informazioni raccolte per:</p>
        <ul>
          <li>Fornire e gestire il servizio di matching professionale.</li>
          <li>Permettere la creazione e la visualizzazione dei profili.</li>
          <li>Inviare notifiche transazionali relative a match e interviste (tramite Resend).</li>
          <li>Gestire la prenotazione di call tramite integrazione con Google Calendar.</li>
          <li>Garantire la sicurezza della piattaforma e prevenire frodi.</li>
        </ul>
      </section>

      <section>
        <h2>4. Condivisione dei Dati</h2>
        <p>
          I tuoi dati vengono condivisi solo nei casi necessari alla fornitura del servizio:
        </p>
        <ul>
          <li><strong>Tra Utenti:</strong> I dettagli del profilo sono visibili agli altri utenti durante il processo di matching (swipe).</li>
          <li><strong>Fornitori di Servizi:</strong> Cloudinary (immagini), Resend (email), Google (Calendar API), Pusher (notifiche real-time).</li>
          <li><strong>Obblighi di Legge:</strong> Quando richiesto dalle autorità competenti.</li>
        </ul>
      </section>

      <section>
        <h2>5. Sicurezza e Conservazione</h2>
        <p>
          Adottiamo misure di sicurezza tecniche e organizzative per proteggere i tuoi dati. I dati vengono conservati per il tempo strettamente necessario a fornire il servizio o fino a quando non ne richiedi la cancellazione.
        </p>
      </section>

      <section>
        <h2>6. I Tuoi Diritti</h2>
        <p>
          Ai sensi del GDPR, hai il diritto di accedere, rettificare, cancellare o limitare il trattamento dei tuoi dati. Puoi esercitare questi diritti contattandoci all&apos;indirizzo email dedicato.
        </p>
      </section>
    </LegalPage>
  );
}
