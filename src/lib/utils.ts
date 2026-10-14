import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Custom theme keys from globals.css. Without them tailwind-merge reads `text-label` (a Figma
// text style, i.e. a font size) as a colour and drops it next to `text-viola`, and can't
// resolve conflicts on rounded-card, shadow-card or the brand font families.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "title", "prompt", "body", "label", "chip"],
      radius: ["card"],
      shadow: ["card", "premium"],
      font: ["display", "prompt", "script"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** True when a key event comes from a text field, where keys belong to the field. */
export function isEditableTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest("input, textarea, select, [contenteditable='true']")
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
