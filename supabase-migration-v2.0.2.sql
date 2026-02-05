-- Migration for Workout Tracker V2.0.2
-- Run this SQL in your Supabase SQL Editor to add missing columns

-- Add is_bodyweight column to exercises table (for bodyweight exercises that don't need weight input)
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS is_bodyweight BOOLEAN DEFAULT false;

-- Add additional exercise detail columns
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS form_cues TEXT DEFAULT '';
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS common_mistakes TEXT DEFAULT '';
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS muscle_activation TEXT DEFAULT '';
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS safety_tips TEXT DEFAULT '';

-- Add custom_reps column to workout_exercises (allows different reps per set, e.g. [16, 12, 8])
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS custom_reps INTEGER[] DEFAULT NULL;

-- Update existing bodyweight exercises to have is_bodyweight = true
-- (Pull-ups, Tricep Dips, Plank are the default bodyweight exercises)
UPDATE public.exercises
SET is_bodyweight = true
WHERE name IN ('Pull-ups', 'Tricep Dips', 'Plank')
  AND is_bodyweight = false;

-- Create index for faster bodyweight filtering
CREATE INDEX IF NOT EXISTS idx_exercises_is_bodyweight ON public.exercises(is_bodyweight);
