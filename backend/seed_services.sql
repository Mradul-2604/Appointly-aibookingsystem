-- Seed doctor consultation reasons
-- Run in Supabase SQL Editor → New Query

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_name_unique'
  ) THEN
    ALTER TABLE services ADD CONSTRAINT services_name_unique UNIQUE (name);
  END IF;
END $$;

-- Insert consultation reasons
INSERT INTO services (name, duration_minutes, is_active)
VALUES
  ('General Consultation',         30, true),
  ('Fever & Cold',                 30, true),
  ('Headache & Migraines',         30, true),
  ('Stomach & Digestive Issues',   30, true),
  ('Back & Joint Pain',            30, true),
  ('Skin & Allergy Issues',        30, true),
  ('Respiratory Issues',           30, true),
  ('Blood Pressure & Heart Check', 30, true),
  ('Mental Health Consultation',   30, true),
  ('Follow-up Visit',              30, true),
  ('Prescription Renewal',         30, true),
  ('Annual Check-up',              30, true)
ON CONFLICT (name) DO NOTHING;
