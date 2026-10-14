// Throwaway database for integration tests: dropped and recreated on every run.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://postgres:password@localhost:5434/helllo_test";
