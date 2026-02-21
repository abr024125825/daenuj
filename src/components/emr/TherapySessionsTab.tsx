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
import { Slider } from '@/components/ui/slider';
import { useTherapySessions, useCreateTherapySession, useDeleteTherapySession } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { logAudit } from '@/lib/auditHelper';

interface TherapySessionsTabProps {
  patientId: string;
  encounterId?: string;
}

export function TherapySessionsTab({ patientId, encounterId }: TherapySessionsTabProps) {
  const { user, profile } = useAuth();
  const userName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  const { data: sessions, isLoading } = useTherapySessions(patientId);
  const createSession = useCreateTherapySession();
  const deleteSession = useDeleteTherapySession();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({
    subjective: '', objective: '', assessment: '', plan: '',
    homework_assigned: '', response_to_intervention: '', functional_status_score: 5,
  });

  const nextSessionNumber = (sessions?.length || 0) + 1;

  const handleCreate = async () => {
    const result = await createSession.mutateAsync({
      patient_id: patientId, session_number: nextSessionNumber, provider_id: user?.id,
      encounter_id: encounterId || null, ...form, functional_status_score: form.functional_status_score,
    });
    await logAudit({
      patientId, action: 'create', entityType: 'therapy_session', entityId: result.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      newValue: { session_number: nextSessionNumber, score: form.functional_status_score },
    });
    setIsOpen(false);
    setForm({ subjective: '', objective: '', assessment: '', plan: '', homework_assigned: '', response_to_intervention: '', functional_status_score: 5 });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await logAudit({
      patientId, action: 'delete', entityType: 'therapy_session', entityId: deleteTarget.id, encounterId,
      performedBy: user?.id!, performedByName: userName,
      oldValue: { session_number: deleteTarget.session_number, date: deleteTarget.session_date },
    });
    await deleteSession.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const filteredSessions = encounterId ? sessions?.filter(s => s.encounter_id === encounterId) : sessions;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Therapy Sessions ({filteredSessions?.length || 0})</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Session</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Session #{nextSessionNumber} — SOAP Note</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>S — Subjective</Label><Textarea value={form.subjective} onChange={e => setForm(f => ({ ...f, subjective: e.target.value }))} rows={3} /></div>
              <div><Label>O — Objective</Label><Textarea value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} rows={3} /></div>
              <div><Label>A — Assessment</Label><Textarea value={form.assessment} onChange={e => setForm(f => ({ ...f, assessment: e.target.value }))} rows={3} /></div>
              <div><Label>P — Plan</Label><Textarea value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} rows={3} /></div>
              <div><Label>Homework Assigned</Label><Textarea value={form.homework_assigned} onChange={e => setForm(f => ({ ...f, homework_assigned: e.target.value }))} rows={2} /></div>
              <div><Label>Response to Intervention</Label><Textarea value={form.response_to_intervention} onChange={e => setForm(f => ({ ...f, response_to_intervention: e.target.value }))} rows={2} /></div>
              <div>
                <Label>Functional Status Score: {form.functional_status_score}/10</Label>
                <Slider value={[form.functional_status_score]} onValueChange={v => setForm(f => ({ ...f, functional_status_score: v[0] }))} min={1} max={10} step={1} className="mt-2" />
              </div>
              <Button onClick={handleCreate} disabled={createSession.isPending} className="w-full">Save Session</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!filteredSessions?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No therapy sessions recorded</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(s => (
            <Card key={s.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Session #{s.session_number}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.functional_status_score && (
                      <Badge variant={s.functional_status_score >= 7 ? 'default' : s.functional_status_score >= 4 ? 'secondary' : 'destructive'} className="text-xs">
                        Functional: {s.functional_status_score}/10
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {s.subjective && <div><span className="font-semibold text-primary">S:</span> <span className="text-foreground">{s.subjective}</span></div>}
                  {s.objective && <div><span className="font-semibold text-primary">O:</span> <span className="text-foreground">{s.objective}</span></div>}
                  {s.assessment && <div><span className="font-semibold text-primary">A:</span> <span className="text-foreground">{s.assessment}</span></div>}
                  {s.plan && <div><span className="font-semibold text-primary">P:</span> <span className="text-foreground">{s.plan}</span></div>}
                </div>
                {s.homework_assigned && <p className="text-xs text-muted-foreground mt-2">📝 HW: {s.homework_assigned}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Therapy Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete Session #{deleteTarget?.session_number}? This action is logged in the audit trail.
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
