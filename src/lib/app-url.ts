/** Absolute URL of a page of the app, for links in emails and calendar invites. */
export function appUrl(path = "/") {
  const base = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
