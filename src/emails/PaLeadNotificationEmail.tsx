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
import { EmailFooter, EmailLogo } from './EmailBrand';

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
  label: {
    color: styles.colors.violaSoft,
    fontSize: '13px',
    fontWeight: '600',
    margin: '12px 0 4px',
  },
  value: {
    color: styles.colors.viola,
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
          <EmailLogo />
          <Heading style={paStyles.h1}>Nuovo lead istituzionale</Heading>
        </Section>
        <Section style={paStyles.content}>
          <Text style={paStyles.text}>
            È stata ricevuta una nuova richiesta di contatto dalla landing page Helllo per la PA.
          </Text>
          
          <Section style={paStyles.card}>
            <div style={{ textAlign: 'left' }}>
              <Text style={paStyles.label}>Ente / organizzazione</Text>
              <Text style={paStyles.value}>{organization} ({entityType})</Text>
              
              <Text style={paStyles.label}>Referente</Text>
              <Text style={paStyles.value}>{fullName} — {role}</Text>
              
              <Text style={paStyles.label}>Contatti</Text>
              <Text style={paStyles.value}>{email} {phone ? `— ${phone}` : ''}</Text>
              
              <Text style={paStyles.label}>Servizio richiesto</Text>
              <Text style={paStyles.value}>{service}</Text>
              
              {deadline && (
                <>
                  <Text style={paStyles.label}>Scadenza bando</Text>
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
        <EmailFooter>Helllo per la PA — notifica interna</EmailFooter>
      </Container>
    </Body>
  </Html>
);

export default PaLeadNotificationEmail;
