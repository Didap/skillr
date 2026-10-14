import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import * as styles from './styles';
import { EmailFooter, EmailLogo } from './EmailBrand';

interface ApplicationRejectedEmailProps {
  firstName?: string;
  companyName: string;
  jobTitle: string;
  dashboardUrl: string;
}

// Sent to the professional when a company turns down their application to a job.
export const ApplicationRejectedEmail = ({
  firstName,
  companyName,
  jobTitle,
  dashboardUrl,
}: ApplicationRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>{`Aggiornamento sulla candidatura: ${jobTitle}`}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <EmailLogo />
        </Section>
        <Section style={styles.content}>
          <Text style={styles.text}>Ciao{firstName ? ` ${firstName}` : ''},</Text>
          <Text style={styles.text}>
            {companyName} ha deciso di non proseguire con la tua candidatura per <strong>{jobTitle}</strong>.
          </Text>
          <Text style={styles.text}>
            Ci sono altre ricerche in linea con il tuo profilo:{' '}
            <Link href={dashboardUrl} style={styles.link}>
              continua a cercare su Helllo
            </Link>
            .
          </Text>
          <Text style={styles.text}>Il team Helllo</Text>
        </Section>
        <Hr style={styles.hr} />
        <EmailFooter />
      </Container>
    </Body>
  </Html>
);

export default ApplicationRejectedEmail;
