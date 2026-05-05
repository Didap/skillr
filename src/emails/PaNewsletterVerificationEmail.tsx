import {
  Body,
  Button,
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

interface PaNewsletterVerificationEmailProps {
  verificationLink: string;
}

const paStyles = {
  ...styles,
  h1: {
    ...styles.h1,
    color: '#004c81', // PA Blue
  },
  button: {
    backgroundColor: '#004c81',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '100%',
    padding: '12px',
    marginTop: '25px',
    marginBottom: '25px',
  }
};

export const PaNewsletterVerificationEmail = ({
  verificationLink,
}: PaNewsletterVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Conferma la tua iscrizione alla Newsletter Skillr PA</Preview>
    <Body style={paStyles.main}>
      <Container style={paStyles.container}>
        <Section style={paStyles.header}>
          <Heading style={paStyles.h1}>Conferma Iscrizione</Heading>
        </Section>
        <Section style={paStyles.content}>
          <Text style={paStyles.text}>Gentile utente,</Text>
          <Text style={paStyles.text}>
            La ringraziamo per l&apos;interesse verso la nostra newsletter quindicinale focalizzata sui bandi NEET, politiche attive e opportunità per la PA in Puglia.
          </Text>
          <Text style={paStyles.text}>
            Per completare l&apos;attivazione del servizio e iniziare a ricevere i nostri approfondimenti, La preghiamo di confermare il Suo indirizzo email cliccando il pulsante sottostante:
          </Text>
          <Button style={paStyles.button} href={verificationLink}>
            Conferma Iscrizione
          </Button>
          <Text style={paStyles.text}>
            Se il pulsante non dovesse funzionare, può copiare e incollare il seguente link nel browser:
          </Text>
          <Text style={{ ...paStyles.text, fontSize: '12px', color: '#666' }}>
            {verificationLink}
          </Text>
          <Text style={paStyles.text}>
            Se non ha richiesto l&apos;iscrizione, può ignorare questa email.
          </Text>
          <Text style={paStyles.text}>
            A presto,<br />
            Il team Skillr PA
          </Text>
        </Section>
        <Hr style={paStyles.hr} />
        <Section style={paStyles.footer}>
          <Text style={paStyles.footerText}>
            Skillr PA - Tecnologia per l&apos;impiego pubblico in Puglia.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PaNewsletterVerificationEmail;
