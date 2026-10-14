import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';
import * as styles from './styles';

interface InterviewEventChangeEmailProps {
  kind: 'updated' | 'cancelled';
  userName: string;
  eventTitle: string;
  companyName: string;
  eventDate: string;
  location?: string | null;
  meetingLink?: string | null;
  // Human-readable list of what changed, only for 'updated'
  changes?: string[];
  eventUrl?: string;
}

// Sent to booked professionals when the company changes the logistics of a Smart Interview
// (date, place, meeting link) or deletes it.
export const InterviewEventChangeEmail = ({
  kind,
  userName,
  eventTitle,
  companyName,
  eventDate,
  location,
  meetingLink,
  changes = [],
  eventUrl,
}: InterviewEventChangeEmailProps) => {
  const cancelled = kind === 'cancelled';

  return (
    <Html>
      <Head />
      <Preview>
        {cancelled ? `Smart Interview annullata: ${eventTitle}` : `Smart Interview aggiornata: ${eventTitle}`}
      </Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.h1}>{cancelled ? 'Evento annullato' : 'Evento aggiornato'}</Heading>
          </Section>
          <Section style={styles.content}>
            <Text style={styles.text}>Ciao {userName},</Text>
            <Text style={styles.text}>
              {cancelled
                ? `${companyName} ha annullato la Smart Interview a cui eri iscritto. La tua prenotazione non è più valida.`
                : `${companyName} ha modificato la Smart Interview a cui sei iscritto. Ecco i dettagli aggiornati.`}
            </Text>
            <Section style={styles.card}>
              <Text style={styles.matchedNameText}>{eventTitle}</Text>
              <Text style={styles.roleText}>{eventDate}</Text>
              {!cancelled && location && <Text style={styles.roleText}>{location}</Text>}
            </Section>
            {!cancelled && changes.length > 0 && (
              <Text style={styles.text}>Cosa è cambiato: {changes.join(', ')}.</Text>
            )}
            {!cancelled && meetingLink && (
              <Text style={styles.text}>
                Link del meeting:
                <br />
                <span style={{ color: '#10b981', fontSize: '12px', wordBreak: 'break-all' }}>{meetingLink}</span>
              </Text>
            )}
            {!cancelled && eventUrl && (
              <Section style={styles.buttonContainer}>
                <Button style={styles.button} href={eventUrl}>
                  Vedi l&apos;evento
                </Button>
              </Section>
            )}
            {cancelled && (
              <Text style={styles.text}>Puoi trovare altre Smart Interview in programma su Helllo.</Text>
            )}
          </Section>
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>Helllo - The next-gen job matching platform</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InterviewEventChangeEmail;
