"use server";

import { db } from "@/db";
import { users, matches, interviewBookings } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function getPaDashboardStatsAction() {
  // const session = await auth();
  
  // Per la demo permettiamo l'accesso, ma in prod andrebbe protetto
  // if (session?.user?.role !== 'pa_admin') {
  //   throw new Error("Unauthorized");
  // }

  try {
    // 1. Totale NEET (Ruolo 'professional')
    const [neetCount] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "professional"));

    // 2. Totale Match
    const [matchCount] = await db
      .select({ value: count() })
      .from(matches);

    // 3. Totale Colloqui
    const [bookingCount] = await db
      .select({ value: count() })
      .from(interviewBookings);

    // 4. Distribuzione per Provincia (Mock basata su CAP se presenti, altrimenti casuale per la demo)
    // In un sistema reale useremmo: 
    // const statsByProvince = await db.select({ province: users.city, count: count() }).from(users)...
    
    const provinceData = [
      { name: "Bari", value: Math.floor(neetCount.value * 0.35) },
      { name: "Lecce", value: Math.floor(neetCount.value * 0.20) },
      { name: "Foggia", value: Math.floor(neetCount.value * 0.15) },
      { name: "Taranto", value: Math.floor(neetCount.value * 0.12) },
      { name: "Brindisi", value: Math.floor(neetCount.value * 0.10) },
      { name: "BAT", value: Math.floor(neetCount.value * 0.08) },
    ];

    // 5. Time-to-placement medio (differenza tra creazione match e conferma slot)
    // Mock per ora
    const avgPlacementDays = 12.5;

    return {
      success: true,
      stats: {
        totalNeet: neetCount.value,
        totalMatches: matchCount.value,
        totalBookings: bookingCount.value,
        avgPlacementDays,
        provinceData,
      }
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return { success: false, error: "Errore nel caricamento dei dati." };
  }
}
