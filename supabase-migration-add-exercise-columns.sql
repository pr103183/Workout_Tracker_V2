-- Migration: Add missing columns to exercises table
-- Run this in Supabase SQL Editor to fix sync errors
--
-- These columns exist in the local app but were missing from the Supabase database.
-- After running this migration, sync will work correctly for all exercise fields.

-- Add form_cues column
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS form_cues TEXT DEFAULT '';

-- Add common_mistakes column
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS common_mistakes TEXT DEFAULT '';

-- Add muscle_activation column
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS muscle_activation TEXT DEFAULT '';

-- Add safety_tips column
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS safety_tips TEXT DEFAULT '';

-- Add is_bodyweight column
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS is_bodyweight BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'exercises'
ORDER BY ordinal_position;
