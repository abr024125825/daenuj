
-- 1. Add clinic_coordinator to user_role enum (must be separate transaction)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'clinic_coordinator';
