-- Migration: add first_name + last_name to profiles, update signup trigger.
-- Run this in the Supabase SQL editor. Safe to run on an existing DB with users.
--
-- After this migration, new signups (via the /signup page) will populate
-- profiles.first_name / last_name from the OTP metadata. Existing profiles
-- will keep their current full_name and have NULL first_name / last_name
-- until the user edits them in Settings.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name  TEXT;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first TEXT := NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), '');
  v_last  TEXT := NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'),  '');
  v_full  TEXT := NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'),  '');
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, full_name)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    v_first,
    v_last,
    COALESCE(v_full, TRIM(CONCAT_WS(' ', v_first, v_last)), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
