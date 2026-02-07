-- Add special_needs to disability_students table
ALTER TABLE public.disability_students
ADD COLUMN IF NOT EXISTS special_needs public.special_need_type[] DEFAULT NULL;

-- Update auto_assign_volunteer_for_exam to only assign employment program volunteers
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
  
  -- Find best available EMPLOYMENT volunteer with FAIR LOAD BALANCING:
  -- 1. Only employment program volunteers
  -- 2. Available during exam time
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
    -- ONLY employment program volunteers for auto-assignment
    AND v.volunteer_type = 'employment'
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
    RETURN json_build_object('success', false, 'error', 'No available employment volunteers found. Auto-assignment only applies to employment program volunteers.');
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

-- Insert University of Jordan Faculties and Majors
INSERT INTO faculties (id, name) VALUES
  (gen_random_uuid(), 'Faculty of Medicine'),
  (gen_random_uuid(), 'Faculty of Dentistry'),
  (gen_random_uuid(), 'Faculty of Pharmacy'),
  (gen_random_uuid(), 'Faculty of Nursing'),
  (gen_random_uuid(), 'Faculty of Rehabilitation Sciences'),
  (gen_random_uuid(), 'Faculty of Engineering'),
  (gen_random_uuid(), 'Faculty of Science'),
  (gen_random_uuid(), 'Faculty of Agriculture'),
  (gen_random_uuid(), 'King Abdullah II School of Information Technology'),
  (gen_random_uuid(), 'Faculty of Arts'),
  (gen_random_uuid(), 'Faculty of Business'),
  (gen_random_uuid(), 'Faculty of Law'),
  (gen_random_uuid(), 'Faculty of Sharia (Islamic Studies)'),
  (gen_random_uuid(), 'Faculty of Educational Sciences'),
  (gen_random_uuid(), 'Faculty of Physical Education'),
  (gen_random_uuid(), 'Faculty of Graduate Studies'),
  (gen_random_uuid(), 'Faculty of International Studies'),
  (gen_random_uuid(), 'Faculty of Archaeology and Tourism'),
  (gen_random_uuid(), 'Faculty of Foreign Languages'),
  (gen_random_uuid(), 'School of Art and Design')
ON CONFLICT DO NOTHING;

-- Insert majors for each faculty
DO $$
DECLARE
  v_faculty_id UUID;
BEGIN
  -- Faculty of Medicine
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Medicine' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Doctor of Medicine (M.D.)'),
      (gen_random_uuid(), v_faculty_id, 'Medical Laboratory Sciences'),
      (gen_random_uuid(), v_faculty_id, 'Radiology Technology')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Dentistry
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Dentistry' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Doctor of Dental Surgery (D.D.S.)')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Pharmacy
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Pharmacy' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Doctor of Pharmacy (Pharm.D.)'),
      (gen_random_uuid(), v_faculty_id, 'Pharmaceutical Sciences')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Nursing
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Nursing' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Nursing'),
      (gen_random_uuid(), v_faculty_id, 'Midwifery')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Rehabilitation Sciences
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Rehabilitation Sciences' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Physical Therapy'),
      (gen_random_uuid(), v_faculty_id, 'Occupational Therapy'),
      (gen_random_uuid(), v_faculty_id, 'Speech-Language Pathology'),
      (gen_random_uuid(), v_faculty_id, 'Hearing and Speech Sciences')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Engineering
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Engineering' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Civil Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Mechanical Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Electrical Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Chemical Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Industrial Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Computer Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Architecture Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Mechatronics Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Biomedical Engineering')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Science
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Science' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Mathematics'),
      (gen_random_uuid(), v_faculty_id, 'Statistics'),
      (gen_random_uuid(), v_faculty_id, 'Physics'),
      (gen_random_uuid(), v_faculty_id, 'Chemistry'),
      (gen_random_uuid(), v_faculty_id, 'Biological Sciences'),
      (gen_random_uuid(), v_faculty_id, 'Geology'),
      (gen_random_uuid(), v_faculty_id, 'Actuarial Science')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Agriculture
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Agriculture' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Plant Production'),
      (gen_random_uuid(), v_faculty_id, 'Animal Production'),
      (gen_random_uuid(), v_faculty_id, 'Land, Water and Environment'),
      (gen_random_uuid(), v_faculty_id, 'Nutrition and Food Technology'),
      (gen_random_uuid(), v_faculty_id, 'Agricultural Economics and Agribusiness')
    ON CONFLICT DO NOTHING;
  END IF;

  -- King Abdullah II School of Information Technology
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'King Abdullah II School of Information Technology' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Computer Science'),
      (gen_random_uuid(), v_faculty_id, 'Computer Information Systems'),
      (gen_random_uuid(), v_faculty_id, 'Software Engineering'),
      (gen_random_uuid(), v_faculty_id, 'Artificial Intelligence'),
      (gen_random_uuid(), v_faculty_id, 'Cybersecurity'),
      (gen_random_uuid(), v_faculty_id, 'Data Science')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Arts
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Arts' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Arabic Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'English Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'History'),
      (gen_random_uuid(), v_faculty_id, 'Geography'),
      (gen_random_uuid(), v_faculty_id, 'Philosophy'),
      (gen_random_uuid(), v_faculty_id, 'Sociology'),
      (gen_random_uuid(), v_faculty_id, 'Psychology'),
      (gen_random_uuid(), v_faculty_id, 'Political Science'),
      (gen_random_uuid(), v_faculty_id, 'Journalism and Media')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Business
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Business' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Business Administration'),
      (gen_random_uuid(), v_faculty_id, 'Accounting'),
      (gen_random_uuid(), v_faculty_id, 'Finance'),
      (gen_random_uuid(), v_faculty_id, 'Marketing'),
      (gen_random_uuid(), v_faculty_id, 'Management Information Systems'),
      (gen_random_uuid(), v_faculty_id, 'Public Administration'),
      (gen_random_uuid(), v_faculty_id, 'Banking and Finance')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Law
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Law' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Law')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Sharia (Islamic Studies)
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Sharia (Islamic Studies)' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Islamic Studies'),
      (gen_random_uuid(), v_faculty_id, 'Islamic Banking and Finance')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Educational Sciences
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Educational Sciences' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Classroom Teacher'),
      (gen_random_uuid(), v_faculty_id, 'Special Education'),
      (gen_random_uuid(), v_faculty_id, 'Counseling and Psychological Guidance'),
      (gen_random_uuid(), v_faculty_id, 'Educational Administration'),
      (gen_random_uuid(), v_faculty_id, 'Curriculum and Instruction'),
      (gen_random_uuid(), v_faculty_id, 'Early Childhood Education')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Physical Education
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Physical Education' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Physical Education'),
      (gen_random_uuid(), v_faculty_id, 'Sports Management'),
      (gen_random_uuid(), v_faculty_id, 'Sports Rehabilitation')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Archaeology and Tourism
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Archaeology and Tourism' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Archaeology'),
      (gen_random_uuid(), v_faculty_id, 'Tourism and Travel'),
      (gen_random_uuid(), v_faculty_id, 'Cultural Resources Management')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Faculty of Foreign Languages
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'Faculty of Foreign Languages' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'French Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'Spanish Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'German Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'Italian Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'Russian Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'Chinese Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'Korean Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'Japanese Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'Turkish Language and Literature'),
      (gen_random_uuid(), v_faculty_id, 'Hebrew Language and Literature')
    ON CONFLICT DO NOTHING;
  END IF;

  -- School of Art and Design
  SELECT id INTO v_faculty_id FROM faculties WHERE name = 'School of Art and Design' LIMIT 1;
  IF v_faculty_id IS NOT NULL THEN
    INSERT INTO majors (id, faculty_id, name) VALUES
      (gen_random_uuid(), v_faculty_id, 'Visual Arts'),
      (gen_random_uuid(), v_faculty_id, 'Graphic Design'),
      (gen_random_uuid(), v_faculty_id, 'Interior Design'),
      (gen_random_uuid(), v_faculty_id, 'Drama and Theatre Arts'),
      (gen_random_uuid(), v_faculty_id, 'Music')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;