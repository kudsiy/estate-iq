export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Points to our own email/password login page — no external OAuth dependency.
export const getLoginUrl = (returnTo?: string) => {
  if (returnTo && returnTo !== "/") {
    return `/login?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return "/login";
};
