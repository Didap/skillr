// Names shown in emails, sheets and headers. Profiles hold the real names; users.name is
// often null for password sign-ups, so it is only a fallback.

export function companyDisplayName(
  user: ({ name?: string | null; companyProfile?: { companyName?: string | null } | null }) | null | undefined,
  fallback = "Azienda"
) {
  return user?.companyProfile?.companyName?.trim() || user?.name?.trim() || fallback;
}

export function professionalDisplayName(
  user: ({ name?: string | null; professionalProfile?: { firstName?: string | null; lastName?: string | null } | null }) | null | undefined,
  fallback = "Professionista"
) {
  const p = user?.professionalProfile;
  const full = `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();
  return full || user?.name?.trim() || fallback;
}
