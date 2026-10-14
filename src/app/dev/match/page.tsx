import { notFound } from "next/navigation";
import { MatchPreview } from "./MatchPreview";

// Dev-only playground for the match screen: no database, no real match needed.
export default function MatchPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MatchPreview />;
}
