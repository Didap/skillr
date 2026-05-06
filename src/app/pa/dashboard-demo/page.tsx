import { getPaDashboardStatsAction } from "@/app/actions/dashboard";
import { PaDashboardClient } from "@/app/pa/dashboard-demo/PaDashboardClient";

export default async function PaDashboardPage() {
  // const session = await auth();
  
  // Per ora lasciamo libero per la demo come richiesto, 
  // ma idealmente vorremmo controllare se è pa_admin
  // if (session?.user?.role !== 'pa_admin') {
  //   redirect("/auth/login");
  // }

  const result = await getPaDashboardStatsAction();
  
  if (!result.success || !result.stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-destructive font-medium">{result.error || "Errore nel caricamento"}</p>
      </div>
    );
  }

  return (
    <div className="bg-pa-gray-cold min-h-screen">
      <PaDashboardClient initialStats={result.stats} />
    </div>
  );
}
