-- ============================================================
-- Migration: Decouple profiles from Supabase Auth (for Clerk)
-- Run this in Supabase SQL Editor → New Query
-- ============================================================

-- 1. Drop the FK constraint that tied profiles.id to auth.users
--    (Clerk users don't exist in auth.users, so this blocked all inserts)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Make profiles.id auto-generate a UUID (no longer requires auth.users)
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Add clerk_id column to store the Clerk user identifier
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- 4. Ensure email uniqueness for upsert on_conflict to work
--    (wrapped in DO block to skip if constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- 5. Drop the FK on conversation_context that referenced profiles(id) via auth.users
--    (it still references profiles(id) which is now a regular UUID — this is fine,
--     but we need to ensure there's no leftover auth constraint)
-- No change needed for conversation_context or appointments since they reference profiles(id) UUID which still works.

-- Verify: check the updated profiles table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
