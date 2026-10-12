import { Resend } from 'resend';
import { ReactElement } from 'react';

let client: Resend | null = null;

// Created on first use: `new Resend()` throws when the key is missing, and doing that at
// import time used to take down every server action module that imports this file.
export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
  attachments?: {
    filename: string;
    content: string | Buffer;
  }[];
}

export async function sendEmail({ to, subject, react, html, text, attachments }: SendEmailOptions) {
  const resend = getResend();
  if (!resend) {
    console.error('Email not sent: RESEND_API_KEY is not set.');
    return { success: false, error: 'missing_api_key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Skillr <onboarding@resend.dev>',
      to,
      subject,
      ...(react ? { react } : { html: html || '' }),
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
