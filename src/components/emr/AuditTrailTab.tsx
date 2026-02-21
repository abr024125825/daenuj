import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuditTrail } from '@/hooks/useEMR';
import { Loader2, Shield } from 'lucide-react';

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  create: { label: 'Created', variant: 'default' },
  update: { label: 'Updated', variant: 'secondary' },
  delete: { label: 'Deleted', variant: 'destructive' },
};

const ENTITY_LABELS: Record<string, string> = {
  encounter: 'Encounter',
  diagnosis: 'Diagnosis',
  medication: 'Medication',
  referral: 'Referral',
  risk_assessment: 'Risk Assessment',
  therapy_session: 'Therapy Session',
  lab_result: 'Lab Result',
  document: 'Document',
  patient: 'Patient',
  mse: 'Mental Status Exam',
};

export function AuditTrailTab({ patientId }: { patientId: string }) {
  const { data: trail, isLoading } = useAuditTrail(patientId);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Audit Trail ({trail?.length || 0})</h3>
      </div>
      <p className="text-xs text-muted-foreground">All actions are logged and cannot be deleted. This serves as a legal record.</p>

      {!trail?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No audit entries yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {trail.map(entry => {
            const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, variant: 'outline' as const };
            const entityLabel = ENTITY_LABELS[entry.entity_type] || entry.entity_type?.replace(/_/g, ' ');
            const oldVal = entry.old_value as any;
            const newVal = entry.new_value as any;

            return (
              <Card key={entry.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={actionInfo.variant} className="text-xs">
                        {actionInfo.label}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{entityLabel}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                  {entry.performed_by_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      By: <span className="font-medium text-foreground">{entry.performed_by_name}</span>
                    </p>
                  )}
                  {/* Show details */}
                  {(oldVal || newVal) && (
                    <div className="mt-2 text-xs space-y-1">
                      {oldVal && entry.action === 'delete' && (
                        <div className="p-2 bg-destructive/5 rounded border border-destructive/10">
                          <span className="text-destructive font-medium">Deleted: </span>
                          {Object.entries(oldVal).map(([k, v]) => (
                            <span key={k} className="text-muted-foreground mr-2">{k}: <span className="text-foreground">{String(v)}</span></span>
                          ))}
                        </div>
                      )}
                      {entry.action === 'update' && oldVal && newVal && (
                        <div className="p-2 bg-muted/50 rounded border border-border">
                          {Object.entries(newVal).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-muted-foreground">{k}: </span>
                              {oldVal[k] !== undefined && <span className="line-through text-muted-foreground mr-1">{String(oldVal[k])}</span>}
                              <span className="text-foreground font-medium">→ {String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.action === 'create' && newVal && (
                        <div className="p-2 bg-primary/5 rounded border border-primary/10">
                          {Object.entries(newVal).map(([k, v]) => (
                            <span key={k} className="text-muted-foreground mr-2">{k}: <span className="text-foreground">{String(v)}</span></span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
