-- Add phone_verified flag to profiles
-- Existing rows default to false (not verified)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.phone_verified IS
  'True when the user has verified their phone number via OTP';
