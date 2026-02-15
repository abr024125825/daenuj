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

    // ============ 2. SEED ICD-10 CODES ============
    const { count: icdCount } = await supabaseAdmin.from('icd_codes').select('*', { count: 'exact', head: true });
    if ((icdCount || 0) === 0) {
      const icdCodes = [
        { code: 'F00', description: 'Dementia in Alzheimer disease', category: 'Organic Mental Disorders' },
        { code: 'F01', description: 'Vascular dementia', category: 'Organic Mental Disorders' },
        { code: 'F02', description: 'Dementia in other diseases', category: 'Organic Mental Disorders' },
        { code: 'F03', description: 'Unspecified dementia', category: 'Organic Mental Disorders' },
        { code: 'F04', description: 'Organic amnesic syndrome', category: 'Organic Mental Disorders' },
        { code: 'F05', description: 'Delirium, not induced by alcohol/psychoactive substances', category: 'Organic Mental Disorders' },
        { code: 'F06', description: 'Other mental disorders due to brain damage/dysfunction/physical disease', category: 'Organic Mental Disorders' },
        { code: 'F07', description: 'Personality and behavioural disorders due to brain disease', category: 'Organic Mental Disorders' },
        { code: 'F09', description: 'Unspecified organic or symptomatic mental disorder', category: 'Organic Mental Disorders' },
        { code: 'F10', description: 'Mental and behavioural disorders due to use of alcohol', category: 'Substance Use Disorders' },
        { code: 'F11', description: 'Mental and behavioural disorders due to use of opioids', category: 'Substance Use Disorders' },
        { code: 'F12', description: 'Mental and behavioural disorders due to use of cannabinoids', category: 'Substance Use Disorders' },
        { code: 'F13', description: 'Mental and behavioural disorders due to use of sedatives/hypnotics', category: 'Substance Use Disorders' },
        { code: 'F14', description: 'Mental and behavioural disorders due to use of cocaine', category: 'Substance Use Disorders' },
        { code: 'F15', description: 'Mental and behavioural disorders due to use of stimulants', category: 'Substance Use Disorders' },
        { code: 'F16', description: 'Mental and behavioural disorders due to use of hallucinogens', category: 'Substance Use Disorders' },
        { code: 'F17', description: 'Mental and behavioural disorders due to use of tobacco', category: 'Substance Use Disorders' },
        { code: 'F18', description: 'Mental and behavioural disorders due to use of volatile solvents', category: 'Substance Use Disorders' },
        { code: 'F19', description: 'Mental and behavioural disorders due to multiple drug use', category: 'Substance Use Disorders' },
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
        { code: 'F30', description: 'Manic episode', category: 'Mood Disorders' },
        { code: 'F30.0', description: 'Hypomania', category: 'Mood Disorders' },
        { code: 'F30.1', description: 'Mania without psychotic symptoms', category: 'Mood Disorders' },
        { code: 'F30.2', description: 'Mania with psychotic symptoms', category: 'Mood Disorders' },
        { code: 'F31', description: 'Bipolar affective disorder', category: 'Mood Disorders' },
        { code: 'F31.0', description: 'Bipolar disorder, current episode hypomanic', category: 'Mood Disorders' },
        { code: 'F31.3', description: 'Bipolar disorder, current episode mild/moderate depression', category: 'Mood Disorders' },
        { code: 'F31.4', description: 'Bipolar disorder, current episode severe depression', category: 'Mood Disorders' },
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
        { code: 'F40', description: 'Phobic anxiety disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F40.0', description: 'Agoraphobia', category: 'Anxiety & Stress Disorders' },
        { code: 'F40.1', description: 'Social phobias', category: 'Anxiety & Stress Disorders' },
        { code: 'F40.2', description: 'Specific (isolated) phobias', category: 'Anxiety & Stress Disorders' },
        { code: 'F41', description: 'Other anxiety disorders', category: 'Anxiety & Stress Disorders' },
        { code: 'F41.0', description: 'Panic disorder', category: 'Anxiety & Stress Disorders' },
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
        { code: 'F50', description: 'Eating disorders', category: 'Behavioural Syndromes' },
        { code: 'F50.0', description: 'Anorexia nervosa', category: 'Behavioural Syndromes' },
        { code: 'F50.2', description: 'Bulimia nervosa', category: 'Behavioural Syndromes' },
        { code: 'F51', description: 'Nonorganic sleep disorders', category: 'Behavioural Syndromes' },
        { code: 'F51.0', description: 'Nonorganic insomnia', category: 'Behavioural Syndromes' },
        { code: 'F51.1', description: 'Nonorganic hypersomnia', category: 'Behavioural Syndromes' },
        { code: 'F52', description: 'Sexual dysfunction, not caused by organic disorder', category: 'Behavioural Syndromes' },
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
        { code: 'F70', description: 'Mild intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F71', description: 'Moderate intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F72', description: 'Severe intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F73', description: 'Profound intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F79', description: 'Unspecified intellectual disabilities', category: 'Intellectual Disabilities' },
        { code: 'F80', description: 'Specific developmental disorders of speech and language', category: 'Developmental Disorders' },
        { code: 'F81', description: 'Specific developmental disorders of scholastic skills', category: 'Developmental Disorders' },
        { code: 'F81.0', description: 'Specific reading disorder (dyslexia)', category: 'Developmental Disorders' },
        { code: 'F82', description: 'Specific developmental disorder of motor function', category: 'Developmental Disorders' },
        { code: 'F84', description: 'Pervasive developmental disorders', category: 'Developmental Disorders' },
        { code: 'F84.0', description: 'Childhood autism', category: 'Developmental Disorders' },
        { code: 'F84.5', description: "Asperger's syndrome", category: 'Developmental Disorders' },
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
        { code: 'Z63.0', description: 'Problems in relationship with spouse or partner', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z63.4', description: 'Disappearance and death of family member', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z65.0', description: 'Conviction without imprisonment', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z72.0', description: 'Tobacco use', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z73.0', description: 'Burn-out', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z76.5', description: 'Malingerer (conscious simulation)', category: 'Z Codes - Factors Influencing Health' },
        { code: 'Z91.5', description: 'Personal history of self-harm', category: 'Z Codes - Factors Influencing Health' },
      ];

      for (let i = 0; i < icdCodes.length; i += 50) {
        const batch = icdCodes.slice(i, i + 50);
        await supabaseAdmin.from('icd_codes').insert(batch);
      }
      results.push(`Seeded ${icdCodes.length} ICD-10 codes`);
    } else {
      results.push('ICD codes already exist, skipping');
    }

    // ============ 3. SEED MEDICATION CATALOG ============
    const { count: medCount } = await supabaseAdmin.from('medication_catalog').select('*', { count: 'exact', head: true });
    if ((medCount || 0) === 0) {
      const medications = [
        // SSRIs
        { generic_name: 'Fluoxetine', brand_name: 'Prozac', drug_class: 'SSRI', typical_dose: '20-80mg/day', route: 'Oral', interaction_group: 'SSRI', contraindications: 'MAOIs, Pimozide' },
        { generic_name: 'Sertraline', brand_name: 'Zoloft', drug_class: 'SSRI', typical_dose: '50-200mg/day', route: 'Oral', interaction_group: 'SSRI', contraindications: 'MAOIs, Pimozide, Disulfiram' },
        { generic_name: 'Paroxetine', brand_name: 'Paxil', drug_class: 'SSRI', typical_dose: '20-60mg/day', route: 'Oral', interaction_group: 'SSRI', contraindications: 'MAOIs, Thioridazine, Pimozide' },
        { generic_name: 'Escitalopram', brand_name: 'Lexapro', drug_class: 'SSRI', typical_dose: '10-20mg/day', route: 'Oral', interaction_group: 'SSRI', contraindications: 'MAOIs, Pimozide' },
        { generic_name: 'Citalopram', brand_name: 'Celexa', drug_class: 'SSRI', typical_dose: '20-40mg/day', route: 'Oral', interaction_group: 'SSRI', contraindications: 'MAOIs, Pimozide, QT prolongation' },
        { generic_name: 'Fluvoxamine', brand_name: 'Luvox', drug_class: 'SSRI', typical_dose: '50-300mg/day', route: 'Oral', interaction_group: 'SSRI', contraindications: 'MAOIs, Thioridazine, Tizanidine' },
        // SNRIs
        { generic_name: 'Venlafaxine', brand_name: 'Effexor', drug_class: 'SNRI', typical_dose: '75-375mg/day', route: 'Oral', interaction_group: 'SNRI', contraindications: 'MAOIs' },
        { generic_name: 'Duloxetine', brand_name: 'Cymbalta', drug_class: 'SNRI', typical_dose: '40-120mg/day', route: 'Oral', interaction_group: 'SNRI', contraindications: 'MAOIs, Severe hepatic impairment' },
        { generic_name: 'Desvenlafaxine', brand_name: 'Pristiq', drug_class: 'SNRI', typical_dose: '50-100mg/day', route: 'Oral', interaction_group: 'SNRI', contraindications: 'MAOIs' },
        // TCAs
        { generic_name: 'Amitriptyline', brand_name: 'Elavil', drug_class: 'TCA', typical_dose: '25-300mg/day', route: 'Oral', interaction_group: 'TCA', contraindications: 'MAOIs, Recent MI, Acute heart failure' },
        { generic_name: 'Imipramine', brand_name: 'Tofranil', drug_class: 'TCA', typical_dose: '75-300mg/day', route: 'Oral', interaction_group: 'TCA', contraindications: 'MAOIs, Recent MI' },
        { generic_name: 'Clomipramine', brand_name: 'Anafranil', drug_class: 'TCA', typical_dose: '25-250mg/day', route: 'Oral', interaction_group: 'TCA', contraindications: 'MAOIs, Recent MI' },
        // MAOIs
        { generic_name: 'Phenelzine', brand_name: 'Nardil', drug_class: 'MAOI', typical_dose: '45-90mg/day', route: 'Oral', interaction_group: 'MAOI', contraindications: 'SSRIs, SNRIs, TCAs, Tyramine-rich foods' },
        { generic_name: 'Tranylcypromine', brand_name: 'Parnate', drug_class: 'MAOI', typical_dose: '30-60mg/day', route: 'Oral', interaction_group: 'MAOI', contraindications: 'SSRIs, SNRIs, TCAs, Tyramine-rich foods' },
        // Atypical Antidepressants
        { generic_name: 'Bupropion', brand_name: 'Wellbutrin', drug_class: 'Atypical Antidepressant', typical_dose: '150-450mg/day', route: 'Oral', interaction_group: 'Other', contraindications: 'Seizure disorders, Eating disorders, MAOIs' },
        { generic_name: 'Mirtazapine', brand_name: 'Remeron', drug_class: 'Atypical Antidepressant', typical_dose: '15-45mg/day', route: 'Oral', interaction_group: 'Other', contraindications: 'MAOIs' },
        { generic_name: 'Trazodone', brand_name: 'Desyrel', drug_class: 'Atypical Antidepressant', typical_dose: '150-400mg/day', route: 'Oral', interaction_group: 'Other', contraindications: 'MAOIs' },
        // Antipsychotics - First Generation
        { generic_name: 'Haloperidol', brand_name: 'Haldol', drug_class: 'First-Gen Antipsychotic', typical_dose: '2-20mg/day', route: 'Oral/IM', interaction_group: 'FGA', contraindications: 'Parkinsons, Severe CNS depression' },
        { generic_name: 'Chlorpromazine', brand_name: 'Thorazine', drug_class: 'First-Gen Antipsychotic', typical_dose: '75-800mg/day', route: 'Oral', interaction_group: 'FGA', contraindications: 'Bone marrow suppression, Severe CNS depression' },
        { generic_name: 'Fluphenazine', brand_name: 'Prolixin', drug_class: 'First-Gen Antipsychotic', typical_dose: '2.5-20mg/day', route: 'Oral/IM', interaction_group: 'FGA', contraindications: 'Blood dyscrasias, Liver disease' },
        // Antipsychotics - Second Generation (Atypical)
        { generic_name: 'Risperidone', brand_name: 'Risperdal', drug_class: 'Second-Gen Antipsychotic', typical_dose: '2-8mg/day', route: 'Oral', interaction_group: 'SGA', contraindications: 'Known hypersensitivity' },
        { generic_name: 'Olanzapine', brand_name: 'Zyprexa', drug_class: 'Second-Gen Antipsychotic', typical_dose: '5-20mg/day', route: 'Oral', interaction_group: 'SGA', contraindications: 'Known hypersensitivity' },
        { generic_name: 'Quetiapine', brand_name: 'Seroquel', drug_class: 'Second-Gen Antipsychotic', typical_dose: '150-800mg/day', route: 'Oral', interaction_group: 'SGA', contraindications: 'Known hypersensitivity' },
        { generic_name: 'Aripiprazole', brand_name: 'Abilify', drug_class: 'Second-Gen Antipsychotic', typical_dose: '10-30mg/day', route: 'Oral', interaction_group: 'SGA', contraindications: 'Known hypersensitivity' },
        { generic_name: 'Clozapine', brand_name: 'Clozaril', drug_class: 'Second-Gen Antipsychotic', typical_dose: '150-900mg/day', route: 'Oral', interaction_group: 'SGA', contraindications: 'Agranulocytosis history, Severe granulocytopenia' },
        { generic_name: 'Ziprasidone', brand_name: 'Geodon', drug_class: 'Second-Gen Antipsychotic', typical_dose: '40-160mg/day', route: 'Oral', interaction_group: 'SGA', contraindications: 'QT prolongation, Recent MI' },
        { generic_name: 'Paliperidone', brand_name: 'Invega', drug_class: 'Second-Gen Antipsychotic', typical_dose: '3-12mg/day', route: 'Oral', interaction_group: 'SGA', contraindications: 'Known hypersensitivity to risperidone' },
        // Mood Stabilizers
        { generic_name: 'Lithium Carbonate', brand_name: 'Lithobid', drug_class: 'Mood Stabilizer', typical_dose: '600-1800mg/day', route: 'Oral', interaction_group: 'Lithium', contraindications: 'Severe renal impairment, Dehydration, Sodium depletion' },
        { generic_name: 'Valproic Acid', brand_name: 'Depakote', drug_class: 'Mood Stabilizer/Anticonvulsant', typical_dose: '750-2500mg/day', route: 'Oral', interaction_group: 'Valproate', contraindications: 'Hepatic disease, Urea cycle disorders, Pregnancy' },
        { generic_name: 'Carbamazepine', brand_name: 'Tegretol', drug_class: 'Mood Stabilizer/Anticonvulsant', typical_dose: '400-1600mg/day', route: 'Oral', interaction_group: 'Carbamazepine', contraindications: 'MAOIs, Bone marrow suppression' },
        { generic_name: 'Lamotrigine', brand_name: 'Lamictal', drug_class: 'Mood Stabilizer/Anticonvulsant', typical_dose: '100-400mg/day', route: 'Oral', interaction_group: 'Lamotrigine', contraindications: 'Known hypersensitivity (SJS risk)' },
        // Anxiolytics - Benzodiazepines
        { generic_name: 'Alprazolam', brand_name: 'Xanax', drug_class: 'Benzodiazepine', typical_dose: '0.5-4mg/day', route: 'Oral', interaction_group: 'Benzodiazepine', contraindications: 'Acute narrow-angle glaucoma, Severe respiratory insufficiency' },
        { generic_name: 'Lorazepam', brand_name: 'Ativan', drug_class: 'Benzodiazepine', typical_dose: '1-6mg/day', route: 'Oral/IM/IV', interaction_group: 'Benzodiazepine', contraindications: 'Acute narrow-angle glaucoma, Sleep apnea' },
        { generic_name: 'Clonazepam', brand_name: 'Klonopin', drug_class: 'Benzodiazepine', typical_dose: '0.5-4mg/day', route: 'Oral', interaction_group: 'Benzodiazepine', contraindications: 'Acute narrow-angle glaucoma, Severe liver disease' },
        { generic_name: 'Diazepam', brand_name: 'Valium', drug_class: 'Benzodiazepine', typical_dose: '2-40mg/day', route: 'Oral/IM/IV', interaction_group: 'Benzodiazepine', contraindications: 'Myasthenia gravis, Severe respiratory insufficiency' },
        // Non-Benzo Anxiolytics
        { generic_name: 'Buspirone', brand_name: 'Buspar', drug_class: 'Anxiolytic (Non-Benzo)', typical_dose: '15-60mg/day', route: 'Oral', interaction_group: 'Other', contraindications: 'MAOIs, Severe hepatic/renal impairment' },
        { generic_name: 'Hydroxyzine', brand_name: 'Vistaril', drug_class: 'Antihistamine/Anxiolytic', typical_dose: '25-100mg/day', route: 'Oral', interaction_group: 'Other', contraindications: 'Early pregnancy, QT prolongation' },
        // Stimulants (ADHD)
        { generic_name: 'Methylphenidate', brand_name: 'Ritalin/Concerta', drug_class: 'CNS Stimulant', typical_dose: '10-60mg/day', route: 'Oral', interaction_group: 'Stimulant', contraindications: 'MAOIs, Glaucoma, Tics/Tourettes, Severe anxiety' },
        { generic_name: 'Amphetamine/Dextroamphetamine', brand_name: 'Adderall', drug_class: 'CNS Stimulant', typical_dose: '5-40mg/day', route: 'Oral', interaction_group: 'Stimulant', contraindications: 'MAOIs, Cardiovascular disease, Glaucoma' },
        { generic_name: 'Atomoxetine', brand_name: 'Strattera', drug_class: 'SNRI (ADHD)', typical_dose: '40-100mg/day', route: 'Oral', interaction_group: 'Other', contraindications: 'MAOIs, Narrow-angle glaucoma, Pheochromocytoma' },
        // Sedative/Hypnotics
        { generic_name: 'Zolpidem', brand_name: 'Ambien', drug_class: 'Sedative/Hypnotic', typical_dose: '5-10mg at bedtime', route: 'Oral', interaction_group: 'Z-drug', contraindications: 'Severe hepatic impairment, Sleep apnea' },
        { generic_name: 'Melatonin', brand_name: 'Melatonin', drug_class: 'Supplement/Hypnotic', typical_dose: '1-5mg at bedtime', route: 'Oral', interaction_group: 'Other', contraindications: 'Autoimmune disorders (caution)' },
        // Anti-cholinergics for EPS
        { generic_name: 'Benztropine', brand_name: 'Cogentin', drug_class: 'Anticholinergic', typical_dose: '1-6mg/day', route: 'Oral/IM', interaction_group: 'Anticholinergic', contraindications: 'Narrow-angle glaucoma, Tardive dyskinesia, GI obstruction' },
        { generic_name: 'Trihexyphenidyl', brand_name: 'Artane', drug_class: 'Anticholinergic', typical_dose: '2-15mg/day', route: 'Oral', interaction_group: 'Anticholinergic', contraindications: 'Narrow-angle glaucoma, GI obstruction' },
        // Beta-blockers (performance anxiety)
        { generic_name: 'Propranolol', brand_name: 'Inderal', drug_class: 'Beta-Blocker', typical_dose: '10-80mg/day', route: 'Oral', interaction_group: 'Beta-Blocker', contraindications: 'Asthma, Bradycardia, Heart block, Uncompensated heart failure' },
      ];

      for (let i = 0; i < medications.length; i += 50) {
        const batch = medications.slice(i, i + 50);
        await supabaseAdmin.from('medication_catalog').insert(batch);
      }
      results.push(`Seeded ${medications.length} medications`);
    } else {
      results.push('Medication catalog already exists, skipping');
    }

    // ============ 4. CREATE DEMO ACCOUNTS ============
    // Get first faculty for assignments
    const { data: firstFaculty } = await supabaseAdmin.from('faculties').select('id').limit(1).single();
    const { data: firstMajor } = await supabaseAdmin.from('majors').select('id').limit(1).single();

    const demoUsers = [
      { email: 'admin@ju.edu.jo', password: 'Admin@123', first_name: 'System', last_name: 'Administrator', role: 'admin' },
      { email: 'coordinator@ju.edu.jo', password: 'Coord@123', first_name: 'Faculty', last_name: 'Coordinator', role: 'supervisor', faculty_id: firstFaculty?.id },
      { email: 'volunteer@ju.edu.jo', password: 'Vol@123', first_name: 'Ahmad', last_name: 'Khalil', role: 'volunteer' },
      { email: 'clinic@ju.edu.jo', password: 'Clinic@123', first_name: 'Sara', last_name: 'Nasser', role: 'clinic_coordinator' },
      { email: 'disability@ju.edu.jo', password: 'Dis@123', first_name: 'Rania', last_name: 'Haddad', role: 'disability_coordinator' },
      { email: 'psychologist@ju.edu.jo', password: 'Psych@123', first_name: 'Dr. Khaled', last_name: 'Mansour', role: 'psychologist' },
    ];

    for (const demo of demoUsers) {
      // Check if user exists by email in auth
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === demo.email);
      
      if (existingUser) {
        // Ensure profile and role exist
        await supabaseAdmin.from('profiles').upsert({
          user_id: existingUser.id, email: demo.email, first_name: demo.first_name,
          last_name: demo.last_name, role: demo.role, is_active: true,
          faculty_id: (demo as any).faculty_id || null,
        }, { onConflict: 'user_id' });

        await supabaseAdmin.from('user_roles').upsert({
          user_id: existingUser.id, role: demo.role,
        }, { onConflict: 'user_id,role' });

        results.push(`User ${demo.email} already exists, ensured profile/role`);
        continue;
      }

      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: demo.email,
        password: (demo as any).password,
        email_confirm: true,
        user_metadata: { first_name: demo.first_name, last_name: demo.last_name }
      });

      if (createError) {
        results.push(`Error creating ${demo.email}: ${createError.message}`);
        continue;
      }

      const userId = authData.user.id;

      // Create profile
      await supabaseAdmin.from('profiles').upsert({
        user_id: userId, email: demo.email, first_name: demo.first_name,
        last_name: demo.last_name, role: demo.role, is_active: true,
        faculty_id: (demo as any).faculty_id || null,
      }, { onConflict: 'user_id' });

      // Create role
      await supabaseAdmin.from('user_roles').upsert({
        user_id: userId, role: demo.role,
      }, { onConflict: 'user_id,role' });

      // If volunteer, create application + volunteer record
      if (demo.role === 'volunteer' && firstFaculty?.id && firstMajor?.id) {
        const { data: app } = await supabaseAdmin.from('volunteer_applications').insert({
          user_id: userId,
          first_name: demo.first_name,
          father_name: 'Mohammed',
          grandfather_name: 'Ali',
          family_name: demo.last_name,
          university_email: demo.email,
          phone_number: '0791234567',
          university_id: '2024010001',
          faculty_id: firstFaculty.id,
          major_id: firstMajor.id,
          academic_year: 'Third Year',
          emergency_contact_name: 'Emergency Contact',
          emergency_contact_phone: '0799876543',
          motivation: 'I want to contribute to my community',
          status: 'approved',
          reviewed_at: new Date().toISOString()
        }).select('id').single();

        if (app) {
          await supabaseAdmin.from('volunteers').insert({
            user_id: userId,
            application_id: app.id,
            is_active: true,
            total_hours: 25,
            opportunities_completed: 5
          });
        }
      }

      // Set EMR password for psychologist
      if (demo.role === 'psychologist') {
        await supabaseAdmin.from('profiles').update({ emr_password: 'emr123' }).eq('user_id', userId);
      }

      results.push(`Created ${demo.role}: ${demo.email}`);
    }

    // ============ 5. CREATE ACTIVE SEMESTER ============
    const { data: existingSemesters } = await supabaseAdmin
      .from('academic_semesters')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (!existingSemesters || existingSemesters.length === 0) {
      // Need an admin user_id for created_by
      const { data: adminProfile } = await supabaseAdmin.from('profiles').select('user_id').eq('role', 'admin').limit(1).single();
      
      if (adminProfile) {
        await supabaseAdmin.from('academic_semesters').insert({
          name: 'Second Semester',
          academic_year: '2025/2026',
          semester_number: 2,
          start_date: '2026-02-01',
          end_date: '2026-06-30',
          is_active: true,
          is_schedule_open: true,
          created_by: adminProfile.user_id
        });
        results.push('Created active semester: Second Semester 2025/2026');
      }
    } else {
      results.push('Active semester already exists');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      demo_accounts: demoUsers.map(u => ({ email: u.email, password: (u as any).password, role: u.role }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
