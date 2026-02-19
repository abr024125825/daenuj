
-- Add unique constraint to prevent double-booking same slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_slot 
ON public.appointments (provider_id, appointment_date, appointment_time) 
WHERE status IN ('scheduled', 'confirmed');
