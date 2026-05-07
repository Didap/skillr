import { Metadata } from "next";
import NewEventClient from "./NewEventClient";

export const metadata: Metadata = {
  title: "Crea Smart Interview | Skillr",
  description: "Crea una nuova sessione di speed-dating professionale.",
};

export default function NewEventPage() {
  return <NewEventClient />;
}
