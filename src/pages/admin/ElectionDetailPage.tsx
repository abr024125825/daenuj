import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useElection, useUpdateElection, useVotingBoxes, useCreateVotingBox, useDeleteVotingBox, useElectionVoters, useUploadVoters, useUpdateVotingBox } from '@/hooks/useElections';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Plus, Trash2, Box, Users, FileSpreadsheet, Vote } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export function ElectionDetailPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { user } = useAuth();
  const { data: election } = useElection(electionId);
  const updateElection = useUpdateElection();
  const { data: boxes } = useVotingBoxes(electionId);
  const createBox = useCreateVotingBox();
  const deleteBox = useDeleteVotingBox();
  const updateBox = useUpdateVotingBox();
  const { data: voters } = useElectionVoters(electionId);
  const uploadVoters = useUploadVoters();
  const { users } = useUsers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAddBox, setShowAddBox] = useState(false);
  const [boxForm, setBoxForm] = useState({ name: '', name_ar: '', location: '', location_ar: '', supervisor_id: '' });
  const [assignBoxId, setAssignBoxId] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState('');

  const handleAddBox = () => {
    if (!boxForm.name || !electionId) return;
    createBox.mutate({ ...boxForm, election_id: electionId, supervisor_id: boxForm.supervisor_id || undefined }, {
      onSuccess: () => { setShowAddBox(false); setBoxForm({ name: '', name_ar: '', location: '', location_ar: '', supervisor_id: '' }); },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !electionId) return;

    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws);

      const voterData = rows.map((row: any) => ({
        election_id: electionId,
        student_name: String(row['Name'] || row['name'] || row['Student Name'] || row['student_name'] || ''),
        student_name_ar: String(row['الاسم'] || row['name_ar'] || row['student_name_ar'] || ''),
        university_id: String(row['University ID'] || row['university_id'] || row['ID'] || row['الرقم الجامعي'] || ''),
        faculty_name: String(row['Faculty'] || row['faculty'] || row['faculty_name'] || ''),
        faculty_name_ar: String(row['الكلية'] || row['faculty_ar'] || row['faculty_name_ar'] || ''),
        national_id: String(row['National ID'] || row['national_id'] || row['الرقم الوطني'] || ''),
        box_id: null,
      })).filter(v => v.student_name && v.university_id);

      if (!voterData.length) {
        toast({ title: 'No valid records found', description: 'Check column headers: Name, University ID, Faculty', variant: 'destructive' });
        return;
      }

      uploadVoters.mutate({ electionId, voters: voterData });
    } catch (err: any) {
      toast({ title: 'Error reading file', description: err.message, variant: 'destructive' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAssignVotersToBox = async () => {
    if (!assignBoxId || !electionId) return;
    // Assign unassigned voters with matching faculty to this box
    const unassigned = voters?.filter(v => !v.box_id && (!selectedFaculty || v.faculty_name === selectedFaculty)) || [];
    if (!unassigned.length) {
      toast({ title: 'No voters to assign' });
      return;
    }

    const ids = unassigned.map(v => v.id);
    // Batch update in chunks
    const batchSize = 500;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await (supabase as any).from('election_voters').update({ box_id: assignBoxId }).in('id', batch);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: `${ids.length} voters assigned to box` });
    setAssignBoxId(null);
  };

  const supervisors = users?.filter(u => u.role === 'admin' || u.role === 'supervisor') || [];
  const faculties = [...new Set(voters?.map(v => v.faculty_name).filter(Boolean) || [])];

  if (!election) return <DashboardLayout title="Election"><div className="animate-pulse h-96" /></DashboardLayout>;

  return (
    <DashboardLayout title="Election Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Vote className="h-6 w-6 text-primary" />
              {election.name}
            </h1>
            {election.name_ar && <p className="text-muted-foreground font-cairo" dir="rtl">{election.name_ar}</p>}
          </div>
          <div className="flex gap-2">
            {election.status === 'draft' && (
              <Button onClick={() => updateElection.mutate({ id: election.id, status: 'active' })} className="bg-emerald-600 hover:bg-emerald-700">
                🟢 Activate Election
              </Button>
            )}
            {election.status === 'active' && (
              <Button variant="destructive" onClick={() => updateElection.mutate({ id: election.id, status: 'closed' })}>
                ⚫ Close Election
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold">{voters?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total Voters / إجمالي الناخبين</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Box className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold">{boxes?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Voting Boxes / صناديق التصويت</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Vote className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-3xl font-bold">{voters?.filter(v => v.has_voted).length || 0}</div>
              <p className="text-sm text-muted-foreground">Checked In / تم التأشير</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="boxes">
          <TabsList>
            <TabsTrigger value="boxes" className="gap-1"><Box className="h-4 w-4" /> Boxes</TabsTrigger>
            <TabsTrigger value="voters" className="gap-1"><Users className="h-4 w-4" /> Voters</TabsTrigger>
          </TabsList>

          {/* Boxes Tab */}
          <TabsContent value="boxes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Voting Boxes / صناديق التصويت</h2>
              <Dialog open={showAddBox} onOpenChange={setShowAddBox}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Box</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Voting Box</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={boxForm.name} onChange={e => setBoxForm(f => ({ ...f, name: e.target.value }))} placeholder="Box A - Engineering" /></div>
                    <div><Label>الاسم بالعربي</Label><Input value={boxForm.name_ar} onChange={e => setBoxForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="صندوق أ - الهندسة" dir="rtl" className="font-cairo" /></div>
                    <div><Label>Location</Label><Input value={boxForm.location} onChange={e => setBoxForm(f => ({ ...f, location: e.target.value }))} placeholder="Building A, Floor 1" /></div>
                    <div><Label>الموقع</Label><Input value={boxForm.location_ar} onChange={e => setBoxForm(f => ({ ...f, location_ar: e.target.value }))} placeholder="المبنى أ، الطابق 1" dir="rtl" className="font-cairo" /></div>
                    <div>
                      <Label>Supervisor</Label>
                      <Select value={boxForm.supervisor_id} onValueChange={v => setBoxForm(f => ({ ...f, supervisor_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
                        <SelectContent>
                          {supervisors.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddBox} disabled={createBox.isPending} className="w-full">Add Box</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boxes?.map(box => {
                const boxVoters = voters?.filter(v => v.box_id === box.id) || [];
                const voted = boxVoters.filter(v => v.has_voted).length;
                return (
                  <Card key={box.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{box.name}</CardTitle>
                          {box.name_ar && <p className="text-xs text-muted-foreground font-cairo" dir="rtl">{box.name_ar}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBox.mutate(box.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">{box.location || 'No location set'}</div>
                      <div className="flex gap-4 text-sm">
                        <span><strong>{boxVoters.length}</strong> voters</span>
                        <span className="text-emerald-600"><strong>{voted}</strong> checked in</span>
                        <span className="text-muted-foreground">{boxVoters.length > 0 ? Math.round((voted / boxVoters.length) * 100) : 0}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Voters Tab */}
          <TabsContent value="voters" className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="font-semibold">Voters / الناخبين ({voters?.length || 0})</h2>
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()} disabled={uploadVoters.isPending}>
                  <FileSpreadsheet className="h-4 w-4" /> {uploadVoters.isPending ? 'Uploading...' : 'Upload Excel'}
                </Button>
                {boxes && boxes.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1"><Users className="h-4 w-4" /> Assign to Box</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Assign Voters to Box</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>Filter by Faculty (optional)</Label>
                          <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                            <SelectTrigger><SelectValue placeholder="All faculties" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value=" ">All Faculties</SelectItem>
                              {faculties.map(f => <SelectItem key={f} value={f!}>{f}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Assign to Box</Label>
                          <Select value={assignBoxId || ''} onValueChange={setAssignBoxId}>
                            <SelectTrigger><SelectValue placeholder="Select box" /></SelectTrigger>
                            <SelectContent>
                              {boxes.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Unassigned voters{selectedFaculty ? ` from ${selectedFaculty}` : ''}: <strong>{voters?.filter(v => !v.box_id && (!selectedFaculty || selectedFaculty === ' ' || v.faculty_name === selectedFaculty)).length || 0}</strong>
                        </p>
                        <Button onClick={handleAssignVotersToBox} className="w-full">Assign</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <Card>
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>University ID</TableHead>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Box</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voters?.slice(0, 200).map(voter => (
                      <TableRow key={voter.id}>
                        <TableCell>
                          <div>{voter.student_name}</div>
                          {voter.student_name_ar && <div className="text-xs text-muted-foreground font-cairo" dir="rtl">{voter.student_name_ar}</div>}
                        </TableCell>
                        <TableCell className="font-mono">{voter.university_id}</TableCell>
                        <TableCell>{voter.faculty_name}</TableCell>
                        <TableCell>{boxes?.find(b => b.id === voter.box_id)?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          {voter.has_voted ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">✓ Voted</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {voters && voters.length > 200 && (
                <div className="p-3 text-center text-sm text-muted-foreground border-t">
                  Showing first 200 of {voters.length} voters
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Need supabase import for batch assign
import { supabase } from '@/integrations/supabase/client';
