-- Add disability_coordinator to the user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'disability_coordinator';