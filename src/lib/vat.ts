/**
 * Validates an Italian VAT number (Partita IVA).
 * Requirements: 11 digits, optionally prefixed by "IT".
 */
export function validateItalianVAT(vat: string): boolean {
  if (!vat) return false;
  
  // Remove spaces and dashes
  const cleanVAT = vat.replace(/[\s-]/g, "");

  // Simple regex check as requested: optionally "IT" followed by exactly 11 digits
  return /^(IT)?[0-9]{11}$/.test(cleanVAT);
}
