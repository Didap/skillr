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

interface PaLeadConfirmationEmailProps {
  fullName: string;
  organization: string;
}

const paStyles = {
  ...styles,
  h1: {
    ...styles.h1,
    color: '#004c81', // PA Blue
  }
};

export const PaLeadConfirmationEmail = ({
  fullName,
  organization,
}: PaLeadConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Grazie per aver contattato Skillr per la PA</Preview>
    <Body style={paStyles.main}>
      <Container style={paStyles.container}>
        <Section style={paStyles.header}>
          <Heading style={paStyles.h1}>Richiesta Ricevuta</Heading>
        </Section>
        <Section style={paStyles.content}>
          <Text style={paStyles.text}>Gentile {fullName},</Text>
          <Text style={paStyles.text}>
            La ringraziamo per aver manifestato interesse verso le soluzioni Skillr dedicate alla Pubblica Amministrazione per conto di <strong>{organization}</strong>.
          </Text>
          <Text style={paStyles.text}>
            Un nostro esperto in politiche attive del lavoro e bandi FSE+/PNRR esaminerà la Sua richiesta e La ricontatterà entro le prossime 24 ore lavorative per approfondire le necessità del Suo ente.
          </Text>
          <Section style={paStyles.card}>
            <Text style={{ ...paStyles.text, fontStyle: 'italic', margin: 0 }}>
              &quot;Tecnologia e dati al servizio dell&apos;impiego pubblico.&quot;
            </Text>
          </Section>
          <Text style={paStyles.text}>
            A presto,<br />
            Il team Skillr PA
          </Text>
        </Section>
        <Hr style={paStyles.hr} />
        <Section style={paStyles.footer}>
          <Text style={paStyles.footerText}>
            Questa è una conferma automatica. Per assistenza immediata scriva a pa@skillr.it
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PaLeadConfirmationEmail;
