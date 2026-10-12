// Column selection for user rows that can reach the client (pages, client components,
// server action results). Never select the password hash outside of the login check.
export const publicUserColumns = { password: false } as const;
