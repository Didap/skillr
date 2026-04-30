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
} from '@react-email/components';
import * as React from 'react';
import * as styles from './styles';

interface PaLeadNotificationEmailProps {
  fullName: string;
  email: string;
  phone?: string;
  organization: string;
  entityType: string;
  role: string;
  service: string;
  deadline?: string;
  notes?: string;
}

const paStyles = {
  ...styles,
  h1: {
    ...styles.h1,
    color: '#004c81', // PA Blue
  },
  label: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '12px 0 4px',
  },
  value: {
    color: '#0f172a',
    fontSize: '16px',
    margin: '0 0 12px',
  }
};

export const PaLeadNotificationEmail = ({
  fullName,
  email,
  phone,
  organization,
  entityType,
  role,
  service,
  deadline,
  notes,
}: PaLeadNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Nuovo Lead PA da {organization}</Preview>
    <Body style={paStyles.main}>
      <Container style={paStyles.container}>
        <Section style={paStyles.header}>
          <Heading style={paStyles.h1}>Nuovo Lead Istituzionale</Heading>
        </Section>
        <Section style={paStyles.content}>
          <Text style={paStyles.text}>
            È stata ricevuta una nuova richiesta di contatto dalla landing page Skillr per la PA.
          </Text>
          
          <Section style={paStyles.card}>
            <div style={{ textAlign: 'left' }}>
              <Text style={paStyles.label}>Ente / Organizzazione</Text>
              <Text style={paStyles.value}>{organization} ({entityType})</Text>
              
              <Text style={paStyles.label}>Referente</Text>
              <Text style={paStyles.value}>{fullName} — {role}</Text>
              
              <Text style={paStyles.label}>Contatti</Text>
              <Text style={paStyles.value}>{email} {phone ? `— ${phone}` : ''}</Text>
              
              <Text style={paStyles.label}>Servizio Richiesto</Text>
              <Text style={paStyles.value}>{service}</Text>
              
              {deadline && (
                <>
                  <Text style={paStyles.label}>Scadenza Bando</Text>
                  <Text style={paStyles.value}>{deadline}</Text>
                </>
              )}
              
              {notes && (
                <>
                  <Text style={paStyles.label}>Note</Text>
                  <Text style={paStyles.value}>{notes}</Text>
                </>
              )}
            </div>
          </Section>
        </Section>
        <Hr style={paStyles.hr} />
        <Section style={paStyles.footer}>
          <Text style={paStyles.footerText}>Skillr PA Support Team — Notifica Interna</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PaLeadNotificationEmail;
