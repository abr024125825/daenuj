
-- Add column to encounters for therapist to set wait days before next booking
ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS next_booking_after_days integer DEFAULT 7;

-- Update the can_patient_book_appointment function to return wait info
CREATE OR REPLACE FUNCTION public.can_patient_book_appointment(p_patient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment record;
  v_encounter record;
BEGIN
  -- Check for active appointments (scheduled/confirmed)
  SELECT id, appointment_date, appointment_time, status, duration_minutes
  INTO v_appointment
  FROM appointments
  WHERE patient_id = p_patient_id
    AND status IN ('scheduled', 'confirmed', 'in_progress')
    AND appointment_date >= CURRENT_DATE
  ORDER BY appointment_date, appointment_time
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'can_book', false,
      'reason', 'active_appointment',
      'message', 'You already have an active appointment.',
      'appointment', jsonb_build_object(
        'date', v_appointment.appointment_date,
        'time', v_appointment.appointment_time,
        'status', v_appointment.status,
        'duration', v_appointment.duration_minutes
      )
    );
  END IF;

  -- Check for unsigned encounters
  SELECT id, signed_at, next_booking_after_days
  INTO v_encounter
  FROM encounters
  WHERE patient_id = p_patient_id
    AND signed_at IS NULL
  ORDER BY encounter_date DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'can_book', false,
      'reason', 'unsigned_encounter',
      'message', 'Your previous session has not been signed by the therapist yet. Please wait until it is completed.'
    );
  END IF;

  -- Check for signed encounters with wait days - find the most recent signed encounter
  SELECT id, signed_at, next_booking_after_days
  INTO v_encounter
  FROM encounters
  WHERE patient_id = p_patient_id
    AND signed_at IS NOT NULL
    AND next_booking_after_days IS NOT NULL
    AND next_booking_after_days > 0
  ORDER BY signed_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'can_book', true,
      'reason', 'ok',
      'earliest_booking_date', (v_encounter.signed_at::date + v_encounter.next_booking_after_days)::text,
      'wait_days', v_encounter.next_booking_after_days
    );
  END IF;

  -- No restrictions
  RETURN jsonb_build_object(
    'can_book', true,
    'reason', 'ok',
    'earliest_booking_date', CURRENT_DATE::text,
    'wait_days', 0
  );
END;
$$;
