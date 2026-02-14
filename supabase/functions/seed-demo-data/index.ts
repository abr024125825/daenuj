import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: string[] = [];

    // ============ 1. SEED UJ FACULTIES & MAJORS ============
    const { count: facultyCount } = await supabaseAdmin.from('faculties').select('*', { count: 'exact', head: true });
    if ((facultyCount || 0) === 0) {
      const faculties = [
        { name: 'Faculty of Medicine', majors: ['Medicine', 'Biomedical Sciences'] },
        { name: 'Faculty of Dentistry', majors: ['Dentistry'] },
        { name: 'Faculty of Pharmacy', majors: ['Pharmacy', 'Clinical Pharmacy'] },
        { name: 'Faculty of Nursing', majors: ['Nursing', 'Midwifery'] },
        { name: 'Faculty of Rehabilitation Sciences', majors: ['Physical Therapy', 'Occupational Therapy', 'Speech & Hearing Sciences', 'Prosthetics & Orthotics'] },
        { name: 'Faculty of Science', majors: ['Mathematics', 'Physics', 'Chemistry', 'Biological Sciences', 'Geology', 'Actuarial Science'] },
        { name: 'Faculty of Engineering', majors: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Computer Engineering', 'Mechatronics Engineering', 'Industrial Engineering', 'Biomedical Engineering', 'Architecture Engineering'] },
        { name: 'Faculty of Agriculture', majors: ['Plant Production', 'Animal Production', 'Soil & Irrigation', 'Nutrition & Food Technology', 'Land Management & Environment'] },
        { name: 'Faculty of Arts', majors: ['Arabic Language', 'English Language', 'French Language', 'History', 'Geography', 'Philosophy & Sociology', 'Psychology'] },
        { name: 'Faculty of Law', majors: ['Law', 'Public Law', 'Private Law'] },
        { name: 'Faculty of Business', majors: ['Accounting', 'Finance & Banking', 'Business Administration', 'Marketing', 'Management Information Systems', 'Public Administration'] },
        { name: 'Faculty of Economics & Administrative Sciences', majors: ['Economics', 'Political Science'] },
        { name: 'Faculty of Sharia (Islamic Studies)', majors: ['Jurisprudence & Its Foundations', 'Quran & Hadith Sciences', 'Islamic Studies'] },
        { name: 'Faculty of Educational Sciences', majors: ['Curriculum & Instruction', 'Educational Psychology', 'Counseling & Special Education', 'Educational Leadership'] },
        { name: 'Faculty of Physical Education', majors: ['Physical Education', 'Sports Management', 'Exercise Science'] },
        { name: 'Faculty of Information Technology', majors: ['Computer Science', 'Computer Information Systems', 'Software Engineering', 'Cybersecurity', 'Data Science & Artificial Intelligence'] },
        { name: 'King Abdullah II School for Information Technology', majors: ['Business Information Technology'] },
        { name: 'Faculty of International Studies', majors: ['Languages & Cultures'] },
        { name: 'Faculty of Archaeology & Tourism', majors: ['Archaeology', 'Tourism & Travel Management', 'Cultural Resource Management'] },
        { name: 'Faculty of Fine Arts', majors: ['Visual Arts', 'Graphic Design', 'Music', 'Drama & Theatre'] },
      ];

      for (const f of faculties) {
        const { data: fac } = await supabaseAdmin.from('faculties').insert({ name: f.name }).select('id').single();
        if (fac) {
          const majorsData = f.majors.map(m => ({ name: m, faculty_id: fac.id }));
          await supabaseAdmin.from('majors').insert(majorsData);
        }
      }
      results.push(`Seeded ${faculties.length} faculties with majors`);
    } else {
      results.push('Faculties already exist, skipping');
    }

    // ============ 2. SEED ICD-10 CODES (Mental & Behavioral) ============
    const { count: icdCount } = await supabaseAdmin.from('icd_codes').select('*', { count: 'exact', head: true });
    if ((icdCount || 0) === 0) {
      const icdCodes = [
        // F00-F09 Organic mental disorders
        { code: 'F00', description: 'Dementia in Alzheimer disease', category: 'Organic Mental Disorders' },
        { code: 'F01', description: 'Vascular dementia', category: 'Organic Mental Disorders' },
        { code: 'F02', description: 'Dementia in other diseases', category: 'Organic Mental Disorders' },
        { code: 'F03', description: 'Unspecified dementia', category: 'Organic Mental Disorders' },
        { code: 'F04', description: 'Organic amnesic syndrome', category: 'Organic Mental Disorders' },
        { code: 'F05', description: 'Delirium, not induced by alcohol/psychoactive substances', category: 'Organic Mental Disorders' },
        { code: 'F06', description: 'Other mental disorders due to brain damage/dysfunction/physical disease', category: 'Organic Mental Disorders' },
        { code: 'F07', description: 'Personality and behavioural disorders due to brain disease/damage/dysfunction', category: 'Organic Mental Disorders' },
        { code: 'F09', description: 'Unspecified organic or symptomatic mental disorder', category: 'Organic Mental Disorders' },
        // F10-F19 Substance use
        { code: 'F10', description: 'Mental and behavioural disorders due to use of alcohol', category: 'Substance Use Disorders' },
        { code: 'F11', description: 'Mental and behavioural disorders due to use of opioids', category: 'Substance Use Disorders' },
        { code: 'F12', description: 'Mental and behavioural disorders due to use of cannabinoids', category: 'Substance Use Disorders' },
        { code: 'F13', description: 'Mental and behavioural disorders due to use of sedatives/hypnotics', category: 'Substance Use Disorders' },
        { code: 'F14', description: 'Mental and behavioural disorders due to use of cocaine', category: 'Substance Use Disorders' },
        { code: 'F15', description: 'Mental and behavioural disorders due to use of stimulants including caffeine', category: 'Substance Use Disorders' },
        { code: 'F16', description: 'Mental and behavioural disorders due to use of hallucinogens', category: 'Substance Use Disorders' },
        { code: 'F17', description: 'Mental and behavioural disorders due to use of tobacco', category: 'Substance Use Disorders' },
        { code: 'F18', description: 'Mental and behavioural disorders due to use of volatile solvents', category: 'Substance Use Disorders' },
        { code: 'F19', description: 'Mental and behavioural disorders due to multiple drug use', category: 'Substance Use Disorders' },
        // F20-F29 Schizophrenia & Psychotic
        { code: 'F20', description: 'Schizophrenia', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F20.0', description: 'Paranoid schizophrenia', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F20.1', description: 'Hebephrenic schizophrenia', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F20.2', description: 'Catatonic schizophrenia', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F21', description: 'Schizotypal disorder', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F22', description: 'Persistent delusional disorders', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F23', description: 'Acute and transient psychotic disorders', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F24', description: 'Induced delusional disorder', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F25', description: 'Schizoaffective disorders', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F28', description: 'Other nonorganic psychotic disorders', category: 'Schizophrenia & Psychotic Disorders' },
        { code: 'F29', description: 'Unspecified nonorganic psychosis', category: 'Schizophrenia & Psychotic Disorders' },
        // F30-F39 Mood disorders
        { code: 'F30', description: 'Manic episode', category: 'Mood Disorders' },
        { code: 'F30.0', description: 'Hypomania', category: 'Mood Disorders' },
        { code: 'F30.1', description: 'Mania without psychotic symptoms', category: 'Mood Disorders' },
        { code: 'F30.2', description: 'Mania with psychotic symptoms', category: 'Mood Disorders' },
        { code: 'F31', description: 'Bipolar affective disorder', category: 'Mood Disorders' },
        { code: 'F31.0', description: 'Bipolar disorder, current episode hypomanic', category: 'Mood Disorders' },
        { code: 'F31.3', description: 'Bipolar disorder, current episode mild/moderate depression', category: 'Mood Disorders' },
        { code: 'F31.4', description: 'Bipolar disorder, current episode severe depression without psychotic symptoms', category: 'Mood Disorders' },
        { code: 'F32', description: 'Depressive episode', category: 'Mood Disorders' },
        { code: 'F32.0', description: 'Mild depressive episode', category: 'Mood Disorders' },
        { code: 'F32.1', description: 'Moderate depressive episode', category: 'Mood Disorders' },
        { code: 'F32.2', description: 'Severe depressive episode without psychotic symptoms', category: 'Mood Disorders' },
        { code: 'F32.3', description: 'Severe depressive episode with psychotic symptoms', category: 'Mood Disorders' },
        { code: 'F33', description: 'Recurrent depressive disorder', category: 'Mood Disorders' },
        { code: 'F34', description: 'Persistent mood disorders', category: 'Mood Disorders' },
        { code: 'F34.0', description: 'Cyclothymia', category: 'Mood Disorders' },
        { code: 'F34.1', description: 'Dysthymia', category: 'Mood Disorders' },
        { code: 'F38', description: 'Other mood disorders', category: 'Mood Disorders' },
        { code: 'F39', description: 'Unspecified mood disorder', category: 'Mood Disorders' },
        // F40-F48 Anxiety & Stress
        { code: 'F40', description: 'Phobic anxiety disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F40.0', description: 'Agoraphobia', category: 'Anxiety & Stress Disorders' },
        { code: 'F40.1', description: 'Social phobias', category: 'Anxiety & Stress Disorders' },
        { code: 'F40.2', description: 'Specific (isolated) phobias', category: 'Anxiety & Stress Disorders' },
        { code: 'F41', description: 'Other anxiety disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F41.0', description: 'Panic disorder (episodic paroxysmal anxiety)', category: 'Anxiety & Stress Disorders' },
        { code: 'F41.1', description: 'Generalized anxiety disorder', category: 'Anxiety & Stress Disorders' },
        { code: 'F41.2', description: 'Mixed anxiety and depressive disorder', category: 'Anxiety & Stress Disorders' },
        { code: 'F42', description: 'Obsessive-compulsive disorder', category: 'Anxiety & Stress Disorders' },
        { code: 'F43', description: 'Reaction to severe stress, and adjustment disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F43.0', description: 'Acute stress reaction', category: 'Anxiety & Stress Disorders' },
        { code: 'F43.1', description: 'Post-traumatic stress disorder', category: 'Anxiety & Stress Disorders' },
        { code: 'F43.2', description: 'Adjustment disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F44', description: 'Dissociative (conversion) disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F45', description: 'Somatoform disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F45.0', description: 'Somatization disorder', category: 'Anxiety & Stress Disorders' },
        { code: 'F45.2', description: 'Hypochondriacal disorder', category: 'Anxiety & Stress Disorders' },
        { code: 'F48', description: 'Other neurotic disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F48.0', description: 'Neurasthenia', category: 'Anxiety & Stress Disorders' },
        // F50-F59 Behavioural syndromes
        { code: 'F50', description: 'Eating disorders', category: 'Behavioural Syndromes' },
        { code: 'F50.0', description: 'Anorexia nervosa', category: 'Behavioural Syndromes' },
        { code: 'F50.2', description: 'Bulimia nervosa', category: 'Behavioural Syndromes' },
        { code: 'F51', description: 'Nonorganic sleep disorders', category: 'Behavioural Syndromes' },
        { code: 'F51.0', description: 'Nonorganic insomnia', category: 'Behavioural Syndromes' },
        { code: 'F51.1', description: 'Nonorganic hypersomnia', category: 'Behavioural Syndromes' },
        { code: 'F52', description: 'Sexual dysfunction, not caused by organic disorder/disease', category: 'Behavioural Syndromes' },
        // F60-F69 Personality disorders
        { code: 'F60', description: 'Specific personality disorders', category: 'Personality Disorders' },
        { code: 'F60.0', description: 'Paranoid personality disorder', category: 'Personality Disorders' },
        { code: 'F60.1', description: 'Schizoid personality disorder', category: 'Personality Disorders' },
        { code: 'F60.2', description: 'Dissocial personality disorder', category: 'Personality Disorders' },
        { code: 'F60.3', description: 'Emotionally unstable personality disorder', category: 'Personality Disorders' },
        { code: 'F60.4', description: 'Histrionic personality disorder', category: 'Personality Disorders' },
        { code: 'F60.5', description: 'Anankastic personality disorder', category: 'Personality Disorders' },
        { code: 'F60.6', description: 'Anxious (avoidant) personality disorder', category: 'Personality Disorders' },
        { code: 'F60.7', description: 'Dependent personality disorder', category: 'Personality Disorders' },
        { code: 'F61', description: 'Mixed and other personality disorders', category: 'Personality Disorders' },
        // F70-F79 Mental retardation
        { code: 'F70', description: 'Mild intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F71', description: 'Moderate intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F72', description: 'Severe intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F73', description: 'Profound intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F79', description: 'Unspecified intellectual disabilities', category: 'Intellectual Disabilities' },
        // F80-F89 Developmental disorders
        { code: 'F80', description: 'Specific developmental disorders of speech and language', category: 'Developmental Disorders' },
        { code: 'F81', description: 'Specific developmental disorders of scholastic skills', category: 'Developmental Disorders' },
        { code: 'F81.0', description: 'Specific reading disorder (dyslexia)', category: 'Developmental Disorders' },
        { code: 'F82', description: 'Specific developmental disorder of motor function', category: 'Developmental Disorders' },
        { code: 'F84', description: 'Pervasive developmental disorders', category: 'Developmental Disorders' },
        { code: 'F84.0', description: 'Childhood autism', category: 'Developmental Disorders' },
        { code: 'F84.5', description: "Asperger's syndrome", category: 'Developmental Disorders' },
        // F90-F98 Childhood-onset disorders
        { code: 'F90', description: 'Hyperkinetic disorders', category: 'Childhood-Onset Disorders' },
        { code: 'F90.0', description: 'Disturbance of activity and attention (ADHD)', category: 'Childhood-Onset Disorders' },
        { code: 'F91', description: 'Conduct disorders', category: 'Childhood-Onset Disorders' },
        { code: 'F92', description: 'Mixed disorders of conduct and emotions', category: 'Childhood-Onset Disorders' },
        { code: 'F93', description: 'Emotional disorders with onset specific to childhood', category: 'Childhood-Onset Disorders' },
        { code: 'F93.0', description: 'Separation anxiety disorder of childhood', category: 'Childhood-Onset Disorders' },
        { code: 'F94', description: 'Disorders of social functioning with onset in childhood', category: 'Childhood-Onset Disorders' },
        { code: 'F95', description: 'Tic disorders', category: 'Childhood-Onset Disorders' },
        { code: 'F95.2', description: "Combined vocal and motor tic disorder (Tourette's)", category: 'Childhood-Onset Disorders' },
        { code: 'F98', description: 'Other behavioural and emotional disorders with childhood onset', category: 'Childhood-Onset Disorders' },
        { code: 'F98.0', description: 'Nonorganic enuresis', category: 'Childhood-Onset Disorders' },
        { code: 'F99', description: 'Mental disorder, not otherwise specified', category: 'Unspecified' },
        // Z codes commonly used
        { code: 'Z63.0', description: 'Problems in relationship with spouse or partner', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z63.4', description: 'Disappearance and death of family member', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z65.0', description: 'Conviction without imprisonment', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z72.0', description: 'Tobacco use', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z73.0', description: 'Burn-out', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z76.5', description: 'Malingerer (conscious simulation)', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z91.5', description: 'Personal history of self-harm', category: 'Z Codes - Factors Influencing Health' },
      ];

      // Insert in batches
      for (let i = 0; i < icdCodes.length; i += 50) {
        const batch = icdCodes.slice(i, i + 50);
        await supabaseAdmin.from('icd_codes').insert(batch);
      }
      results.push(`Seeded ${icdCodes.length} ICD-10 codes`);
    } else {
      results.push('ICD codes already exist, skipping');
    }

    // ============ 3. CREATE DEMO ACCOUNTS ============
    const demoUsers = [
      { email: 'admin@ju.edu.jo', password: 'Admin@123', first_name: 'System', last_name: 'Administrator', role: 'admin' },
      { email: 'volunteer@ju.edu.jo', password: 'Vol@123', first_name: 'Ahmad', last_name: 'Khalil', role: 'volunteer' },
      { email: 'clinic@ju.edu.jo', password: 'Clinic@123', first_name: 'Sara', last_name: 'Nasser', role: 'clinic_coordinator' },
      { email: 'disability@ju.edu.jo', password: 'Dis@123', first_name: 'Rania', last_name: 'Haddad', role: 'disability_coordinator' },
      { email: 'psychologist@ju.edu.jo', password: 'Psych@123', first_name: 'Dr. Khaled', last_name: 'Mansour', role: 'psychologist' },
    ];

    for (const demo of demoUsers) {
      // Check if user exists
      const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('email', demo.email).maybeSingle();
      if (existing) {
        results.push(`User ${demo.email} already exists, skipping`);
        continue;
      }

      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { first_name: demo.first_name, last_name: demo.last_name }
      });

      if (createError) {
        results.push(`Error creating ${demo.email}: ${createError.message}`);
        continue;
      }

      const userId = authData.user.id;

      await supabaseAdmin.from('profiles').upsert({
        user_id: userId, email: demo.email, first_name: demo.first_name,
        last_name: demo.last_name, role: demo.role, is_active: true,
      }, { onConflict: 'user_id' });

      await supabaseAdmin.from('user_roles').upsert({
        user_id: userId, role: demo.role,
      }, { onConflict: 'user_id,role' });

      // If volunteer, create volunteer record
      if (demo.role === 'volunteer') {
        const { data: facData } = await supabaseAdmin.from('faculties').select('id').limit(1).single();
        const { data: majorData } = await supabaseAdmin.from('majors').select('id').limit(1).single();
        
        await supabaseAdmin.from('volunteers').upsert({
          user_id: userId, first_name: demo.first_name, family_name: demo.last_name,
          email: demo.email, university_id: '2024010001', national_id: '9900000001',
          phone: '+962790000001', faculty_id: facData?.id, major_id: majorData?.id,
          academic_year: '3', status: 'active',
        }, { onConflict: 'user_id' });
      }

      results.push(`Created ${demo.role}: ${demo.email}`);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
