/**
 * Environment variable validation.
 * Import this at the top of any server-side module that needs env vars.
 * Throws clearly at startup if required vars are missing.
 */

const REQUIRED_SERVER_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "CRON_SECRET",
] as const;

function validateEnv() {
  const missing = REQUIRED_SERVER_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\nSee .env.example for reference.`
    );
  }
}

// Only validate in server context (not during client-side bundle)
if (typeof window === "undefined") {
  validateEnv();
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID as string,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET as string,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET as string,
  resendApiKey: process.env.RESEND_API_KEY as string,
  emailFrom: process.env.EMAIL_FROM ?? "noreply@bookmything.com",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  cronSecret: process.env.CRON_SECRET as string,
};
