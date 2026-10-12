import { Resend } from 'resend';
import { after } from 'next/server';
import { render } from '@react-email/components';
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
    // Render React templates here: Resend's own `react` option imports @react-email/render,
    // which is only installed nested under @react-email/components, so it always failed.
    const body = react ? await render(react) : html || '';
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Skillr <onboarding@resend.dev>',
      to,
      subject,
      html: body,
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

/**
 * Sends emails after the response has gone out, so rendering and Resend calls don't add
 * latency to the action. Failures are logged and never fail the caller.
 */
export function sendInBackground(label: string, sends: (() => Promise<{ success: boolean }>)[]) {
  if (sends.length === 0) return;
  const run = async () => {
    const results = await Promise.allSettled(sends.map((send) => send()));
    const failures = results.filter((r) => r.status === "rejected" || !r.value.success).length;
    if (failures > 0) console.error(`${failures}/${sends.length} emails failed to send (${label})`);
  };
  try {
    after(run);
  } catch {
    // after() is only available inside a request scope
    void run();
  }
}
