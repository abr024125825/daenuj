import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatientDocuments, useCreateDocument } from '@/hooks/useEMR';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, FileText, Lock } from 'lucide-react';

interface DocumentsTabProps {
  patientId: string;
  encounterId?: string;
  isSigned?: boolean;
}

export function DocumentsTab({ patientId, encounterId, isSigned = false }: DocumentsTabProps) {
  const { user } = useAuth();
  const { data: docs, isLoading } = usePatientDocuments(patientId);
  const createDoc = useCreateDocument();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    document_type: 'consent', title: '', notes: '', file_name: '',
  });

  const handleCreate = async () => {
    if (!form.title) return;
    await createDoc.mutateAsync({ patient_id: patientId, uploaded_by: user?.id, encounter_id: encounterId || null, ...form });
    setIsOpen(false);
    setForm({ document_type: 'consent', title: '', notes: '', file_name: '' });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const filteredDocs = encounterId
    ? docs?.filter(d => d.encounter_id === encounterId)
    : docs;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-foreground">
          Documents ({filteredDocs?.length || 0})
          {isSigned && <Lock className="inline h-4 w-4 ml-2 text-muted-foreground" />}
        </h3>
        {!isSigned && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Document</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consent">Consent Form</SelectItem>
                      <SelectItem value="psychological_scale">Psychological Scale</SelectItem>
                      <SelectItem value="legal_report">Legal Report</SelectItem>
                      <SelectItem value="court_request">Court Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label>File Name</Label><Input value={form.file_name} onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))} placeholder="e.g. consent_form.pdf" /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
                <Button onClick={handleCreate} disabled={createDoc.isPending} className="w-full">Save Document</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!filteredDocs?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No documents uploaded</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map(d => (
            <Card key={d.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.file_name || 'No file'} · {new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs capitalize">{d.document_type?.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
