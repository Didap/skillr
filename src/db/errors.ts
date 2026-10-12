/** True for Postgres unique violations (23505). Drizzle wraps the driver error, so check the cause too. */
export function isUniqueViolation(error: unknown) {
  const err = error as { code?: string; cause?: { code?: string } } | undefined;
  return (err?.code ?? err?.cause?.code) === "23505";
}
