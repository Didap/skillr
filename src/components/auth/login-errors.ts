// Codes the Credentials provider (src/auth.ts) attaches to CredentialsSignin errors.
// next-auth hands them back to the client as `signIn(...).code` and as `?code=` on the
// login page URL, so they must stay generic: never hint at which credential was wrong.
export const EMAIL_NOT_VERIFIED = "email_not_verified";
export const TURNSTILE_FAILED = "turnstile_failed";

export function credentialsErrorMessage(code?: string | null) {
  switch (code) {
    case EMAIL_NOT_VERIFIED:
      return "La tua email non è ancora verificata. Registrati di nuovo con la stessa email per ricevere un nuovo codice, oppure accedi con il Magic Link.";
    case TURNSTILE_FAILED:
      return "Verifica anti-spam non riuscita. Riprova.";
    default:
      return "Email o password non corretti.";
  }
}
