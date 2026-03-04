/**
 * Client-safe security utilities — no Node.js built-ins.
 * Safe to import in both server and client components.
 *
 * Crypto-dependent functions (safeCompare, generateInviteToken, verifyInviteToken)
 * live in security.server.ts — import those only in server-side code.
 */

/**
 * Validates a redirect URL and ensures it is an internal path only.
 * Prevents open redirect attacks by rejecting external URLs.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  // Only allow relative paths starting with / (no protocol, no double-slash, no backslash)
  if (
    typeof raw === "string" &&
    raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.includes("\\") &&
    !raw.toLowerCase().includes("javascript:") // eslint-disable-line no-script-url
  ) {
    return raw;
  }
  return fallback;
}

/**
 * Escapes HTML special characters to prevent XSS in HTML email templates.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
