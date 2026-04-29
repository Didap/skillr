import { Resend } from 'resend';
import { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  text?: string;
  attachments?: {
    filename: string;
    content: string | Buffer;
  }[];
}

export async function sendEmail({ to, subject, react, text, attachments }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Skillr <onboarding@resend.dev>',
      to,
      subject,
      react,
      text: text || '',
      attachments,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    return { success: false, error };
  }
}
