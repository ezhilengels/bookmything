/**
 * Server-only security utilities — uses Node.js crypto.
 * NEVER import this file in client components or Edge Runtime code.
 *
 * Client-safe helpers (safeRedirectPath, escapeHtml) are in security.ts.
 */
import crypto from "crypto";

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
 * Returns the businessId if valid, or null if tampered / invalid.
 */
export function verifyInviteToken(token: string): string | null {
  try {
    const secret = process.env.INVITE_TOKEN_SECRET ?? process.env.CRON_SECRET;
    if (!secret) return null;

    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const payload = token.slice(0, dotIndex);
    const providedSig = token.slice(dotIndex + 1);
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    // Constant-time comparison — prevents timing attacks on the signature
    if (expectedSig.length !== providedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig))) return null;

    const businessId = Buffer.from(payload, "base64url").toString("utf8");

    // Validate decoded value is a UUID before using it as a DB key
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(businessId)) return null;

    return businessId;
  } catch {
    return null;
  }
}
