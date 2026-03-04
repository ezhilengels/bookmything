import crypto from "crypto";

/**
 * Validates a redirect URL and ensures it's an internal path only.
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
 * Constant-time string comparison to prevent timing attacks.
 * Use for comparing secrets (HMAC signatures, bearer tokens, etc).
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Generates a HMAC-signed invite token for staff onboarding.
 * Format: base64url(businessId) + "." + base64url(HMAC-SHA256 signature)
 */
export function generateInviteToken(businessId: string): string {
  const secret = process.env.INVITE_TOKEN_SECRET ?? process.env.CRON_SECRET;
  if (!secret) throw new Error("Missing INVITE_TOKEN_SECRET env var");
  const payload = Buffer.from(businessId).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/**
 * Verifies a HMAC-signed invite token.
 * Returns the businessId if valid, or null if tampered/invalid.
 */
export function verifyInviteToken(token: string): string | null {
  try {
    const secret = process.env.INVITE_TOKEN_SECRET ?? process.env.CRON_SECRET;
    if (!secret) return null;

    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const payload = token.slice(0, dotIndex);
    const providedSig = token.slice(dotIndex + 1);
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");

    if (!safeCompare(providedSig, expectedSig)) return null;

    const businessId = Buffer.from(payload, "base64url").toString("utf8");

    // Validate decoded value is a UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(businessId)) return null;

    return businessId;
  } catch {
    return null;
  }
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
