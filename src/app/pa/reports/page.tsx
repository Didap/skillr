"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { generateKpiReportAction } from "@/app/actions/reports";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function PaReportsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast.error("Seleziona sia la data di inizio che quella di fine.");
      return;
    }

    if (startDate > endDate) {
      toast.error("La data di inizio non può essere successiva alla data di fine.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateKpiReportAction(startDate, endDate);

      if (result.success && result.csv) {
        // Create a blob and download it
        const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", result.filename || "report_pa.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Report generato con successo!");
      } else {
        toast.error("error" in result ? result.error : "Errore nella generazione del report.");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Si è verificato un errore durante l'esportazione.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-viola-900 dark:text-viola-50">
          Reportistica e Rendicontazione PA
        </h1>
        <p className="text-lg text-viola-500 dark:text-viola-400">
          Esporta i dati necessari per la rendicontazione dei tuoi progetti territoriali (PNRR, FSE+, GG+).
        </p>
      </div>

      <Card className="border-viola-200 dark:border-viola-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-viola-50/50 dark:bg-viola-900/50 border-b border-viola-200 dark:border-viola-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blu-600 dark:text-blu-400" />
            <CardTitle>Generazione Report KPI</CardTitle>
          </div>
          <CardDescription>
            I dati verranno esportati in formato CSV compatibile con Excel e i principali software di rendicontazione.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-viola-700 dark:text-viola-300">
                Data di inizio
              </label>
              <DatePicker 
                value={startDate} 
                onChange={setStartDate} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-viola-700 dark:text-viola-300">
                Data di fine
              </label>
              <DatePicker 
                value={endDate} 
                onChange={setEndDate} 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-viola-100 dark:border-viola-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-viola-500">
              {startDate && endDate && (
                <span>
                  Esportazione dal <strong>{format(startDate, "PP", { locale: it })}</strong> al <strong>{format(endDate, "PP", { locale: it })}</strong>
                </span>
              )}
            </div>
            <Button 
              onClick={handleDownload} 
              disabled={isLoading}
              className="w-full sm:w-auto bg-blu-600 hover:bg-blu-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Scarica Report CSV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricBrief 
          title="NEET" 
          description="Iscritti e presi in carico" 
        />
        <MetricBrief 
          title="Match" 
          description="Incontri tra domanda e offerta" 
        />
        <MetricBrief 
          title="Placement" 
          description="Tirocini e assunzioni tracciate" 
        />
      </div>
    </div>
  );
}

function MetricBrief({ title, description }: { title: string; description: string }) {
  return (
    <Card className="bg-viola-50/30 dark:bg-viola-900/10 border-dashed border-viola-200 dark:border-viola-800">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-viola-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-viola-600 dark:text-viola-400">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
