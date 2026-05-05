import { Metadata } from "next";
import PALandingClient from "./PALandingClient";

export const metadata: Metadata = {
  title: "Skillr per la PA - Puglia",
  description: "Soluzioni tecnologiche per NEET e placement pubblico. La piattaforma di matching per Comuni, Regioni ed enti accreditati.",
  keywords: ["PA", "Puglia", "NEET", "Lavoro", "Matching", "Rendicontazione", "Garanzia Giovani", "GOL", "Placement Pubblico"],
};

export default function PALandingPage() {
  return <PALandingClient />;
}
