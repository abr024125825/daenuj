
-- =============================================
-- EMR SYSTEM DATABASE SCHEMA
-- =============================================

-- 1. ICD Codes Reference Table
CREATE TABLE public.icd_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.icd_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ICD codes" ON public.icd_codes FOR SELECT USING (true);

-- 2. Medication Catalog
CREATE TABLE public.medication_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generic_name text NOT NULL,
  brand_name text,
  drug_class text NOT NULL,
  typical_dose text,
  route text DEFAULT 'Oral',
  contraindications text,
  interaction_group text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medication_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view medications" ON public.medication_catalog FOR SELECT USING (true);

-- 3. Patients Master Table
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_number text NOT NULL UNIQUE DEFAULT ('PT-' || to_char(now(), 'YYYY') || '-' || LPAD(floor(random() * 100000)::text, 5, '0')),
  national_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  date_of_birth date,
  gender text,
  marital_status text,
  phone text,
  email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text[] DEFAULT '{}',
  chronic_problems text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage patients" ON public.patients FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 4. Patient Alerts
CREATE TABLE public.patient_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  alert_type text NOT NULL, -- suicide_attempt, aggression, drug_allergy, other
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'high', -- low, medium, high, critical
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage alerts" ON public.patient_alerts FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 5. Encounters (Visits)
CREATE TABLE public.encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_number serial,
  clinic_type text NOT NULL DEFAULT 'psychiatry', -- psychiatry, psychology
  visit_type text NOT NULL DEFAULT 'new', -- new, follow_up
  encounter_date timestamptz NOT NULL DEFAULT now(),
  provider_id uuid NOT NULL,
  provider_name text NOT NULL,
  location text,
  chief_complaint text,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress, completed, signed
  signed_at timestamptz,
  signed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage encounters" ON public.encounters FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 6. Encounter Histories (structured blocks)
CREATE TABLE public.encounter_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  history_type text NOT NULL, -- psychiatric, medical, family, substance_use, social
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encounter_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage histories" ON public.encounter_histories FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 7. Mental Status Examination
CREATE TABLE public.mental_status_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  appearance text,
  appearance_notes text,
  behavior text,
  behavior_notes text,
  mood text,
  mood_notes text,
  affect text,
  affect_notes text,
  thought_process text,
  thought_process_notes text,
  thought_content text,
  thought_content_notes text,
  perception text,
  perception_notes text,
  insight text,
  insight_notes text,
  judgment text,
  judgment_notes text,
  cognitive_screening text,
  cognitive_screening_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mental_status_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage MSE" ON public.mental_status_exams FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 8. Diagnoses
CREATE TABLE public.patient_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id),
  icd_code text NOT NULL,
  icd_description text NOT NULL,
  diagnosis_type text NOT NULL DEFAULT 'primary', -- primary, secondary
  status text NOT NULL DEFAULT 'active', -- active, resolved, in_remission
  onset_date date,
  resolved_date date,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage diagnoses" ON public.patient_diagnoses FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 9. Encounter Treatment Plans
CREATE TABLE public.encounter_treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  therapy_type text NOT NULL, -- CBT, Supportive, Family, Medication, Other
  frequency text,
  duration text,
  smart_goals jsonb DEFAULT '[]', -- [{goal, baseline, target, timeframe, indicator}]
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encounter_treatment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage treatment plans" ON public.encounter_treatment_plans FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 10. Therapy Sessions (SOAP)
CREATE TABLE public.emr_therapy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id),
  session_number integer NOT NULL DEFAULT 1,
  session_date timestamptz NOT NULL DEFAULT now(),
  subjective text, -- S
  objective text, -- O
  assessment text, -- A
  plan text, -- P
  homework_assigned text,
  response_to_intervention text,
  functional_status_score integer, -- 1-10
  provider_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emr_therapy_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage therapy sessions" ON public.emr_therapy_sessions FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 11. Risk Assessments
CREATE TABLE public.risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id),
  suicidal_ideation boolean DEFAULT false,
  suicide_plan boolean DEFAULT false,
  suicide_means boolean DEFAULT false,
  suicide_intent boolean DEFAULT false,
  previous_attempts integer DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low', -- low, moderate, high
  safety_plan_documented boolean DEFAULT false,
  safety_plan_details text,
  violence_risk text,
  notes text,
  assessed_by uuid NOT NULL,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage risk assessments" ON public.risk_assessments FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 12. Patient Medications
CREATE TABLE public.patient_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id),
  medication_name text NOT NULL,
  dose text NOT NULL,
  route text DEFAULT 'Oral',
  frequency text NOT NULL,
  duration text,
  refill_count integer DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'active', -- active, discontinued, completed
  interaction_group text,
  prescribed_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage medications" ON public.patient_medications FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 13. Lab Results
CREATE TABLE public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id),
  test_name text NOT NULL,
  test_category text, -- CBC, thyroid, liver, drug_levels
  result_value text,
  reference_range text,
  unit text,
  is_abnormal boolean DEFAULT false,
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  ordered_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage labs" ON public.lab_results FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 14. Referrals
CREATE TABLE public.patient_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id),
  referral_type text NOT NULL DEFAULT 'internal', -- internal, external
  referred_to text NOT NULL,
  specialty text,
  reason text NOT NULL,
  urgency text DEFAULT 'routine', -- routine, urgent, emergent
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, completed, cancelled
  completed_at timestamptz,
  result_notes text,
  referred_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage referrals" ON public.patient_referrals FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 15. Patient Documents
CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id),
  document_type text NOT NULL, -- consent, psychological_scale, legal_report, court_request, other
  title text NOT NULL,
  file_url text,
  file_name text,
  notes text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can manage documents" ON public.patient_documents FOR ALL
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]))
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- 16. EMR Audit Trail
CREATE TABLE public.emr_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.encounters(id),
  action text NOT NULL, -- create, update, view, sign, addendum
  entity_type text NOT NULL, -- encounter, diagnosis, medication, etc.
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid NOT NULL,
  performed_by_name text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emr_audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can view audit trail" ON public.emr_audit_trail FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));
CREATE POLICY "System can insert audit entries" ON public.emr_audit_trail FOR INSERT
  WITH CHECK (true);

-- 17. Encounter Addendums (no deletion allowed)
CREATE TABLE public.encounter_addendums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_by_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encounter_addendums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff can view addendums" ON public.encounter_addendums FOR SELECT
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));
CREATE POLICY "Clinical staff can add addendums" ON public.encounter_addendums FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'psychologist'::user_role]));

-- Indexes for performance
CREATE INDEX idx_patients_national_id ON public.patients(national_id);
CREATE INDEX idx_encounters_patient_id ON public.encounters(patient_id);
CREATE INDEX idx_encounters_date ON public.encounters(encounter_date);
CREATE INDEX idx_diagnoses_patient_id ON public.patient_diagnoses(patient_id);
CREATE INDEX idx_medications_patient_id ON public.patient_medications(patient_id);
CREATE INDEX idx_therapy_sessions_patient_id ON public.emr_therapy_sessions(patient_id);
CREATE INDEX idx_risk_assessments_patient_id ON public.risk_assessments(patient_id);
CREATE INDEX idx_lab_results_patient_id ON public.lab_results(patient_id);
CREATE INDEX idx_audit_trail_patient_id ON public.emr_audit_trail(patient_id);

-- Generate file number function
CREATE OR REPLACE FUNCTION public.generate_file_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  num integer;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(file_number, '[^0-9]', '', 'g'), '')::integer), 0) + 1
  INTO num FROM public.patients;
  RETURN 'PT-' || to_char(now(), 'YYYY') || '-' || LPAD(num::text, 5, '0');
END;
$$;
