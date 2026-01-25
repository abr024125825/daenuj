-- Update existing Arabic faculty names to English
UPDATE public.faculties SET name = 'Faculty of Medicine' WHERE name = 'كلية الطب';
UPDATE public.faculties SET name = 'Faculty of Dentistry' WHERE name = 'كلية طب الأسنان';
UPDATE public.faculties SET name = 'Faculty of Pharmacy' WHERE name = 'كلية الصيدلة';
UPDATE public.faculties SET name = 'Faculty of Nursing' WHERE name = 'كلية التمريض';
UPDATE public.faculties SET name = 'Faculty of Rehabilitation Sciences' WHERE name = 'كلية علوم التأهيل';
UPDATE public.faculties SET name = 'Faculty of Science' WHERE name = 'كلية العلوم';
UPDATE public.faculties SET name = 'Faculty of Engineering' WHERE name = 'كلية الهندسة';
UPDATE public.faculties SET name = 'Faculty of Agriculture' WHERE name = 'كلية الزراعة';
UPDATE public.faculties SET name = 'Faculty of Law' WHERE name = 'كلية الحقوق';
UPDATE public.faculties SET name = 'Faculty of Business' WHERE name = 'كلية الأعمال';
UPDATE public.faculties SET name = 'Faculty of Economics and Administrative Sciences' WHERE name = 'كلية الاقتصاد والعلوم الإدارية';
UPDATE public.faculties SET name = 'Faculty of Arts' WHERE name = 'كلية الآداب';
UPDATE public.faculties SET name = 'Faculty of Sharia and Islamic Studies' WHERE name = 'كلية الشريعة والدراسات الإسلامية';
UPDATE public.faculties SET name = 'Faculty of Educational Sciences' WHERE name = 'كلية العلوم التربوية';
UPDATE public.faculties SET name = 'Faculty of Physical Education' WHERE name = 'كلية التربية الرياضية';
UPDATE public.faculties SET name = 'King Abdullah II School of Information Technology' WHERE name = 'كلية الملك عبدالله الثاني لتكنولوجيا المعلومات';
UPDATE public.faculties SET name = 'Faculty of Foreign Languages' WHERE name = 'كلية اللغات الأجنبية';
UPDATE public.faculties SET name = 'Faculty of Graduate Studies' WHERE name = 'كلية الدراسات العليا';
UPDATE public.faculties SET name = 'Faculty of International Studies' WHERE name = 'كلية الدراسات الدولية';
UPDATE public.faculties SET name = 'Faculty of Archaeology and Tourism' WHERE name = 'كلية الآثار والسياحة';
UPDATE public.faculties SET name = 'Faculty of Arts and Design' WHERE name = 'كلية الفنون والتصميم';

-- Update existing Arabic major names to English
-- Medicine
UPDATE public.majors SET name = 'Medicine' WHERE name = 'الطب العام';
UPDATE public.majors SET name = 'Medical Laboratory Sciences' WHERE name = 'علوم المختبرات الطبية';
UPDATE public.majors SET name = 'Forensic Medicine' WHERE name = 'الطب الشرعي';
UPDATE public.majors SET name = 'Pathology' WHERE name = 'علم الأمراض';

-- Dentistry
UPDATE public.majors SET name = 'Dentistry' WHERE name = 'طب الأسنان';
UPDATE public.majors SET name = 'Dental Hygiene' WHERE name = 'صحة الفم والأسنان';
UPDATE public.majors SET name = 'Oral and Maxillofacial Surgery' WHERE name = 'جراحة الفم والوجه والفكين';

-- Pharmacy
UPDATE public.majors SET name = 'Pharmacy' WHERE name = 'الصيدلة';
UPDATE public.majors SET name = 'Clinical Pharmacy' WHERE name = 'الصيدلة السريرية';
UPDATE public.majors SET name = 'Pharmaceutical Sciences' WHERE name = 'العلوم الصيدلانية';

-- Nursing
UPDATE public.majors SET name = 'Nursing' WHERE name = 'التمريض';
UPDATE public.majors SET name = 'Midwifery' WHERE name = 'القبالة';
UPDATE public.majors SET name = 'Community Health Nursing' WHERE name = 'تمريض صحة المجتمع';
UPDATE public.majors SET name = 'Pediatric Nursing' WHERE name = 'تمريض الأطفال';

-- Rehabilitation Sciences
UPDATE public.majors SET name = 'Physical Therapy' WHERE name = 'العلاج الطبيعي';
UPDATE public.majors SET name = 'Occupational Therapy' WHERE name = 'العلاج الوظيفي';
UPDATE public.majors SET name = 'Speech and Hearing Sciences' WHERE name = 'علوم السمع والنطق';
UPDATE public.majors SET name = 'Prosthetics and Orthotics' WHERE name = 'الأطراف الصناعية';

-- Science
UPDATE public.majors SET name = 'Mathematics' WHERE name = 'الرياضيات';
UPDATE public.majors SET name = 'Physics' WHERE name = 'الفيزياء';
UPDATE public.majors SET name = 'Chemistry' WHERE name = 'الكيمياء';
UPDATE public.majors SET name = 'Biological Sciences' WHERE name = 'العلوم الحياتية';
UPDATE public.majors SET name = 'Geology' WHERE name = 'الجيولوجيا';
UPDATE public.majors SET name = 'Statistics' WHERE name = 'الإحصاء';
UPDATE public.majors SET name = 'Astronomy' WHERE name = 'علم الفلك';

-- Engineering
UPDATE public.majors SET name = 'Civil Engineering' WHERE name = 'الهندسة المدنية';
UPDATE public.majors SET name = 'Electrical Engineering' WHERE name = 'الهندسة الكهربائية';
UPDATE public.majors SET name = 'Mechanical Engineering' WHERE name = 'الهندسة الميكانيكية';
UPDATE public.majors SET name = 'Chemical Engineering' WHERE name = 'الهندسة الكيميائية';
UPDATE public.majors SET name = 'Architecture' WHERE name = 'هندسة العمارة';
UPDATE public.majors SET name = 'Industrial Engineering' WHERE name = 'الهندسة الصناعية';
UPDATE public.majors SET name = 'Mechatronics Engineering' WHERE name = 'هندسة الميكاترونكس';
UPDATE public.majors SET name = 'Computer Engineering' WHERE name = 'هندسة الحاسوب';
UPDATE public.majors SET name = 'Communications Engineering' WHERE name = 'هندسة الاتصالات';
UPDATE public.majors SET name = 'Environmental Engineering' WHERE name = 'الهندسة البيئية';
UPDATE public.majors SET name = 'Biomedical Engineering' WHERE name = 'الهندسة الطبية الحيوية';

-- Agriculture
UPDATE public.majors SET name = 'Plant Production' WHERE name = 'الإنتاج النباتي';
UPDATE public.majors SET name = 'Animal Production' WHERE name = 'الإنتاج الحيواني';
UPDATE public.majors SET name = 'Soil, Water and Agricultural Environment' WHERE name = 'التربة والري والبيئة الزراعية';
UPDATE public.majors SET name = 'Agricultural Economics' WHERE name = 'الاقتصاد الزراعي';
UPDATE public.majors SET name = 'Plant Protection' WHERE name = 'وقاية النبات';
UPDATE public.majors SET name = 'Nutrition and Food Technology' WHERE name = 'التغذية والتصنيع الغذائي';
UPDATE public.majors SET name = 'Water and Environmental Engineering' WHERE name = 'هندسة المياه والبيئة';

-- Law
UPDATE public.majors SET name = 'Law' WHERE name = 'القانون';
UPDATE public.majors SET name = 'Private Law' WHERE name = 'القانون الخاص';
UPDATE public.majors SET name = 'Public Law' WHERE name = 'القانون العام';
UPDATE public.majors SET name = 'International Law' WHERE name = 'القانون الدولي';

-- Business
UPDATE public.majors SET name = 'Business Administration' WHERE name = 'إدارة الأعمال';
UPDATE public.majors SET name = 'Accounting' WHERE name = 'المحاسبة';
UPDATE public.majors SET name = 'Finance' WHERE name = 'التمويل';
UPDATE public.majors SET name = 'Marketing' WHERE name = 'التسويق';
UPDATE public.majors SET name = 'Management Information Systems' WHERE name = 'نظم المعلومات الإدارية';
UPDATE public.majors SET name = 'Human Resources Management' WHERE name = 'إدارة الموارد البشرية';
UPDATE public.majors SET name = 'Hotel and Tourism Management' WHERE name = 'إدارة الفنادق والسياحة';

-- Economics
UPDATE public.majors SET name = 'Economics' WHERE name = 'الاقتصاد';
UPDATE public.majors SET name = 'Banking and Financial Sciences' WHERE name = 'العلوم المالية والمصرفية';
UPDATE public.majors SET name = 'Public Administration' WHERE name = 'الإدارة العامة';
UPDATE public.majors SET name = 'Political Science' WHERE name = 'العلوم السياسية';

-- Arts
UPDATE public.majors SET name = 'Arabic Language and Literature' WHERE name = 'اللغة العربية وآدابها';
UPDATE public.majors SET name = 'English Language and Literature' WHERE name = 'اللغة الإنجليزية وآدابها';
UPDATE public.majors SET name = 'History' WHERE name = 'التاريخ';
UPDATE public.majors SET name = 'Geography' WHERE name = 'الجغرافيا';
UPDATE public.majors SET name = 'Philosophy' WHERE name = 'الفلسفة';
UPDATE public.majors SET name = 'Sociology' WHERE name = 'علم الاجتماع';
UPDATE public.majors SET name = 'Psychology' WHERE name = 'علم النفس';
UPDATE public.majors SET name = 'Social Work' WHERE name = 'الخدمة الاجتماعية';

-- Sharia
UPDATE public.majors SET name = 'Islamic Jurisprudence' WHERE name = 'الفقه وأصوله';
UPDATE public.majors SET name = 'Islamic Theology' WHERE name = 'أصول الدين';
UPDATE public.majors SET name = 'Islamic Studies' WHERE name = 'الدراسات الإسلامية';
UPDATE public.majors SET name = 'Islamic Economics' WHERE name = 'الاقتصاد الإسلامي';

-- Educational Sciences
UPDATE public.majors SET name = 'Classroom Teacher' WHERE name = 'معلم الصف';
UPDATE public.majors SET name = 'Counseling and Special Education' WHERE name = 'الإرشاد والتربية الخاصة';
UPDATE public.majors SET name = 'Curriculum and Instruction' WHERE name = 'المناهج والتدريس';
UPDATE public.majors SET name = 'Educational Administration' WHERE name = 'الإدارة التربوية';
UPDATE public.majors SET name = 'Educational Psychology' WHERE name = 'علم النفس التربوي';
UPDATE public.majors SET name = 'Educational Technology' WHERE name = 'تكنولوجيا التعليم';
UPDATE public.majors SET name = 'Special Education' WHERE name = 'التربية الخاصة';

-- Physical Education
UPDATE public.majors SET name = 'Physical Education' WHERE name = 'التربية الرياضية';
UPDATE public.majors SET name = 'Sports Training' WHERE name = 'التدريب الرياضي';
UPDATE public.majors SET name = 'Sports and Recreation Management' WHERE name = 'الإدارة الرياضية والترويحية';
UPDATE public.majors SET name = 'Sports Injuries' WHERE name = 'إصابات الملاعب';

-- IT
UPDATE public.majors SET name = 'Computer Science' WHERE name = 'علم الحاسوب';
UPDATE public.majors SET name = 'Computer Information Systems' WHERE name = 'نظم المعلومات الحاسوبية';
UPDATE public.majors SET name = 'Software Engineering' WHERE name = 'هندسة البرمجيات';
UPDATE public.majors SET name = 'Cybersecurity' WHERE name = 'الأمن السيبراني';
UPDATE public.majors SET name = 'Data Science and Artificial Intelligence' WHERE name = 'علم البيانات والذكاء الاصطناعي';

-- Foreign Languages
UPDATE public.majors SET name = 'French Language and Literature' WHERE name = 'اللغة الفرنسية وآدابها';
UPDATE public.majors SET name = 'German Language and Literature' WHERE name = 'اللغة الألمانية وآدابها';
UPDATE public.majors SET name = 'Spanish Language and Literature' WHERE name = 'اللغة الإسبانية وآدابها';
UPDATE public.majors SET name = 'Korean Language and Literature' WHERE name = 'اللغة الكورية وآدابها';
UPDATE public.majors SET name = 'Turkish Language and Literature' WHERE name = 'اللغة التركية وآدابها';
UPDATE public.majors SET name = 'Chinese Language and Literature' WHERE name = 'اللغة الصينية وآدابها';
UPDATE public.majors SET name = 'Translation' WHERE name = 'الترجمة';

-- Graduate Studies
UPDATE public.majors SET name = 'Multidisciplinary Graduate Studies' WHERE name = 'دراسات عليا متعددة التخصصات';

-- International Studies
UPDATE public.majors SET name = 'International Relations and Strategic Studies' WHERE name = 'العلاقات الدولية والدراسات الاستراتيجية';
UPDATE public.majors SET name = 'Diplomatic Studies' WHERE name = 'الدراسات الدبلوماسية';

-- Archaeology and Tourism
UPDATE public.majors SET name = 'Archaeology' WHERE name = 'الآثار';
UPDATE public.majors SET name = 'Heritage and Tourism Resources Management' WHERE name = 'إدارة الموارد التراثية والسياحية';
UPDATE public.majors SET name = 'Tourism and Hospitality' WHERE name = 'السياحة والفندقة';
UPDATE public.majors SET name = 'Conservation and Restoration' WHERE name = 'حفظ وصيانة الآثار';

-- Arts and Design
UPDATE public.majors SET name = 'Graphic Design' WHERE name = 'التصميم الجرافيكي';
UPDATE public.majors SET name = 'Interior Design' WHERE name = 'التصميم الداخلي';
UPDATE public.majors SET name = 'Visual Arts' WHERE name = 'الفنون البصرية';
UPDATE public.majors SET name = 'Music' WHERE name = 'الموسيقى';
UPDATE public.majors SET name = 'Theatre' WHERE name = 'المسرح';
UPDATE public.majors SET name = 'Film and Television Arts' WHERE name = 'الفنون السينمائية والتلفزيونية';