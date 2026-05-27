export function setSessionToken(token: string) {
  // Set session cookie for 30 days
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `session_token=${token}; path=/; expires=${expires}; SameSite=Lax; Secure`;
}

export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^|;)\s*session_token\s*=\s*([^;]+)/);
  return match ? decodeURIComponent(match[2]!) : null;
}

export function clearSessionToken() {
  document.cookie =
    "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
}
