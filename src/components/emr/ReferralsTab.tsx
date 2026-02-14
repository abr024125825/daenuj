import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReferrals, useCreateReferral, useUpdateReferral } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2 } from 'lucide-react';

export function ReferralsTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const { data: referrals, isLoading } = useReferrals(patientId);
  const createRef = useCreateReferral();
  const updateRef = useUpdateReferral();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    referral_type: 'internal', referred_to: '', specialty: '', reason: '', urgency: 'routine',
  });

  const handleCreate = async () => {
    if (!form.referred_to || !form.reason) return;
    await createRef.mutateAsync({ patient_id: patientId, referred_by: user?.id, ...form });
    setIsOpen(false);
    setForm({ referral_type: 'internal', referred_to: '', specialty: '', reason: '', urgency: 'routine' });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">Referrals ({referrals?.length || 0})</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Referral</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Referral</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.referral_type} onValueChange={v => setForm(f => ({ ...f, referral_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergent">Emergent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Referred To *</Label><Input value={form.referred_to} onChange={e => setForm(f => ({ ...f, referred_to: e.target.value }))} placeholder="e.g. Neurology, Social Worker" /></div>
              <div><Label>Specialty</Label><Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} /></div>
              <div><Label>Reason *</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} /></div>
              <Button onClick={handleCreate} disabled={createRef.isPending} className="w-full">Create Referral</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!referrals?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No referrals</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {referrals.map(r => (
            <Card key={r.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{r.referred_to}</span>
                    <Badge variant="outline" className="text-xs">{r.referral_type}</Badge>
                    <Badge variant={r.urgency === 'emergent' ? 'destructive' : r.urgency === 'urgent' ? 'secondary' : 'outline'} className="text-xs">{r.urgency}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === 'completed' ? 'default' : r.status === 'pending' ? 'secondary' : 'outline'} className="text-xs">{r.status}</Badge>
                  {r.status === 'pending' && (
                    <Button variant="ghost" size="sm" onClick={() => updateRef.mutate({ id: r.id, status: 'completed', completed_at: new Date().toISOString() })}>
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
