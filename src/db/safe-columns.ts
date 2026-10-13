// Column selection for user rows that can reach the client (pages, client components,
// server action results). Never select the password hash outside of the login check.
export const publicUserColumns = { password: false } as const;

// Ready-made relation configs for the common includes, so new queries don't have to
// remember the column filter.
export const publicUser = { columns: publicUserColumns } as const;
export const companyWithProfile = { columns: publicUserColumns, with: { companyProfile: true } } as const;
export const professionalWithProfile = { columns: publicUserColumns, with: { professionalProfile: true } } as const;
