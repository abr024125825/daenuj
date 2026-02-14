import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// ============ PATIENTS ============

export function usePatients(searchTerm?: string) {
  return useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: async () => {
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (searchTerm?.trim()) {
        query = query.or(`national_id.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,file_number.ilike.%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function usePatient(patientId?: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (patient: any) => {
      const { data, error } = await supabase.from('patients').insert(patient).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      toast({ title: 'Patient created successfully' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('patients').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['patient', data.id] });
      toast({ title: 'Patient updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ============ PATIENT ALERTS ============

export function usePatientAlerts(patientId?: string) {
  return useQuery({
    queryKey: ['patient-alerts', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('patient_alerts').select('*').eq('patient_id', patientId!).eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alert: any) => {
      const { data, error } = await supabase.from('patient_alerts').insert(alert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['patient-alerts', data.patient_id] }),
  });
}

// ============ ENCOUNTERS ============

export function useEncounters(patientId?: string) {
  return useQuery({
    queryKey: ['encounters', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('encounters').select('*').eq('patient_id', patientId!).order('encounter_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useEncounter(encounterId?: string) {
  return useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: async () => {
      if (!encounterId) return null;
      const { data, error } = await supabase.from('encounters').select('*').eq('id', encounterId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!encounterId,
  });
}

export function useCreateEncounter() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (encounter: any) => {
      const { data, error } = await supabase.from('encounters').insert(encounter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['encounters', data.patient_id] });
      toast({ title: 'Encounter created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('encounters').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['encounters', data.patient_id] });
      qc.invalidateQueries({ queryKey: ['encounter', data.id] });
    },
  });
}

// ============ ENCOUNTER HISTORIES ============

export function useEncounterHistories(encounterId?: string) {
  return useQuery({
    queryKey: ['encounter-histories', encounterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('encounter_histories').select('*').eq('encounter_id', encounterId!);
      if (error) throw error;
      return data;
    },
    enabled: !!encounterId,
  });
}

export function useUpsertHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (history: any) => {
      const { data, error } = await supabase.from('encounter_histories').upsert(history, { onConflict: 'id' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['encounter-histories', data.encounter_id] }),
  });
}

// ============ MENTAL STATUS EXAM ============

export function useMSE(encounterId?: string) {
  return useQuery({
    queryKey: ['mse', encounterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('mental_status_exams').select('*').eq('encounter_id', encounterId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!encounterId,
  });
}

export function useUpsertMSE() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mse: any) => {
      const { data, error } = await supabase.from('mental_status_exams').upsert(mse, { onConflict: 'id' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['mse', data.encounter_id] }),
  });
}

// ============ DIAGNOSES ============

export function useDiagnoses(patientId?: string) {
  return useQuery({
    queryKey: ['diagnoses', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('patient_diagnoses').select('*').eq('patient_id', patientId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateDiagnosis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dx: any) => {
      const { data, error } = await supabase.from('patient_diagnoses').insert(dx).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['diagnoses', data.patient_id] }),
  });
}

export function useUpdateDiagnosis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('patient_diagnoses').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['diagnoses', data.patient_id] }),
  });
}

// ============ TREATMENT PLANS ============

export function useTreatmentPlans(patientId?: string) {
  return useQuery({
    queryKey: ['treatment-plans-emr', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('encounter_treatment_plans').select('*').eq('patient_id', patientId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: any) => {
      const { data, error } = await supabase.from('encounter_treatment_plans').insert(plan).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['treatment-plans-emr', data.patient_id] }),
  });
}

// ============ THERAPY SESSIONS (SOAP) ============

export function useTherapySessions(patientId?: string) {
  return useQuery({
    queryKey: ['therapy-sessions-emr', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('emr_therapy_sessions').select('*').eq('patient_id', patientId!).order('session_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateTherapySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: any) => {
      const { data, error } = await supabase.from('emr_therapy_sessions').insert(session).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['therapy-sessions-emr', data.patient_id] }),
  });
}

// ============ RISK ASSESSMENTS ============

export function useRiskAssessments(patientId?: string) {
  return useQuery({
    queryKey: ['risk-assessments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('risk_assessments').select('*').eq('patient_id', patientId!).order('assessed_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ra: any) => {
      const { data, error } = await supabase.from('risk_assessments').insert(ra).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['risk-assessments', data.patient_id] }),
  });
}

// ============ MEDICATIONS ============

export function usePatientMedications(patientId?: string) {
  return useQuery({
    queryKey: ['patient-medications', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('patient_medications').select('*').eq('patient_id', patientId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateMedication() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (med: any) => {
      const { data, error } = await supabase.from('patient_medications').insert(med).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['patient-medications', data.patient_id] });
      toast({ title: 'Medication added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('patient_medications').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['patient-medications', data.patient_id] }),
  });
}

export function useMedicationCatalog(search?: string) {
  return useQuery({
    queryKey: ['medication-catalog', search],
    queryFn: async () => {
      let query = supabase.from('medication_catalog').select('*').order('generic_name');
      if (search?.trim()) {
        query = query.or(`generic_name.ilike.%${search}%,brand_name.ilike.%${search}%,drug_class.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ============ LABS ============

export function useLabResults(patientId?: string) {
  return useQuery({
    queryKey: ['lab-results', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('lab_results').select('*').eq('patient_id', patientId!).order('test_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateLabResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lab: any) => {
      const { data, error } = await supabase.from('lab_results').insert(lab).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['lab-results', data.patient_id] }),
  });
}

// ============ REFERRALS ============

export function useReferrals(patientId?: string) {
  return useQuery({
    queryKey: ['referrals', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('patient_referrals').select('*').eq('patient_id', patientId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ref: any) => {
      const { data, error } = await supabase.from('patient_referrals').insert(ref).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['referrals', data.patient_id] }),
  });
}

export function useUpdateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('patient_referrals').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['referrals', data.patient_id] }),
  });
}

// ============ DOCUMENTS ============

export function usePatientDocuments(patientId?: string) {
  return useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('patient_documents').select('*').eq('patient_id', patientId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: any) => {
      const { data, error } = await supabase.from('patient_documents').insert(doc).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['patient-documents', data.patient_id] }),
  });
}

// ============ AUDIT TRAIL ============

export function useAuditTrail(patientId?: string) {
  return useQuery({
    queryKey: ['audit-trail', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('emr_audit_trail').select('*').eq('patient_id', patientId!).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useLogAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: any) => {
      const { data, error } = await supabase.from('emr_audit_trail').insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['audit-trail', data.patient_id] }),
  });
}

// ============ ICD CODES ============

export function useICDCodes(search?: string) {
  return useQuery({
    queryKey: ['icd-codes', search],
    queryFn: async () => {
      let query = supabase.from('icd_codes').select('*').order('code');
      if (search?.trim()) {
        query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ============ ADDENDUMS ============

export function useAddendums(encounterId?: string) {
  return useQuery({
    queryKey: ['addendums', encounterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('encounter_addendums').select('*').eq('encounter_id', encounterId!).order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!encounterId,
  });
}

export function useCreateAddendum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addendum: any) => {
      const { data, error } = await supabase.from('encounter_addendums').insert(addendum).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['addendums', data.encounter_id] }),
  });
}
