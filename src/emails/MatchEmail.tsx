import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';
import * as styles from './styles';

interface MatchEmailProps {
  userName: string;
  matchedName: string;
  matchedImage?: string;
  role: 'professional' | 'company';
  matchUrl: string;
}

export const MatchEmail = ({
  userName,
  matchedName,
  matchedImage,
  role,
  matchUrl,
}: MatchEmailProps) => (
  <Html>
    <Head />
    <Preview>It&apos;s a Match! You matched with {matchedName} on Skillr</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>It&apos;s a Match!</Heading>
        </Section>
        <Section style={styles.content}>
          <Text style={styles.text}>Hi {userName},</Text>
          <Text style={styles.text}>
            Great news! You have a new match on Skillr. Both you and {matchedName} have swiped right.
          </Text>
          <Section style={styles.card}>
             {matchedImage && (
               <Img
                 src={matchedImage}
                 width="80"
                 height="80"
                 alt={matchedName}
                 style={styles.avatar}
               />
             )}
             <Text style={styles.matchedNameText}>{matchedName}</Text>
             <Text style={styles.roleText}>
               {role === 'professional' ? 'Company' : 'Professional'}
             </Text>
          </Section>
          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={matchUrl}>
              View Match & Start Chat
            </Button>
          </Section>
        </Section>
        <Hr style={styles.hr} />
        <Section style={styles.footer}>
          <Text style={styles.footerText}>Skillr - The next-gen job matching platform</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default MatchEmail;
