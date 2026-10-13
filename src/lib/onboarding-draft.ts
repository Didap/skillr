// localStorage key of the half-finished onboarding form (never contains credentials).
export const ONBOARDING_DRAFT_KEY = "onboarding_draft";

export function clearOnboardingDraft() {
  try {
    localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked site data)
  }
}
