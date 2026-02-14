import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuditTrail } from '@/hooks/useEMR';
import { Loader2, Shield } from 'lucide-react';

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
          {trail.map(entry => (
            <Card key={entry.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.action === 'create' ? 'default' : entry.action === 'update' ? 'secondary' : 'outline'} className="text-xs">
                      {entry.action}
                    </Badge>
                    <span className="text-sm text-foreground capitalize">{entry.entity_type?.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
                </div>
                {entry.performed_by_name && <p className="text-xs text-muted-foreground mt-1">By: {entry.performed_by_name}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
