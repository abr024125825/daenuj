-- Drop and recreate the function with updated return type
DROP FUNCTION IF EXISTS public.get_available_volunteers_for_exam(date, time without time zone, time without time zone);

-- Recreate with volunteer_type included
CREATE OR REPLACE FUNCTION public.get_available_volunteers_for_exam(_exam_date date, _start_time time without time zone, _end_time time without time zone)
 RETURNS TABLE(volunteer_id uuid, user_id uuid, full_name text, availability_score integer, volunteer_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as volunteer_id,
        v.user_id,
        va.first_name || ' ' || va.father_name || ' ' || va.family_name as full_name,
        CASE 
            WHEN NOT check_volunteer_exam_conflict(v.id, _exam_date, _start_time, _end_time) THEN 
              100 - COALESCE((
                SELECT COUNT(*)::integer 
                FROM disability_exam_assignments dea 
                WHERE dea.volunteer_id = v.id 
                  AND dea.status NOT IN ('cancelled', 'completed')
              ), 0)
            ELSE 0
        END as availability_score,
        v.volunteer_type
    FROM volunteers v
    JOIN volunteer_applications va ON va.id = v.application_id
    WHERE v.is_active = true
    AND NOT check_volunteer_exam_conflict(v.id, _exam_date, _start_time, _end_time)
    ORDER BY availability_score DESC;
END;
$function$;

-- Update the auto_assign function to use fair load balancing
CREATE OR REPLACE FUNCTION public.auto_assign_volunteer_for_exam(_exam_id uuid, _assigned_role text, _assigned_by uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _exam RECORD;
  _student RECORD;
  _best_volunteer RECORD;
  _assignment_id UUID;
BEGIN
  -- Get exam details
  SELECT * INTO _exam FROM disability_exams WHERE id = _exam_id;
  
  IF _exam IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Exam not found');
  END IF;
  
  -- Get student to find their major
  SELECT * INTO _student FROM disability_students WHERE id = _exam.student_id;
  
  -- Find best available volunteer with FAIR LOAD BALANCING:
  -- 1. Available during exam time
  -- 2. Not from same major as student
  -- 3. No conflicting assignments
  -- 4. Prioritized by LOWEST current assignment count (fair distribution)
  SELECT 
    v.id as volunteer_id,
    va.first_name || ' ' || va.family_name as full_name,
    va.faculty_id as volunteer_faculty_id,
    v.volunteer_type,
    COALESCE((
      SELECT COUNT(*) 
      FROM disability_exam_assignments dea 
      WHERE dea.volunteer_id = v.id 
        AND dea.status NOT IN ('cancelled', 'completed')
    ), 0) as current_assignment_count
  INTO _best_volunteer
  FROM volunteers v
  JOIN volunteer_applications va ON v.application_id = va.id
  WHERE v.is_active = true
    AND va.status = 'approved'
    -- Exclude volunteers from same faculty as student
    AND (
      _student.disability_code IS NULL 
      OR va.faculty_id NOT IN (
        SELECT DISTINCT va2.faculty_id 
        FROM volunteer_applications va2 
        WHERE va2.university_id LIKE SUBSTRING(_student.university_id FROM 1 FOR 3) || '%'
      )
    )
    -- Check no conflicting disability exam assignments
    AND NOT EXISTS (
      SELECT 1 FROM disability_exam_assignments dea
      JOIN disability_exams de ON dea.exam_id = de.id
      WHERE dea.volunteer_id = v.id
        AND dea.status NOT IN ('cancelled', 'completed')
        AND de.exam_date = _exam.exam_date
        AND de.start_time < _exam.end_time
        AND de.end_time > _exam.start_time
    )
    -- Check no conflicting regular exam schedules
    AND NOT EXISTS (
      SELECT 1 FROM exam_schedules es
      WHERE es.volunteer_id = v.id
        AND es.exam_date = _exam.exam_date
        AND es.start_time < _exam.end_time
        AND es.end_time > _exam.start_time
    )
    -- Check no conflicting courses on that day
    AND NOT EXISTS (
      SELECT 1 FROM volunteer_courses vc
      WHERE vc.volunteer_id = v.id
        AND LOWER(TRIM(vc.day_of_week)) = LOWER(TRIM(TO_CHAR(_exam.exam_date::DATE, 'Day')))
        AND vc.start_time < _exam.end_time
        AND vc.end_time > _exam.start_time
    )
  ORDER BY 
    -- Fair distribution: prioritize volunteers with fewer current assignments
    COALESCE((
      SELECT COUNT(*) 
      FROM disability_exam_assignments dea 
      WHERE dea.volunteer_id = v.id 
        AND dea.status NOT IN ('cancelled', 'completed')
    ), 0) ASC,
    -- Then by rating and experience
    v.rating DESC NULLS LAST, 
    v.total_hours DESC NULLS LAST
  LIMIT 1;
  
  IF _best_volunteer IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No available volunteers found');
  END IF;
  
  -- Create the assignment
  INSERT INTO disability_exam_assignments (
    exam_id,
    volunteer_id,
    assigned_role,
    status,
    assigned_by
  ) VALUES (
    _exam_id,
    _best_volunteer.volunteer_id,
    _assigned_role::special_need_type,
    'assigned',
    _assigned_by
  )
  RETURNING id INTO _assignment_id;
  
  -- Update exam status
  UPDATE disability_exams SET status = 'assigned' WHERE id = _exam_id;
  
  -- Log the action
  INSERT INTO disability_exam_logs (
    exam_id,
    action,
    new_value,
    performed_by
  ) VALUES (
    _exam_id,
    'auto_assigned',
    json_build_object(
      'volunteer_id', _best_volunteer.volunteer_id, 
      'role', _assigned_role, 
      'volunteer_name', _best_volunteer.full_name,
      'volunteer_type', _best_volunteer.volunteer_type,
      'current_assignments', _best_volunteer.current_assignment_count
    ),
    _assigned_by
  );
  
  RETURN json_build_object(
    'success', true, 
    'assignment_id', _assignment_id,
    'volunteer_id', _best_volunteer.volunteer_id,
    'volunteer_name', _best_volunteer.full_name,
    'volunteer_type', _best_volunteer.volunteer_type
  );
END;
$function$;