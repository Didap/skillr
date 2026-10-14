// Helllo email palette (see DESIGN.md). Inline styles only: email clients ignore CSS files.
export const colors = {
  viola: '#653171', // all text
  violaSoft: '#80558A', // secondary text (viola-500)
  border: '#E4DAE6', // lines (viola-200)
  rosso: '#E93D29', // primary buttons, logo
  blu: '#225AD6', // links
  crema: '#F4E9E9', // soft surfaces
  white: '#FFFFFF',
};

export const fontFamily = '"Hanken Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif';

export const main = {
  backgroundColor: colors.crema,
  fontFamily,
  color: colors.viola,
};

export const container = {
  margin: '32px auto',
  padding: '8px 0 16px',
  width: '100%',
  maxWidth: '580px',
  backgroundColor: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: '28px',
};

export const header = {
  padding: '32px 32px 8px',
};

export const logo = {
  display: 'block',
  border: '0',
  margin: '0 0 24px',
  // Shown as the alt text when images are blocked
  color: colors.rosso,
  fontSize: '24px',
  fontWeight: '700',
};

export const h1 = {
  color: colors.viola,
  fontSize: '26px',
  fontWeight: '700',
  lineHeight: '1.25',
  letterSpacing: '-0.01em',
  margin: '0',
};

export const content = {
  padding: '0 32px',
};

export const text = {
  color: colors.viola,
  fontSize: '16px',
  lineHeight: '1.5',
};

export const card = {
  backgroundColor: colors.crema,
  borderRadius: '20px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

export const avatar = {
  borderRadius: '50%',
  margin: '0 auto 12px',
  objectFit: 'cover' as const,
};

export const matchedNameText = {
  color: colors.viola,
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
};

export const roleText = {
  color: colors.violaSoft,
  fontSize: '14px',
  margin: '4px 0 0',
};

export const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

export const button = {
  backgroundColor: colors.rosso,
  borderRadius: '9999px',
  color: colors.white,
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

export const link = {
  color: colors.blu,
  fontWeight: '600',
  textDecoration: 'underline',
};

// Raw URLs printed as a fallback under a button
export const rawLink = {
  color: colors.blu,
  fontSize: '13px',
  wordBreak: 'break-all' as const,
};

export const note = {
  color: colors.violaSoft,
  fontSize: '13px',
  lineHeight: '1.5',
};

export const hr = {
  borderColor: colors.border,
  margin: '24px 0',
};

export const footer = {
  padding: '0 32px',
};

export const footerText = {
  color: colors.violaSoft,
  fontSize: '13px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
};
