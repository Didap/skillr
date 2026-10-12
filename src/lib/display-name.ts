// Names shown in emails, sheets and headers. Profiles hold the real names; users.name is
// often null for password sign-ups, so it is only a fallback.

type Named = { name?: string | null } | null | undefined;

export function companyDisplayName(
  user: Named & { companyProfile?: { companyName?: string | null } | null },
  fallback = "Azienda"
) {
  return user?.companyProfile?.companyName?.trim() || user?.name?.trim() || fallback;
}

export function professionalDisplayName(
  user: Named & { professionalProfile?: { firstName?: string | null; lastName?: string | null } | null },
  fallback = "Professionista"
) {
  const p = user?.professionalProfile;
  const full = `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();
  return full || user?.name?.trim() || fallback;
}
