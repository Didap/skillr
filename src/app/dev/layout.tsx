import { notFound } from "next/navigation";

// Dev-only playgrounds (no database, no sign-in): the whole segment is a 404 in production.
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
