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

interface BookingEmailProps {
  userName: string;
  companyName: string;
  companyLogo?: string;
  bookingUrl: string;
}

export const BookingEmail = ({
  userName,
  companyName,
  companyLogo,
  bookingUrl,
}: BookingEmailProps) => (
  <Html>
    <Head />
    <Preview>{companyName} wants to schedule an interview with you</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.h1}>Interview Proposed</Heading>
        </Section>
        <Section style={styles.content}>
          <Text style={styles.text}>Hi {userName},</Text>
          <Text style={styles.text}>
            {companyName} is interested in your profile and has proposed some time slots for an interview.
          </Text>
          <Section style={styles.card}>
             {companyLogo && (
               <Img
                 src={companyLogo}
                 width="80"
                 height="80"
                 alt={companyName}
                 style={styles.avatar}
               />
             )}
             <Text style={styles.matchedNameText}>{companyName}</Text>
             <Text style={styles.roleText}>Company</Text>
          </Section>
          <Text style={styles.text}>
            Please review the proposed slots and confirm the one that works best for you.
          </Text>
          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={bookingUrl}>
              View Slots & Confirm
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

export default BookingEmail;
