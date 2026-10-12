import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import * as styles from './styles';

interface AlreadyRegisteredEmailProps {
  // Absent when the app URL is not configured: the email then points to the login page in words.
  loginUrl?: string;
}

// Sent instead of a verification code when someone signs up with an email that already has a
// verified account: the owner learns about it, the person filling the form learns nothing.
export const AlreadyRegisteredEmail = ({ loginUrl }: AlreadyRegisteredEmailProps) => (
  <Html>
    <Head />
    <Preview>Hai già un account Skillr</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>Hai già un account Skillr</Heading>
        </Section>
        <Section style={styles.content}>
          <Text style={styles.text}>
            Qualcuno ha provato a registrarsi su Skillr con questo indirizzo email, ma esiste già un account. Se eri tu,{' '}
            {loginUrl ? (
              <Link href={loginUrl} style={{ color: '#10b981', fontWeight: 700 }}>
                accedi qui
              </Link>
            ) : (
              'accedi dalla pagina di login'
            )}
            : se non ricordi la password puoi usare il Magic Link.
          </Text>
          <Text style={{ ...styles.text, color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
            Se non sei stato tu, ignora questa email: il tuo account non è stato modificato.
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

export default AlreadyRegisteredEmail;
