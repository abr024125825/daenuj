import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EMRAccessGate } from './EMRAccessGate';
import { CheckCircle, XCircle, Loader2, Brain, Clock, User, Mail, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function FileOpenRequestsContent() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialog, setRejectDialog] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['file-open-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_open_requests' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const handleApprove = async (req: any) => {
    setProcessing(req.id);
    try {
      // Generate file number
      const firstLetter = req.student_name.trim()[0]?.toUpperCase() || 'X';
      const currentMonth = new Date().getMonth() + 1;
      let semester: number;
      if (currentMonth >= 9 || currentMonth === 1) semester = 1;
      else if (currentMonth >= 2 && currentMonth <= 6) semester = 2;
      else semester = 3;
      const year = new Date().getFullYear().toString();

      const { data: fileNumber, error: fnError } = await supabase.rpc('generate_file_number', {
        _first_letter: firstLetter, _year: year, _semester: semester,
      });
      if (fnError) throw fnError;

      // Create patient
      const { data: patient, error: pErr } = await supabase.from('patients').insert({
        full_name: req.student_name,
        file_number: fileNumber,
        email: req.student_email || null,
        phone: req.student_phone || null,
        date_of_birth: req.student_dob || null,
        national_id: req.student_national_id || null,
        gender: req.gender || null,
        status: 'active',
      } as any).select().single();
      if (pErr) throw pErr;

      // Assign to approving psychologist
      const { error: assignErr } = await supabase.from('patient_provider_assignments').insert({
        patient_id: patient.id,
        provider_id: user!.id,
        assigned_by: user!.id,
        is_active: true,
      } as any);
      if (assignErr) throw assignErr;

      // Create initial encounter
      await supabase.from('encounters').insert({
        patient_id: patient.id,
        provider_id: user!.id,
        provider_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
        clinic_type: 'psychiatry',
        visit_type: 'new',
        chief_complaint: req.screening_summary ? `Screening: ${req.screening_summary}` : 'Initial intake via screening',
        status: 'in_progress',
      } as any);

      // Update request
      await supabase.from('file_open_requests' as any).update({
        status: 'approved',
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        patient_id: patient.id,
      }).eq('id', req.id);

      qc.invalidateQueries({ queryKey: ['file-open-requests'] });
      qc.invalidateQueries({ queryKey: ['my-assigned-patients'] });
      toast({ title: 'Patient file opened', description: `File #${fileNumber} created and assigned to you` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    setProcessing(selectedReq.id);
    try {
      await supabase.from('file_open_requests' as any).update({
        status: 'rejected',
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectReason,
      }).eq('id', selectedReq.id);
      qc.invalidateQueries({ queryKey: ['file-open-requests'] });
      setRejectDialog(false);
      setRejectReason('');
      setSelectedReq(null);
      toast({ title: 'Request rejected' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const pending = requests?.filter(r => r.status === 'pending') || [];
  const reviewed = requests?.filter(r => r.status !== 'pending') || [];

  const SeverityBadge = ({ s }: { s: string }) => {
    const map: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
      severe: 'destructive', moderate: 'default', mild: 'secondary', minimal: 'outline',
    };
    return <Badge variant={map[s] || 'outline'} className="text-xs capitalize">{s}</Badge>;
  };

  return (
    <DashboardLayout title="File Open Requests">
      <div className="space-y-6">
        {/* Pending */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Pending Requests ({pending.length})
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : pending.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No pending requests</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {pending.map(req => (
                <Card key={req.id} className="border-accent/30">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{req.student_name}</span>
                          {req.severity_level && <SeverityBadge s={req.severity_level} />}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {req.student_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.student_email}</span>}
                          {req.student_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{req.student_phone}</span>}
                          <span className="text-xs">{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        {req.screening_summary && (
                          <div className="p-2 rounded bg-muted/50 text-xs text-foreground">
                            <Brain className="h-3 w-3 inline mr-1 text-primary" />
                            {req.screening_summary}
                          </div>
                        )}
                        {req.suggested_icd_codes?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {req.suggested_icd_codes.map((c: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{c.code}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req)}
                          disabled={processing === req.id}
                          className="gap-1"
                        >
                          {processing === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Approve & Open File
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedReq(req); setRejectDialog(true); }}
                          disabled={processing === req.id}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reviewed */}
        {reviewed.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Reviewed ({reviewed.length})</h2>
            <div className="space-y-2">
              {reviewed.map(req => (
                <Card key={req.id} className="opacity-60">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{req.student_name}</span>
                        <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} className="text-xs capitalize">
                        {req.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject File Open Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Provide a reason for rejecting <strong>{selectedReq?.student_name}</strong>'s request:</p>
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Reason for rejection..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!!processing}>
                {processing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export function FileOpenRequestsPage() {
  return (
    <EMRAccessGate>
      <FileOpenRequestsContent />
    </EMRAccessGate>
  );
}
