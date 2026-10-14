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

interface ConfirmationEmailProps {
  userName: string;
  otherPartyName: string;
  startTime: string;
  meetingLink?: string;
}

export const ConfirmationEmail = ({
  userName,
  otherPartyName,
  startTime,
  meetingLink,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Meeting Confirmed: Interview with {otherPartyName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <EmailLogo />
          <Heading style={styles.h1}>Meeting Confirmed</Heading>
        </Section>
        <Section style={styles.content}>
          <Text style={styles.text}>Hi {userName},</Text>
          <Text style={styles.text}>
            Your meeting with <strong>{otherPartyName}</strong> has been confirmed.
          </Text>
          <Section style={styles.card}>
             <Text style={styles.matchedNameText}>{startTime}</Text>
             <Text style={styles.roleText}>Scheduled Time</Text>
          </Section>
          {meetingLink && (
            <Text style={styles.text}>
              <strong>Meeting Link:</strong> <a href={meetingLink} style={styles.rawLink}>{meetingLink}</a>
            </Text>
          )}
          <Text style={styles.text}>
            We&apos;ve attached a calendar invite (.ics) to this email for your convenience.
          </Text>
        </Section>
        <Hr style={styles.hr} />
        <EmailFooter />
      </Container>
    </Body>
  </Html>
);

export default ConfirmationEmail;
