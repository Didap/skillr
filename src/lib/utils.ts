import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Amount with Italian thousands separators (80000 -> "80.000"); "—" when missing. */
export function formatEur(n: number | null | undefined) {
  return typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString("it-IT") : "—"
}

export type RateType = "ral_annual" | "daily" | "hourly"

/** Unit shown after an amount: "RAL" (annual gross), "gg" (per day), "ora" (per hour). */
export const RATE_UNIT: Record<RateType, string> = { ral_annual: "RAL", daily: "gg", hourly: "ora" }

/**
 * "€45.000–60.000 RAL", "€350/gg", "€55/ora". Pass max for a range (job budgets);
 * annual amounts read "<amount> RAL", the others "<amount>/<unit>".
 */
export function formatRate(rateType: RateType | null | undefined, min: number | null | undefined, max?: number | null) {
  const amount = max != null && max !== min ? `€${formatEur(min)}–${formatEur(max)}` : `€${formatEur(min)}`
  const type = rateType ?? "ral_annual"
  return type === "ral_annual" ? `${amount} ${RATE_UNIT[type]}` : `${amount}/${RATE_UNIT[type]}`
}
