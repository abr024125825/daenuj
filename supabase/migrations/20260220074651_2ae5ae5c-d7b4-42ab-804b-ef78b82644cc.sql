
-- Create a trigger to prevent a patient from having more than one active appointment
CREATE OR REPLACE FUNCTION public.check_patient_single_active_appointment()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = NEW.patient_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('scheduled', 'confirmed')
      AND appointment_date >= CURRENT_DATE
  ) THEN
    RAISE EXCEPTION 'Patient already has an active appointment. Only one active appointment is allowed at a time.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER enforce_single_active_appointment
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_patient_single_active_appointment();

-- Also create a trigger to prevent the same slot from being double-booked
CREATE OR REPLACE FUNCTION public.check_slot_not_double_booked()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE provider_id = NEW.provider_id
      AND appointment_date = NEW.appointment_date
      AND appointment_time = NEW.appointment_time
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('scheduled', 'confirmed', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'This time slot is already booked.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER enforce_no_double_booking
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_slot_not_double_booked();
