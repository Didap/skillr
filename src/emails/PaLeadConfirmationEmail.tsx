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

interface PaLeadConfirmationEmailProps {
  fullName: string;
  organization: string;
}

const paStyles = styles;

export const PaLeadConfirmationEmail = ({
  fullName,
  organization,
}: PaLeadConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Grazie per aver contattato Helllo per la PA</Preview>
    <Body style={paStyles.main}>
      <Container style={paStyles.container}>
        <Section style={paStyles.header}>
          <EmailLogo />
          <Heading style={paStyles.h1}>Richiesta ricevuta</Heading>
        </Section>
        <Section style={paStyles.content}>
          <Text style={paStyles.text}>Gentile {fullName},</Text>
          <Text style={paStyles.text}>
            La ringraziamo per aver manifestato interesse verso le soluzioni Helllo dedicate alla Pubblica Amministrazione per conto di <strong>{organization}</strong>.
          </Text>
          <Text style={paStyles.text}>
            Un nostro esperto in politiche attive del lavoro e bandi FSE+/PNRR esaminerà la Sua richiesta e La ricontatterà entro le prossime 24 ore lavorative per approfondire le necessità del Suo ente.
          </Text>
          <Section style={paStyles.card}>
            <Text style={{ ...paStyles.text, fontWeight: '500', margin: 0 }}>
              &quot;Tecnologia e dati al servizio dell&apos;impiego pubblico.&quot;
            </Text>
          </Section>
          <Text style={paStyles.text}>
            A presto,<br />
            Il team Helllo PA
          </Text>
        </Section>
        <Hr style={paStyles.hr} />
        <EmailFooter>
          Questa è una conferma automatica. Per assistenza immediata scriva a pa@skillr.it
        </EmailFooter>
      </Container>
    </Body>
  </Html>
);

export default PaLeadConfirmationEmail;
