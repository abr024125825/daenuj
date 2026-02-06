-- First clear existing data (if any)
DELETE FROM majors;
DELETE FROM faculties;

-- Insert all University of Jordan Faculties
INSERT INTO faculties (id, name) VALUES
  (gen_random_uuid(), 'Faculty of Arts'),
  (gen_random_uuid(), 'Faculty of Business'),
  (gen_random_uuid(), 'Faculty of Sharia (Islamic Studies)'),
  (gen_random_uuid(), 'Faculty of Educational Sciences'),
  (gen_random_uuid(), 'Faculty of Law'),
  (gen_random_uuid(), 'Faculty of Physical Education'),
  (gen_random_uuid(), 'Faculty of Arts and Design'),
  (gen_random_uuid(), 'Faculty of Foreign Languages'),
  (gen_random_uuid(), 'Faculty of Archaeology and Tourism'),
  (gen_random_uuid(), 'School of International Studies'),
  (gen_random_uuid(), 'Faculty of Science'),
  (gen_random_uuid(), 'Faculty of Agriculture'),
  (gen_random_uuid(), 'Faculty of Engineering'),
  (gen_random_uuid(), 'Faculty of Medicine'),
  (gen_random_uuid(), 'Faculty of Nursing'),
  (gen_random_uuid(), 'Faculty of Pharmacy'),
  (gen_random_uuid(), 'Faculty of Dentistry'),
  (gen_random_uuid(), 'Faculty of Rehabilitation Sciences'),
  (gen_random_uuid(), 'King Abdullah II School of Information Technology'),
  (gen_random_uuid(), 'Faculty of Graduate Studies');

-- Now insert majors for each faculty
-- Faculty of Arts
INSERT INTO majors (faculty_id, name) 
SELECT id, unnest(ARRAY[
  'Arabic Language and Literature',
  'English Language and Literature', 
  'History',
  'Geography',
  'Philosophy',
  'Sociology',
  'Psychology',
  'French Language and Literature',
  'Spanish Language',
  'German Language'
]) FROM faculties WHERE name = 'Faculty of Arts';

-- Faculty of Business
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Business Administration',
  'Accounting',
  'Finance',
  'Marketing',
  'Management Information Systems',
  'Business Economics',
  'Hospitality and Tourism Management',
  'Public Administration'
]) FROM faculties WHERE name = 'Faculty of Business';

-- Faculty of Sharia
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Islamic Studies',
  'Jurisprudence and Legal Theory',
  'Islamic Economics and Banking'
]) FROM faculties WHERE name = 'Faculty of Sharia (Islamic Studies)';

-- Faculty of Educational Sciences
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Counseling and Educational Psychology',
  'Curriculum and Instruction',
  'Educational Administration',
  'Special Education',
  'Early Childhood Education',
  'Classroom Teacher'
]) FROM faculties WHERE name = 'Faculty of Educational Sciences';

-- Faculty of Law
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Law',
  'Private Law',
  'Public Law',
  'International Law'
]) FROM faculties WHERE name = 'Faculty of Law';

-- Faculty of Physical Education
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Physical Education',
  'Sports Management',
  'Sports Rehabilitation'
]) FROM faculties WHERE name = 'Faculty of Physical Education';

-- Faculty of Arts and Design
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Graphic Design',
  'Interior Design',
  'Drama and Theatre',
  'Music',
  'Visual Arts',
  'Fashion Design',
  'Animation and Multimedia'
]) FROM faculties WHERE name = 'Faculty of Arts and Design';

-- Faculty of Foreign Languages
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'English Language',
  'French Language',
  'Spanish Language',
  'German Language',
  'Italian Language',
  'Russian Language',
  'Chinese Language',
  'Turkish Language',
  'Korean Language',
  'Japanese Language',
  'Translation'
]) FROM faculties WHERE name = 'Faculty of Foreign Languages';

-- Faculty of Archaeology and Tourism
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Archaeology',
  'Tourism Management',
  'Cultural Resource Management',
  'Heritage Conservation'
]) FROM faculties WHERE name = 'Faculty of Archaeology and Tourism';

-- School of International Studies
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Political Science',
  'International Relations',
  'Strategic Studies',
  'Diplomatic Studies'
]) FROM faculties WHERE name = 'School of International Studies';

-- Faculty of Science
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biological Sciences',
  'Geology',
  'Statistics',
  'Actuarial Science',
  'Biotechnology'
]) FROM faculties WHERE name = 'Faculty of Science';

-- Faculty of Agriculture
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Plant Production',
  'Animal Production',
  'Soil, Water and Environment',
  'Agricultural Economics and Agribusiness',
  'Nutrition and Food Technology',
  'Family Sciences',
  'Land Management and Environment'
]) FROM faculties WHERE name = 'Faculty of Agriculture';

-- Faculty of Engineering
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'Computer Engineering',
  'Architecture',
  'Industrial Engineering',
  'Mechatronics Engineering',
  'Biomedical Engineering',
  'Environmental Engineering'
]) FROM faculties WHERE name = 'Faculty of Engineering';

-- Faculty of Medicine
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Medicine (MD)',
  'Medical Laboratory Sciences',
  'Radiology and Medical Imaging'
]) FROM faculties WHERE name = 'Faculty of Medicine';

-- Faculty of Nursing
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Nursing',
  'Midwifery'
]) FROM faculties WHERE name = 'Faculty of Nursing';

-- Faculty of Pharmacy
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Pharmacy (PharmD)',
  'Clinical Pharmacy'
]) FROM faculties WHERE name = 'Faculty of Pharmacy';

-- Faculty of Dentistry
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Dentistry (DDS)'
]) FROM faculties WHERE name = 'Faculty of Dentistry';

-- Faculty of Rehabilitation Sciences
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Physical Therapy',
  'Occupational Therapy',
  'Speech-Language Pathology',
  'Hearing and Speech Sciences',
  'Prosthetics and Orthotics'
]) FROM faculties WHERE name = 'Faculty of Rehabilitation Sciences';

-- King Abdullah II School of Information Technology
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Computer Science',
  'Software Engineering',
  'Computer Information Systems',
  'Cybersecurity',
  'Data Science and Artificial Intelligence',
  'Business Information Technology'
]) FROM faculties WHERE name = 'King Abdullah II School of Information Technology';

-- Faculty of Graduate Studies
INSERT INTO majors (faculty_id, name)
SELECT id, unnest(ARRAY[
  'Masters Programs',
  'PhD Programs'
]) FROM faculties WHERE name = 'Faculty of Graduate Studies';