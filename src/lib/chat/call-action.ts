export const OFFLINE_ERROR = "Connessione assente. Riprova.";

/** A server action call that turns a network failure into the same `{ error }` shape the action returns. */
export function safeAction<T>(promise: Promise<T>): Promise<T | { error: string }> {
  return promise.catch(() => ({ error: OFFLINE_ERROR }));
}
