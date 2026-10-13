"use client";

import { signOut } from "next-auth/react";
import { clearOnboardingDraft } from "@/lib/onboarding-draft";

/** Sign out and drop the half-finished onboarding draft, so the next person on this browser starts clean. */
export function signOutAndClearDraft() {
  clearOnboardingDraft();
  return signOut({ callbackUrl: "/" });
}
