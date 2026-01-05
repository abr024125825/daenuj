-- First, add a 'withdrawn' status to the application_status enum if not exists
-- Since we can't easily alter enum in Supabase, we'll use a separate approach
-- For now, we'll use the withdrawal_reason field to track withdrawn volunteers

-- Seed University of Jordan Faculties
INSERT INTO public.faculties (name) VALUES
('Faculty of Medicine'),
('Faculty of Dentistry'),
('Faculty of Pharmacy'),
('Faculty of Nursing'),
('Faculty of Rehabilitation Sciences'),
('Faculty of Science'),
('Faculty of Engineering'),
('Faculty of Agriculture'),
('Faculty of Law'),
('Faculty of Business'),
('Faculty of Economics and Administrative Sciences'),
('Faculty of Arts'),
('Faculty of Sharia (Islamic Studies)'),
('Faculty of Educational Sciences'),
('Faculty of Physical Education'),
('Faculty of Information Technology'),
('Faculty of Foreign Languages'),
('Faculty of Graduate Studies'),
('Faculty of International Studies'),
('Faculty of Archaeology and Tourism')
ON CONFLICT DO NOTHING;

-- Seed Majors for each Faculty

-- Faculty of Medicine
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Medicine', 'Medical Laboratory Sciences'])
FROM public.faculties WHERE name = 'Faculty of Medicine';

-- Faculty of Dentistry
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Dentistry', 'Dental Hygiene'])
FROM public.faculties WHERE name = 'Faculty of Dentistry';

-- Faculty of Pharmacy
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Pharmacy', 'Clinical Pharmacy'])
FROM public.faculties WHERE name = 'Faculty of Pharmacy';

-- Faculty of Nursing
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Nursing', 'Midwifery'])
FROM public.faculties WHERE name = 'Faculty of Nursing';

-- Faculty of Rehabilitation Sciences
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Physical Therapy', 'Occupational Therapy', 'Speech-Language Pathology', 'Prosthetics and Orthotics'])
FROM public.faculties WHERE name = 'Faculty of Rehabilitation Sciences';

-- Faculty of Science
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Mathematics', 'Physics', 'Chemistry', 'Biological Sciences', 'Geology', 'Statistics', 'Actuarial Science'])
FROM public.faculties WHERE name = 'Faculty of Science';

-- Faculty of Engineering
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Architecture', 'Computer Engineering', 'Mechatronics Engineering', 'Industrial Engineering', 'Biomedical Engineering'])
FROM public.faculties WHERE name = 'Faculty of Engineering';

-- Faculty of Agriculture
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Plant Production', 'Animal Production', 'Soil and Water Sciences', 'Agricultural Economics', 'Food Science and Technology', 'Nutrition and Food Processing'])
FROM public.faculties WHERE name = 'Faculty of Agriculture';

-- Faculty of Law
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Law', 'Private Law', 'Public Law'])
FROM public.faculties WHERE name = 'Faculty of Law';

-- Faculty of Business
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Accounting', 'Finance', 'Marketing', 'Management', 'Business Administration', 'Management Information Systems', 'E-Business'])
FROM public.faculties WHERE name = 'Faculty of Business';

-- Faculty of Economics and Administrative Sciences
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Economics', 'Political Science', 'Public Administration', 'Banking and Finance'])
FROM public.faculties WHERE name = 'Faculty of Economics and Administrative Sciences';

-- Faculty of Arts
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Arabic Language', 'English Language', 'History', 'Geography', 'Philosophy', 'Sociology', 'Psychology', 'Journalism and Media'])
FROM public.faculties WHERE name = 'Faculty of Arts';

-- Faculty of Sharia (Islamic Studies)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Islamic Studies', 'Islamic Jurisprudence (Fiqh)', 'Quran and Islamic Studies', 'Islamic Banking and Finance'])
FROM public.faculties WHERE name = 'Faculty of Sharia (Islamic Studies)';

-- Faculty of Educational Sciences
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Classroom Teacher', 'Special Education', 'Educational Psychology', 'Curriculum and Instruction', 'Educational Administration', 'Child Education'])
FROM public.faculties WHERE name = 'Faculty of Educational Sciences';

-- Faculty of Physical Education
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Physical Education', 'Sports Management', 'Sports Training'])
FROM public.faculties WHERE name = 'Faculty of Physical Education';

-- Faculty of Information Technology
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Computer Science', 'Software Engineering', 'Computer Information Systems', 'Cybersecurity', 'Data Science', 'Artificial Intelligence'])
FROM public.faculties WHERE name = 'Faculty of Information Technology';

-- Faculty of Foreign Languages
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['French Language', 'Spanish Language', 'German Language', 'Italian Language', 'Turkish Language', 'Chinese Language', 'Korean Language', 'Japanese Language'])
FROM public.faculties WHERE name = 'Faculty of Foreign Languages';

-- Faculty of International Studies
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['International Relations', 'Strategic Studies', 'Peace and Conflict Studies'])
FROM public.faculties WHERE name = 'Faculty of International Studies';

-- Faculty of Archaeology and Tourism
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['Archaeology', 'Tourism and Hospitality', 'Cultural Resource Management'])
FROM public.faculties WHERE name = 'Faculty of Archaeology and Tourism';

-- Create RLS policy for badge_transactions delete if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'badge_transactions' 
        AND policyname = 'Admins can delete badge transactions'
    ) THEN
        CREATE POLICY "Admins can delete badge transactions"
        ON public.badge_transactions
        FOR DELETE
        USING (has_role(auth.uid(), 'admin'::user_role));
    END IF;
END $$;