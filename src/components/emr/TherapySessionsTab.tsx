import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useTherapySessions, useCreateTherapySession } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2 } from 'lucide-react';

export function TherapySessionsTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const { data: sessions, isLoading } = useTherapySessions(patientId);
  const createSession = useCreateTherapySession();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    subjective: '', objective: '', assessment: '', plan: '',
    homework_assigned: '', response_to_intervention: '', functional_status_score: 5,
  });

  const nextSessionNumber = (sessions?.length || 0) + 1;

  const handleCreate = async () => {
    await createSession.mutateAsync({
      patient_id: patientId,
      session_number: nextSessionNumber,
      provider_id: user?.id,
      ...form,
      functional_status_score: form.functional_status_score,
    });
    setIsOpen(false);
    setForm({ subjective: '', objective: '', assessment: '', plan: '', homework_assigned: '', response_to_intervention: '', functional_status_score: 5 });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Therapy Sessions ({sessions?.length || 0})</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Session</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Session #{nextSessionNumber} — SOAP Note</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>S — Subjective (Patient's Report)</Label>
                <Textarea value={form.subjective} onChange={e => setForm(f => ({ ...f, subjective: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>O — Objective (Clinical Observations)</Label>
                <Textarea value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>A — Assessment</Label>
                <Textarea value={form.assessment} onChange={e => setForm(f => ({ ...f, assessment: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>P — Plan (Next Session)</Label>
                <Textarea value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>Homework Assigned</Label>
                <Textarea value={form.homework_assigned} onChange={e => setForm(f => ({ ...f, homework_assigned: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>Response to Intervention</Label>
                <Textarea value={form.response_to_intervention} onChange={e => setForm(f => ({ ...f, response_to_intervention: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>Functional Status Score: {form.functional_status_score}/10</Label>
                <Slider value={[form.functional_status_score]} onValueChange={v => setForm(f => ({ ...f, functional_status_score: v[0] }))} min={1} max={10} step={1} className="mt-2" />
              </div>
              <Button onClick={handleCreate} disabled={createSession.isPending} className="w-full">Save Session</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!sessions?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No therapy sessions recorded</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Card key={s.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Session #{s.session_number}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString()}</span>
                  </div>
                  {s.functional_status_score && (
                    <Badge variant={s.functional_status_score >= 7 ? 'default' : s.functional_status_score >= 4 ? 'secondary' : 'destructive'} className="text-xs">
                      Functional: {s.functional_status_score}/10
                    </Badge>
                  )}
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
    </div>
  );
}
