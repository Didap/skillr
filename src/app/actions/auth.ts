"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function registerUserAction(formData: any) {
  const { email, password } = formData;

  if (!email || !password) {
    return { error: "Email e password sono obbligatori." };
  }

  try {
    // 1. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "Questo indirizzo email è già registrato." };
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user
    await db.insert(users).values({
      email,
      password: hashedPassword,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: `Errore durante la registrazione: ${error.message || "Errore sconosciuto"}` };
  }
}
