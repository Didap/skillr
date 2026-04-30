export interface JobData {
  title: string;
  description?: string | null;
  skills: string[] | null;
  budgetMinEur: number | null;
  budgetMaxEur: number | null;
  rateType: "ral_annual" | "daily" | "hourly" | null;
  location?: string | null;
  remoteOk: boolean | null;
}
