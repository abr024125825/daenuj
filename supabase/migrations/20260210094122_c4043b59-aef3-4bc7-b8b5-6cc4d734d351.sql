
-- Step 1: Update existing references to use new IDs
-- First update the volunteer application's major to a temp value won't conflict
UPDATE volunteer_applications 
SET major_id = '6c56c40d-e581-48c6-b7c5-0e178f390a42',
    faculty_id = '4c519fa0-c907-4ec1-a6ec-df1e94fa46fb'
WHERE faculty_id = '4c519fa0-c907-4ec1-a6ec-df1e94fa46fb';
-- (no-op, just ensuring it stays)

-- Step 2: Rename old faculty temporarily to avoid name conflict
UPDATE faculties SET name = '_OLD_Engineering' WHERE id = '4c519fa0-c907-4ec1-a6ec-df1e94fa46fb';

-- Step 3: Insert all new faculties
INSERT INTO faculties (id, name) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Faculty of Medicine'),
  ('a1000001-0000-0000-0000-000000000002', 'Faculty of Dentistry'),
  ('a1000001-0000-0000-0000-000000000003', 'Faculty of Pharmacy'),
  ('a1000001-0000-0000-0000-000000000004', 'Faculty of Nursing'),
  ('a1000001-0000-0000-0000-000000000005', 'Faculty of Rehabilitation Sciences'),
  ('a1000001-0000-0000-0000-000000000006', 'Faculty of Engineering'),
  ('a1000001-0000-0000-0000-000000000007', 'Faculty of Science'),
  ('a1000001-0000-0000-0000-000000000008', 'Faculty of Agriculture'),
  ('a1000001-0000-0000-0000-000000000009', 'Faculty of Arts'),
  ('a1000001-0000-0000-0000-000000000010', 'Faculty of Business'),
  ('a1000001-0000-0000-0000-000000000011', 'Faculty of Law'),
  ('a1000001-0000-0000-0000-000000000012', 'Faculty of Sharia (Islamic Studies)'),
  ('a1000001-0000-0000-0000-000000000013', 'Faculty of Educational Sciences'),
  ('a1000001-0000-0000-0000-000000000014', 'Faculty of Physical Education'),
  ('a1000001-0000-0000-0000-000000000015', 'Faculty of Information Technology'),
  ('a1000001-0000-0000-0000-000000000016', 'Faculty of International Studies'),
  ('a1000001-0000-0000-0000-000000000017', 'Faculty of Graduate Studies'),
  ('a1000001-0000-0000-0000-000000000018', 'Faculty of Languages'),
  ('a1000001-0000-0000-0000-000000000019', 'King Abdullah II School for Information Technology'),
  ('a1000001-0000-0000-0000-000000000020', 'Faculty of Archaeology and Tourism');

-- Step 4: Insert new Computer Engineering major
INSERT INTO majors (id, faculty_id, name) VALUES
  ('b2000001-0000-0000-0000-000000000005', 'a1000001-0000-0000-0000-000000000006', 'Computer Engineering');

-- Step 5: Migrate volunteer_applications to new IDs
UPDATE volunteer_applications 
SET faculty_id = 'a1000001-0000-0000-0000-000000000006',
    major_id = 'b2000001-0000-0000-0000-000000000005'
WHERE faculty_id = '4c519fa0-c907-4ec1-a6ec-df1e94fa46fb';

-- Step 6: Delete old data (now unreferenced)
DELETE FROM majors WHERE id = '6c56c40d-e581-48c6-b7c5-0e178f390a42';
DELETE FROM faculties WHERE id = '4c519fa0-c907-4ec1-a6ec-df1e94fa46fb';

-- Step 7: Insert all remaining Engineering majors
INSERT INTO majors (faculty_id, name) VALUES
  ('a1000001-0000-0000-0000-000000000006', 'Civil Engineering'),
  ('a1000001-0000-0000-0000-000000000006', 'Electrical Engineering'),
  ('a1000001-0000-0000-0000-000000000006', 'Mechanical Engineering'),
  ('a1000001-0000-0000-0000-000000000006', 'Chemical Engineering'),
  ('a1000001-0000-0000-0000-000000000006', 'Architecture Engineering'),
  ('a1000001-0000-0000-0000-000000000006', 'Industrial Engineering'),
  ('a1000001-0000-0000-0000-000000000006', 'Mechatronics Engineering'),
  ('a1000001-0000-0000-0000-000000000006', 'Biomedical Engineering');

-- Step 8: Insert all other faculty majors
INSERT INTO majors (faculty_id, name) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Doctor of Medicine (MD)'),
  ('a1000001-0000-0000-0000-000000000001', 'Medical Laboratory Sciences'),
  ('a1000001-0000-0000-0000-000000000001', 'Radiological Sciences'),
  ('a1000001-0000-0000-0000-000000000002', 'Doctor of Dental Surgery (DDS)'),
  ('a1000001-0000-0000-0000-000000000002', 'Dental Hygiene'),
  ('a1000001-0000-0000-0000-000000000003', 'Doctor of Pharmacy (PharmD)'),
  ('a1000001-0000-0000-0000-000000000003', 'Pharmaceutical Sciences'),
  ('a1000001-0000-0000-0000-000000000004', 'Nursing'),
  ('a1000001-0000-0000-0000-000000000004', 'Midwifery'),
  ('a1000001-0000-0000-0000-000000000005', 'Physical Therapy'),
  ('a1000001-0000-0000-0000-000000000005', 'Occupational Therapy'),
  ('a1000001-0000-0000-0000-000000000005', 'Speech-Language Pathology'),
  ('a1000001-0000-0000-0000-000000000005', 'Prosthetics and Orthotics'),
  ('a1000001-0000-0000-0000-000000000007', 'Mathematics'),
  ('a1000001-0000-0000-0000-000000000007', 'Physics'),
  ('a1000001-0000-0000-0000-000000000007', 'Chemistry'),
  ('a1000001-0000-0000-0000-000000000007', 'Biological Sciences'),
  ('a1000001-0000-0000-0000-000000000007', 'Geology'),
  ('a1000001-0000-0000-0000-000000000007', 'Actuarial Science'),
  ('a1000001-0000-0000-0000-000000000007', 'Statistics'),
  ('a1000001-0000-0000-0000-000000000008', 'Plant Production'),
  ('a1000001-0000-0000-0000-000000000008', 'Animal Production'),
  ('a1000001-0000-0000-0000-000000000008', 'Nutrition and Food Technology'),
  ('a1000001-0000-0000-0000-000000000008', 'Land, Water and Environment'),
  ('a1000001-0000-0000-0000-000000000008', 'Agricultural Economics and Agribusiness'),
  ('a1000001-0000-0000-0000-000000000009', 'Arabic Language and Literature'),
  ('a1000001-0000-0000-0000-000000000009', 'English Language and Literature'),
  ('a1000001-0000-0000-0000-000000000009', 'History'),
  ('a1000001-0000-0000-0000-000000000009', 'Geography'),
  ('a1000001-0000-0000-0000-000000000009', 'Philosophy'),
  ('a1000001-0000-0000-0000-000000000009', 'Sociology'),
  ('a1000001-0000-0000-0000-000000000009', 'Psychology'),
  ('a1000001-0000-0000-0000-000000000009', 'Political Science'),
  ('a1000001-0000-0000-0000-000000000009', 'French Language and Literature'),
  ('a1000001-0000-0000-0000-000000000010', 'Accounting'),
  ('a1000001-0000-0000-0000-000000000010', 'Finance'),
  ('a1000001-0000-0000-0000-000000000010', 'Marketing'),
  ('a1000001-0000-0000-0000-000000000010', 'Business Administration'),
  ('a1000001-0000-0000-0000-000000000010', 'Public Administration'),
  ('a1000001-0000-0000-0000-000000000010', 'Management Information Systems'),
  ('a1000001-0000-0000-0000-000000000010', 'Business Economics'),
  ('a1000001-0000-0000-0000-000000000011', 'Law'),
  ('a1000001-0000-0000-0000-000000000012', 'Islamic Jurisprudence (Fiqh)'),
  ('a1000001-0000-0000-0000-000000000012', 'Quran and Islamic Studies'),
  ('a1000001-0000-0000-0000-000000000012', 'Islamic Banking and Finance'),
  ('a1000001-0000-0000-0000-000000000013', 'Classroom Teacher'),
  ('a1000001-0000-0000-0000-000000000013', 'Special Education'),
  ('a1000001-0000-0000-0000-000000000013', 'Counseling and Educational Psychology'),
  ('a1000001-0000-0000-0000-000000000013', 'Curriculum and Instruction'),
  ('a1000001-0000-0000-0000-000000000013', 'Early Childhood Education'),
  ('a1000001-0000-0000-0000-000000000014', 'Physical Education'),
  ('a1000001-0000-0000-0000-000000000014', 'Sport Management'),
  ('a1000001-0000-0000-0000-000000000014', 'Sport Rehabilitation'),
  ('a1000001-0000-0000-0000-000000000015', 'Computer Science'),
  ('a1000001-0000-0000-0000-000000000015', 'Computer Information Systems'),
  ('a1000001-0000-0000-0000-000000000015', 'Cybersecurity'),
  ('a1000001-0000-0000-0000-000000000015', 'Data Science and Artificial Intelligence'),
  ('a1000001-0000-0000-0000-000000000016', 'International Relations'),
  ('a1000001-0000-0000-0000-000000000016', 'Strategic Studies'),
  ('a1000001-0000-0000-0000-000000000018', 'Translation (English)'),
  ('a1000001-0000-0000-0000-000000000018', 'European Languages'),
  ('a1000001-0000-0000-0000-000000000018', 'Asian Languages (Korean, Chinese, Japanese)'),
  ('a1000001-0000-0000-0000-000000000018', 'Hebrew and Israeli Studies'),
  ('a1000001-0000-0000-0000-000000000019', 'Software Engineering'),
  ('a1000001-0000-0000-0000-000000000019', 'Computer Science'),
  ('a1000001-0000-0000-0000-000000000019', 'Business Information Technology'),
  ('a1000001-0000-0000-0000-000000000019', 'Computer Graphics and Animation'),
  ('a1000001-0000-0000-0000-000000000020', 'Archaeology'),
  ('a1000001-0000-0000-0000-000000000020', 'Tourism and Travel Management'),
  ('a1000001-0000-0000-0000-000000000020', 'Cultural Resource Management');

-- ============================================================
-- 9. FIX SYSTEM SETTINGS
-- ============================================================
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('auto_approve_registrations', '{"enabled": false}'::jsonb),
  ('email_notifications', '{"enabled": true}'::jsonb),
  ('exam_schedule_enabled', '{"enabled": false}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. FIX MISSING VOLUNTEER PROFILE
-- ============================================================
INSERT INTO profiles (user_id, email, first_name, last_name, role, is_active)
VALUES (
  '03abe203-d7ff-480a-8641-b593df74354c',
  'abr0241258@ju.edu.jo',
  'Ibrahim',
  'Hajeej',
  'volunteer',
  true
)
ON CONFLICT (user_id) DO UPDATE SET is_active = true;
