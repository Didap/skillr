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
import { EmailFooter, EmailLogo } from './EmailBrand';

interface PaNewsletterVerificationEmailProps {
  verificationLink: string;
}

const paStyles = styles;

export const PaNewsletterVerificationEmail = ({
  verificationLink,
}: PaNewsletterVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Conferma la tua iscrizione alla Newsletter Helllo PA</Preview>
    <Body style={paStyles.main}>
      <Container style={paStyles.container}>
        <Section style={paStyles.header}>
          <EmailLogo />
          <Heading style={paStyles.h1}>Conferma iscrizione</Heading>
        </Section>
        <Section style={paStyles.content}>
          <Text style={paStyles.text}>Gentile utente,</Text>
          <Text style={paStyles.text}>
            La ringraziamo per l&apos;interesse verso la nostra newsletter quindicinale focalizzata sui bandi NEET, politiche attive e opportunità per la PA in Puglia.
          </Text>
          <Text style={paStyles.text}>
            Per completare l&apos;attivazione del servizio e iniziare a ricevere i nostri approfondimenti, La preghiamo di confermare il Suo indirizzo email cliccando il pulsante sottostante:
          </Text>
          <Section style={paStyles.buttonContainer}>
            <Button style={paStyles.button} href={verificationLink}>
              Conferma iscrizione
            </Button>
          </Section>
          <Text style={paStyles.text}>
            Se il pulsante non dovesse funzionare, può copiare e incollare il seguente link nel browser:
          </Text>
          <Text style={{ ...paStyles.text, ...paStyles.rawLink }}>
            {verificationLink}
          </Text>
          <Text style={paStyles.text}>
            Se non ha richiesto l&apos;iscrizione, può ignorare questa email.
          </Text>
          <Text style={paStyles.text}>
            A presto,<br />
            Il team Helllo PA
          </Text>
        </Section>
        <Hr style={paStyles.hr} />
        <EmailFooter>
          Helllo per la PA — tecnologia per l&apos;impiego pubblico in Puglia.
        </EmailFooter>
      </Container>
    </Body>
  </Html>
);

export default PaNewsletterVerificationEmail;
