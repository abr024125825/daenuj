-- Create function to auto-assign volunteers excluding same major
CREATE OR REPLACE FUNCTION public.auto_assign_volunteer_for_exam(
  _exam_id UUID,
  _assigned_role TEXT,
  _assigned_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Get student to find their major (via university_id pattern - first digits indicate faculty)
  SELECT * INTO _student FROM disability_students WHERE id = _exam.student_id;
  
  -- Find best available volunteer:
  -- 1. Available during exam time
  -- 2. Not from same major as student (checked via volunteer's faculty)
  -- 3. No conflicting assignments
  -- 4. Prioritized by availability score
  SELECT 
    v.id as volunteer_id,
    va.first_name || ' ' || va.family_name as full_name,
    va.faculty_id as volunteer_faculty_id
  INTO _best_volunteer
  FROM volunteers v
  JOIN volunteer_applications va ON v.application_id = va.id
  WHERE v.is_active = true
    AND va.status = 'approved'
    -- Exclude volunteers from same faculty as student (check by disability code prefix if available)
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
        AND LOWER(vc.day_of_week) = LOWER(TO_CHAR(_exam.exam_date::DATE, 'Day'))
        AND vc.start_time < _exam.end_time
        AND vc.end_time > _exam.start_time
    )
  ORDER BY v.rating DESC NULLS LAST, v.total_hours DESC NULLS LAST
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
    json_build_object('volunteer_id', _best_volunteer.volunteer_id, 'role', _assigned_role, 'volunteer_name', _best_volunteer.full_name),
    _assigned_by
  );
  
  RETURN json_build_object(
    'success', true, 
    'assignment_id', _assignment_id,
    'volunteer_id', _best_volunteer.volunteer_id,
    'volunteer_name', _best_volunteer.full_name
  );
END;
$$;

-- Create function to bulk auto-assign all pending exams
CREATE OR REPLACE FUNCTION public.auto_assign_all_pending_exams(
  _assigned_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _exam RECORD;
  _result JSON;
  _success_count INT := 0;
  _fail_count INT := 0;
  _results JSON[] := ARRAY[]::JSON[];
BEGIN
  -- Loop through all pending exams
  FOR _exam IN 
    SELECT de.id, de.special_needs
    FROM disability_exams de
    WHERE de.status = 'pending'
    ORDER BY de.exam_date, de.start_time
  LOOP
    -- Try to assign for the first special need
    IF _exam.special_needs IS NOT NULL AND array_length(_exam.special_needs, 1) > 0 THEN
      _result := auto_assign_volunteer_for_exam(_exam.id, _exam.special_needs[1]::TEXT, _assigned_by);
      
      IF (_result->>'success')::BOOLEAN THEN
        _success_count := _success_count + 1;
      ELSE
        _fail_count := _fail_count + 1;
      END IF;
      
      _results := array_append(_results, json_build_object('exam_id', _exam.id, 'result', _result));
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success_count', _success_count,
    'fail_count', _fail_count,
    'details', _results
  );
END;
$$;