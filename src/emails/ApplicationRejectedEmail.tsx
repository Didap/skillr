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
        <Section style={styles.content}>
          <Text style={styles.text}>Ciao{firstName ? ` ${firstName}` : ''},</Text>
          <Text style={styles.text}>
            {companyName} ha deciso di non proseguire con la tua candidatura per <strong>{jobTitle}</strong>.
          </Text>
          <Text style={styles.text}>
            Ci sono altre ricerche in linea con il tuo profilo:{' '}
            <Link href={dashboardUrl} style={{ color: '#059669', fontWeight: 600 }}>
              continua a cercare su Helllo
            </Link>
            .
          </Text>
          <Text style={styles.text}>Il team Helllo</Text>
        </Section>
        <Hr style={styles.hr} />
        <Section style={styles.footer}>
          <Text style={styles.footerText}>Helllo - The next-gen job matching platform</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ApplicationRejectedEmail;
