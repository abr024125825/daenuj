-- Create a security definer function to check if patient can book
CREATE OR REPLACE FUNCTION public.can_patient_book_appointment(p_patient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  active_appt record;
  unsigned_enc record;
BEGIN
  -- Check active appointments
  SELECT id, appointment_date, appointment_time, status, duration_minutes
  INTO active_appt
  FROM appointments
  WHERE patient_id = p_patient_id
    AND status IN ('scheduled', 'confirmed', 'in_progress')
    AND appointment_date >= CURRENT_DATE
  ORDER BY appointment_date ASC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'can_book', false,
      'reason', 'active_appointment',
      'appointment', jsonb_build_object(
        'id', active_appt.id,
        'date', active_appt.appointment_date,
        'time', active_appt.appointment_time,
        'status', active_appt.status,
        'duration', active_appt.duration_minutes
      )
    );
  END IF;

  -- Check unsigned encounters
  SELECT id, encounter_date, status
  INTO unsigned_enc
  FROM encounters
  WHERE patient_id = p_patient_id
    AND signed_at IS NULL
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'can_book', false,
      'reason', 'unsigned_encounter',
      'message', 'Your previous session has not been signed yet by the provider. You can book a new appointment once it is completed and signed.'
    );
  END IF;

  RETURN jsonb_build_object('can_book', true);
END;
$$;