import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Amount with Italian thousands separators (80000 -> "80.000"); "—" when missing. */
export function formatEur(n: number | null | undefined) {
  return typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString("it-IT") : "—"
}
