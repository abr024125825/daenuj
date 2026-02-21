-- Create a trigger to enforce one active appointment per patient
CREATE OR REPLACE FUNCTION check_one_active_appointment_per_patient()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('scheduled', 'confirmed') THEN
    IF EXISTS (
      SELECT 1 FROM appointments
      WHERE patient_id = NEW.patient_id
        AND status IN ('scheduled', 'confirmed')
        AND appointment_date >= CURRENT_DATE
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Patient already has an active appointment. Only one appointment is allowed at a time.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_one_active_appointment ON appointments;
CREATE TRIGGER enforce_one_active_appointment
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_one_active_appointment_per_patient();

-- Also add DELETE policy for appointments so therapists (psychologists) can delete
CREATE POLICY "Psychologists can delete appointments"
  ON appointments
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::user_role) 
    OR has_role(auth.uid(), 'clinic_coordinator'::user_role)
    OR has_role(auth.uid(), 'psychologist'::user_role)
  );