-- Insert University of Jordan Faculties
INSERT INTO public.faculties (name) VALUES
('كلية الطب'),
('كلية طب الأسنان'),
('كلية الصيدلة'),
('كلية التمريض'),
('كلية علوم التأهيل'),
('كلية العلوم'),
('كلية الهندسة'),
('كلية الزراعة'),
('كلية الحقوق'),
('كلية الأعمال'),
('كلية الاقتصاد والعلوم الإدارية'),
('كلية الآداب'),
('كلية الشريعة والدراسات الإسلامية'),
('كلية العلوم التربوية'),
('كلية التربية الرياضية'),
('كلية الملك عبدالله الثاني لتكنولوجيا المعلومات'),
('كلية اللغات الأجنبية'),
('كلية الدراسات العليا'),
('كلية الدراسات الدولية'),
('كلية الآثار والسياحة'),
('كلية الفنون والتصميم')
ON CONFLICT DO NOTHING;

-- Faculty of Medicine (كلية الطب)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['الطب العام', 'علوم المختبرات الطبية', 'الطب الشرعي', 'علم الأمراض'])
FROM public.faculties WHERE name = 'كلية الطب';

-- Faculty of Dentistry (كلية طب الأسنان)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['طب الأسنان', 'صحة الفم والأسنان', 'جراحة الفم والوجه والفكين'])
FROM public.faculties WHERE name = 'كلية طب الأسنان';

-- Faculty of Pharmacy (كلية الصيدلة)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['الصيدلة', 'الصيدلة السريرية', 'العلوم الصيدلانية'])
FROM public.faculties WHERE name = 'كلية الصيدلة';

-- Faculty of Nursing (كلية التمريض)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['التمريض', 'القبالة', 'تمريض صحة المجتمع', 'تمريض الأطفال'])
FROM public.faculties WHERE name = 'كلية التمريض';

-- Faculty of Rehabilitation Sciences (كلية علوم التأهيل)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['العلاج الطبيعي', 'العلاج الوظيفي', 'علوم السمع والنطق', 'الأطراف الصناعية'])
FROM public.faculties WHERE name = 'كلية علوم التأهيل';

-- Faculty of Science (كلية العلوم)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['الرياضيات', 'الفيزياء', 'الكيمياء', 'العلوم الحياتية', 'الجيولوجيا', 'الإحصاء', 'علم الفلك'])
FROM public.faculties WHERE name = 'كلية العلوم';

-- Faculty of Engineering (كلية الهندسة)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['الهندسة المدنية', 'الهندسة الكهربائية', 'الهندسة الميكانيكية', 'الهندسة الكيميائية', 'هندسة العمارة', 'الهندسة الصناعية', 'هندسة الميكاترونكس', 'هندسة الحاسوب', 'هندسة الاتصالات', 'الهندسة البيئية', 'الهندسة الطبية الحيوية'])
FROM public.faculties WHERE name = 'كلية الهندسة';

-- Faculty of Agriculture (كلية الزراعة)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['الإنتاج النباتي', 'الإنتاج الحيواني', 'التربة والري والبيئة الزراعية', 'الاقتصاد الزراعي', 'وقاية النبات', 'التغذية والتصنيع الغذائي', 'هندسة المياه والبيئة'])
FROM public.faculties WHERE name = 'كلية الزراعة';

-- Faculty of Law (كلية الحقوق)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['القانون', 'القانون الخاص', 'القانون العام', 'القانون الدولي'])
FROM public.faculties WHERE name = 'كلية الحقوق';

-- Faculty of Business (كلية الأعمال)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['إدارة الأعمال', 'المحاسبة', 'التمويل', 'التسويق', 'نظم المعلومات الإدارية', 'إدارة الموارد البشرية', 'إدارة الفنادق والسياحة'])
FROM public.faculties WHERE name = 'كلية الأعمال';

-- Faculty of Economics (كلية الاقتصاد والعلوم الإدارية)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['الاقتصاد', 'العلوم المالية والمصرفية', 'الإدارة العامة', 'العلوم السياسية'])
FROM public.faculties WHERE name = 'كلية الاقتصاد والعلوم الإدارية';

-- Faculty of Arts (كلية الآداب)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['اللغة العربية وآدابها', 'اللغة الإنجليزية وآدابها', 'التاريخ', 'الجغرافيا', 'الفلسفة', 'علم الاجتماع', 'علم النفس', 'الخدمة الاجتماعية'])
FROM public.faculties WHERE name = 'كلية الآداب';

-- Faculty of Sharia (كلية الشريعة والدراسات الإسلامية)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['الفقه وأصوله', 'أصول الدين', 'الدراسات الإسلامية', 'الاقتصاد الإسلامي'])
FROM public.faculties WHERE name = 'كلية الشريعة والدراسات الإسلامية';

-- Faculty of Educational Sciences (كلية العلوم التربوية)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['معلم الصف', 'الإرشاد والتربية الخاصة', 'المناهج والتدريس', 'الإدارة التربوية', 'علم النفس التربوي', 'تكنولوجيا التعليم', 'التربية الخاصة'])
FROM public.faculties WHERE name = 'كلية العلوم التربوية';

-- Faculty of Physical Education (كلية التربية الرياضية)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['التربية الرياضية', 'التدريب الرياضي', 'الإدارة الرياضية والترويحية', 'إصابات الملاعب'])
FROM public.faculties WHERE name = 'كلية التربية الرياضية';

-- King Abdullah II Faculty of IT (كلية الملك عبدالله الثاني لتكنولوجيا المعلومات)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['علم الحاسوب', 'نظم المعلومات الحاسوبية', 'هندسة البرمجيات', 'الأمن السيبراني', 'علم البيانات والذكاء الاصطناعي'])
FROM public.faculties WHERE name = 'كلية الملك عبدالله الثاني لتكنولوجيا المعلومات';

-- Faculty of Foreign Languages (كلية اللغات الأجنبية)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['اللغة الفرنسية وآدابها', 'اللغة الألمانية وآدابها', 'اللغة الإسبانية وآدابها', 'اللغة الكورية وآدابها', 'اللغة التركية وآدابها', 'اللغة الصينية وآدابها', 'الترجمة'])
FROM public.faculties WHERE name = 'كلية اللغات الأجنبية';

-- Faculty of Graduate Studies (كلية الدراسات العليا)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['دراسات عليا متعددة التخصصات'])
FROM public.faculties WHERE name = 'كلية الدراسات العليا';

-- Faculty of International Studies (كلية الدراسات الدولية)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['العلاقات الدولية والدراسات الاستراتيجية', 'الدراسات الدبلوماسية'])
FROM public.faculties WHERE name = 'كلية الدراسات الدولية';

-- Faculty of Archaeology and Tourism (كلية الآثار والسياحة)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['الآثار', 'إدارة الموارد التراثية والسياحية', 'السياحة والفندقة', 'حفظ وصيانة الآثار'])
FROM public.faculties WHERE name = 'كلية الآثار والسياحة';

-- Faculty of Arts and Design (كلية الفنون والتصميم)
INSERT INTO public.majors (faculty_id, name)
SELECT id, unnest(ARRAY['التصميم الجرافيكي', 'التصميم الداخلي', 'الفنون البصرية', 'الموسيقى', 'المسرح', 'الفنون السينمائية والتلفزيونية'])
FROM public.faculties WHERE name = 'كلية الفنون والتصميم';