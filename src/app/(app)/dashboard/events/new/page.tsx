import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import NewEventClient from "./NewEventClient";

export const metadata: Metadata = {
  title: "Crea Smart Interview | Helllo",
  description: "Crea una nuova sessione di speed-dating professionale.",
};

export default async function NewEventPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only companies can create events (the action rejects everyone else anyway)
  if (session.user.role !== 'company') {
    redirect("/dashboard");
  }

  return <NewEventClient />;
}
