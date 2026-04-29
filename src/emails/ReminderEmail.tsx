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
  Button,
} from '@react-email/components';
import * as React from 'react';
import * as styles from './styles';

interface ReminderEmailProps {
  userName: string;
  otherPartyName: string;
  startTime: string;
  meetingLink?: string;
}

export const ReminderEmail = ({
  userName,
  otherPartyName,
  startTime,
  meetingLink,
}: ReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Reminder: Meeting with {otherPartyName} in 1 hour</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>Meeting Reminder</Heading>
        </Section>
        <Section style={styles.content}>
          <Text style={styles.text}>Hi {userName},</Text>
          <Text style={styles.text}>
            This is a friendly reminder that you have a meeting with <strong>{otherPartyName}</strong> in about 1 hour.
          </Text>
          <Section style={styles.card}>
             <Text style={styles.matchedNameText}>{startTime}</Text>
             <Text style={styles.roleText}>Scheduled Time</Text>
          </Section>
          {meetingLink && (
            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={meetingLink}>
                Join Meeting
              </Button>
            </Section>
          )}
        </Section>
        <Hr style={styles.hr} />
        <Section style={styles.footer}>
          <Text style={styles.footerText}>Skillr - The next-gen job matching platform</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ReminderEmail;
