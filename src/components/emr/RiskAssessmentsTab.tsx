import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useRiskAssessments, useCreateRiskAssessment, useDeleteRiskAssessment } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import { logAudit } from '@/lib/auditHelper';

interface RiskAssessmentsTabProps {
  patientId: string;
  encounterId?: string;
  isSigned?: boolean;
}

export function RiskAssessmentsTab({ patientId, encounterId, isSigned = false }: RiskAssessmentsTabProps) {
  const { user, profile } = useAuth();
  const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  const { data: assessments, isLoading } = useRiskAssessments(patientId);
  const createRA = useCreateRiskAssessment();
  const deleteRA = useDeleteRiskAssessment();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({
    suicidal_ideation: false, suicide_plan: false, suicide_means: false, suicide_intent: false,
    previous_attempts: 0, risk_level: 'low', safety_plan_documented: false,
    safety_plan_details: '', violence_risk: '', notes: '',
  });

  const autoRiskLevel = () => {
    if (form.suicide_intent || form.suicide_means || form.previous_attempts > 0) return 'high';
    if (form.suicide_plan || form.suicidal_ideation) return 'moderate';
    return 'low';
  };

  const handleCreate = async () => {
    const result = await createRA.mutateAsync({
      patient_id: patientId, assessed_by: user?.id,
      ...form, risk_level: autoRiskLevel(),
    });
    await logAudit({
      patientId, action: 'create', entityType: 'risk_assessment', entityId: result.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      newValue: { risk_level: autoRiskLevel(), ideation: form.suicidal_ideation },
    });
    setIsOpen(false);
    setForm({ suicidal_ideation: false, suicide_plan: false, suicide_means: false, suicide_intent: false, previous_attempts: 0, risk_level: 'low', safety_plan_documented: false, safety_plan_details: '', violence_risk: '', notes: '' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await logAudit({
      patientId, action: 'delete', entityType: 'risk_assessment', entityId: deleteTarget.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      oldValue: { risk_level: deleteTarget.risk_level, date: deleteTarget.assessed_at },
    });
    await deleteRA.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Risk Assessments ({assessments?.length || 0})</h3>
        {!isSigned && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm" variant="destructive"><ShieldAlert className="h-4 w-4 mr-1" /> Assess Risk</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Suicide & Violence Risk Assessment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  {[
                    { key: 'suicidal_ideation', label: 'Suicidal Ideation' },
                    { key: 'suicide_plan', label: 'Has Plan' },
                    { key: 'suicide_means', label: 'Has Means' },
                    { key: 'suicide_intent', label: 'Has Intent' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label>{item.label}</Label>
                      <Switch checked={(form as any)[item.key]} onCheckedChange={v => setForm(f => ({ ...f, [item.key]: v }))} />
                    </div>
                  ))}
                </div>
                <div><Label>Previous Attempts</Label><Input type="number" min={0} value={form.previous_attempts} onChange={e => setForm(f => ({ ...f, previous_attempts: parseInt(e.target.value) || 0 }))} /></div>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-semibold">Auto-calculated Risk Level:</p>
                  <Badge variant={autoRiskLevel() === 'high' ? 'destructive' : autoRiskLevel() === 'moderate' ? 'secondary' : 'default'} className="mt-1">
                    {autoRiskLevel().toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Safety Plan Documented?</Label>
                  <Switch checked={form.safety_plan_documented} onCheckedChange={v => setForm(f => ({ ...f, safety_plan_documented: v }))} />
                </div>
                {form.safety_plan_documented && (
                  <div><Label>Safety Plan Details</Label><Textarea value={form.safety_plan_details} onChange={e => setForm(f => ({ ...f, safety_plan_details: e.target.value }))} rows={3} /></div>
                )}
                <div><Label>Violence Risk Notes</Label><Textarea value={form.violence_risk} onChange={e => setForm(f => ({ ...f, violence_risk: e.target.value }))} rows={2} /></div>
                <div><Label>Additional Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                <Button onClick={handleCreate} disabled={createRA.isPending} className="w-full">Save Assessment</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!assessments?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No risk assessments recorded</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assessments.map(ra => (
            <Card key={ra.id} className={ra.risk_level === 'high' ? 'border-destructive/50' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{new Date(ra.assessed_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={ra.risk_level === 'high' ? 'destructive' : ra.risk_level === 'moderate' ? 'secondary' : 'default'}>
                      {ra.risk_level === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {ra.risk_level?.toUpperCase()} RISK
                    </Badge>
                    {!isSigned && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(ra)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>Ideation: {ra.suicidal_ideation ? '✅ Yes' : '❌ No'}</div>
                  <div>Plan: {ra.suicide_plan ? '✅ Yes' : '❌ No'}</div>
                  <div>Means: {ra.suicide_means ? '✅ Yes' : '❌ No'}</div>
                  <div>Intent: {ra.suicide_intent ? '✅ Yes' : '❌ No'}</div>
                </div>
                {(ra.previous_attempts ?? 0) > 0 && <p className="text-xs text-destructive mt-1">Previous Attempts: {ra.previous_attempts}</p>}
                <div className="mt-1 text-xs">Safety Plan: {ra.safety_plan_documented ? '✅ Documented' : '❌ Not documented'}</div>
                {ra.notes && <p className="text-xs text-muted-foreground mt-1">{ra.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Risk Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this {deleteTarget?.risk_level} risk assessment? This action is logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
