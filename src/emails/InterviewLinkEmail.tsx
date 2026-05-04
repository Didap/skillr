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

interface InterviewLinkEmailProps {
  userName: string;
  eventTitle: string;
  companyName: string;
  meetingLink: string;
  eventDate: string;
}

export const InterviewLinkEmail = ({
  userName,
  eventTitle,
  companyName,
  meetingLink,
  eventDate,
}: InterviewLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Link per la tua Smart Interview: {eventTitle}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>Link del Meeting Disponibile</Heading>
        </Section>
        <Section style={styles.content}>
          <Text style={styles.text}>Ciao {userName},</Text>
          <Text style={styles.text}>
            Il link per partecipare alla tua **Smart Interview** con **{companyName}** è ora disponibile.
          </Text>
          <Section style={styles.card}>
             <Text style={styles.matchedNameText}>{eventTitle}</Text>
             <Text style={styles.roleText}>📅 {eventDate}</Text>
          </Section>
          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={meetingLink}>
              Partecipa al Meeting
            </Button>
          </Section>
          <Text style={styles.text}>
            Se il pulsante sopra non funziona, puoi copiare e incollare questo link nel tuo browser:
            <br />
            <span style={{ color: '#10b981', fontSize: '12px', wordBreak: 'break-all' }}>{meetingLink}</span>
          </Text>
        </Section>
        <Hr style={styles.hr} />
        <Section style={styles.footer}>
          <Text style={styles.footerText}>Skillr - The next-gen job matching platform</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default InterviewLinkEmail;
