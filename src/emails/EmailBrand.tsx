import { Img, Section, Text } from '@react-email/components';
import * as React from 'react';
import { appUrl } from '@/lib/app-url';
import * as styles from './styles';

export const EMAIL_TAGLINE = 'Helllo — il lavoro parte da un ciao.';

// Absolute URL of the rosso wordmark (498×162 PNG), built from the same base URL as the
// links in emails. If images are blocked, the alt text shows the name instead.
export const emailLogoUrl = () => appUrl('/brand/logo-rosso.png');

export const EmailLogo = () => (
  <Img src={emailLogoUrl()} width="108" height="40" alt="Helllo" style={styles.logo} />
);

export const EmailFooter = ({ children = EMAIL_TAGLINE }: { children?: React.ReactNode }) => (
  <Section style={styles.footer}>
    <Text style={styles.footerText}>{children}</Text>
  </Section>
);
