import { supabase } from '@/integrations/supabase/client';

/**
 * Log an action to the EMR audit trail.
 * Call this BEFORE or AFTER any create/update/delete on patient data.
 */
export async function logAudit(params: {
  patientId: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: string;
  encounterId?: string;
  performedBy: string;
  performedByName: string;
  oldValue?: any;
  newValue?: any;
}) {
  try {
    await supabase.from('emr_audit_trail').insert({
      patient_id: params.patientId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      encounter_id: params.encounterId || null,
      performed_by: params.performedBy,
      performed_by_name: params.performedByName,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}
