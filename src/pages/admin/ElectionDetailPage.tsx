import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useElection, useUpdateElection, useVotingBoxes, useCreateVotingBox, useDeleteVotingBox, useElectionVoters, useUploadVoters, useUpdateVotingBox } from '@/hooks/useElections';
import { useFaculties } from '@/hooks/useFaculties';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Plus, Trash2, Box, Users, FileSpreadsheet, Vote, Shield, Globe, Download, Shuffle, UserPlus, Key, Printer, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export function ElectionDetailPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
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
  const { data: faculties } = useFaculties();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAddBox, setShowAddBox] = useState(false);
  const [boxForm, setBoxForm] = useState({ name: '', name_ar: '', location: '', location_ar: '', supervisor_id: '', allowed_ip: '', faculty_id: '' });
  const [assignBoxId, setAssignBoxId] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [distributing, setDistributing] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [deletingAllVoters, setDeletingAllVoters] = useState(false);
  const [deletingElection, setDeletingElection] = useState(false);

  const handleAddBox = () => {
    if (!boxForm.name || !electionId) return;
    createBox.mutate({
      ...boxForm,
      election_id: electionId,
      supervisor_id: boxForm.supervisor_id || undefined,
      faculty_id: boxForm.faculty_id || undefined,
    } as any, {
      onSuccess: () => {
        setShowAddBox(false);
        setBoxForm({ name: '', name_ar: '', location: '', location_ar: '', supervisor_id: '', allowed_ip: '', faculty_id: '' });
      },
    });
  };

  // Create supervisor account for a box
  const handleCreateAccount = async (boxId: string) => {
    if (!accountForm.email || !accountForm.password || !accountForm.first_name) return;
    setCreatingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-coordinator', {
        body: {
          email: accountForm.email,
          password: accountForm.password,
          first_name: accountForm.first_name,
          last_name: accountForm.last_name || '',
          role: 'supervisor',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Assign the new user as supervisor of this box
      const userId = data.user_id;
      await supabase.from('voting_boxes').update({ supervisor_id: userId }).eq('id', boxId);

      toast({ title: 'Account created and assigned to box' });
      setShowCreateAccount(null);
      setAccountForm({ email: '', password: '', first_name: '', last_name: '' });
      // Refresh
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setCreatingAccount(false);
  };

  // Download Excel template
  const handleDownloadTemplate = () => {
    const templateData = [{
      'Name': 'John Doe', 'University ID': '20210001', 'Faculty': 'Engineering',
      'National ID': '1234567890', 'الاسم': 'جون دو', 'الكلية': 'الهندسة',
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Voters');
    XLSX.writeFile(wb, 'election_voters_template.xlsx');
    toast({ title: 'Template downloaded' });
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
        toast({ title: 'No valid records found', variant: 'destructive' });
        return;
      }
      uploadVoters.mutate({ electionId, voters: voterData });
    } catch (err: any) {
      toast({ title: 'Error reading file', description: err.message, variant: 'destructive' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Auto-distribute based on faculty if boxes have faculty_id, otherwise round-robin
  const handleAutoDistribute = async () => {
    if (!electionId || !boxes || boxes.length === 0) {
      toast({ title: 'No boxes available', variant: 'destructive' });
      return;
    }
    const unassigned = voters?.filter(v => !v.box_id) || [];
    if (unassigned.length === 0) {
      toast({ title: 'All voters are already assigned' });
      return;
    }
    setDistributing(true);
    try {
      // Check if boxes have faculty assignments
      const boxesWithFaculty = boxes.filter(b => (b as any).faculty_id);
      
      if (boxesWithFaculty.length > 0) {
        // Faculty-based distribution: get faculty names
        const facultyMap: Record<string, string> = {};
        if (faculties) {
          for (const f of faculties) {
            facultyMap[f.id] = f.name;
          }
        }
        
        const updates: { id: string; box_id: string }[] = [];
        const remainingVoters: typeof unassigned = [];
        
        for (const voter of unassigned) {
          // Find box matching voter's faculty
          const matchingBox = boxesWithFaculty.find(b => {
            const boxFacultyName = facultyMap[(b as any).faculty_id];
            return boxFacultyName && voter.faculty_name && 
              voter.faculty_name.toLowerCase().includes(boxFacultyName.toLowerCase());
          });
          if (matchingBox) {
            updates.push({ id: voter.id, box_id: matchingBox.id });
          } else {
            remainingVoters.push(voter);
          }
        }

        // Distribute remaining round-robin across all boxes
        const shuffled = [...remainingVoters].sort(() => Math.random() - 0.5);
        const boxIds = boxes.map(b => b.id);
        shuffled.forEach((v, i) => {
          updates.push({ id: v.id, box_id: boxIds[i % boxIds.length] });
        });

        // Batch update
        const groupedByBox: Record<string, string[]> = {};
        updates.forEach(u => {
          if (!groupedByBox[u.box_id]) groupedByBox[u.box_id] = [];
          groupedByBox[u.box_id].push(u.id);
        });
        for (const [boxId, voterIds] of Object.entries(groupedByBox)) {
          for (let i = 0; i < voterIds.length; i += 500) {
            const batch = voterIds.slice(i, i + 500);
            const { error } = await supabase.from('election_voters').update({ box_id: boxId }).in('id', batch);
            if (error) throw error;
          }
        }
      } else {
        // Simple round-robin
        const shuffled = [...unassigned].sort(() => Math.random() - 0.5);
        const boxIds = boxes.map(b => b.id);
        const groupedByBox: Record<string, string[]> = {};
        shuffled.forEach((v, i) => {
          const bid = boxIds[i % boxIds.length];
          if (!groupedByBox[bid]) groupedByBox[bid] = [];
          groupedByBox[bid].push(v.id);
        });
        for (const [boxId, voterIds] of Object.entries(groupedByBox)) {
          for (let i = 0; i < voterIds.length; i += 500) {
            const batch = voterIds.slice(i, i + 500);
            const { error } = await supabase.from('election_voters').update({ box_id: boxId }).in('id', batch);
            if (error) throw error;
          }
        }
      }

      toast({ title: `${unassigned.length} voters distributed across ${boxes.length} boxes` });
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Distribution failed', description: err.message, variant: 'destructive' });
    }
    setDistributing(false);
  };

  const handleAssignVotersToBox = async () => {
    if (!assignBoxId || !electionId) return;
    const unassigned = voters?.filter(v => !v.box_id && (!selectedFaculty || selectedFaculty === ' ' || v.faculty_name === selectedFaculty)) || [];
    if (!unassigned.length) {
      toast({ title: 'No voters to assign' });
      return;
    }
    const ids = unassigned.map(v => v.id);
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { error } = await supabase.from('election_voters').update({ box_id: assignBoxId }).in('id', batch);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: `${ids.length} voters assigned to box` });
    setAssignBoxId(null);
  };

  // Delete all voters
  const handleDeleteAllVoters = async () => {
    if (!electionId) return;
    setDeletingAllVoters(true);
    const { error } = await supabase.from('election_voters').delete().eq('election_id', electionId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'All voters deleted' });
      window.location.reload();
    }
    setDeletingAllVoters(false);
  };

  // Delete entire election
  const handleDeleteElection = async () => {
    if (!electionId) return;
    setDeletingElection(true);
    const { error } = await supabase.from('elections').delete().eq('id', electionId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Election deleted' });
      navigate('/dashboard/elections');
    }
    setDeletingElection(false);
  };

  // Print token for a box as PDF
  const handlePrintToken = (box: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('CONFIDENTIAL - Box Access Token', 20, 30);
    doc.setFontSize(12);
    doc.text(`Election: ${election?.name || ''}`, 20, 50);
    doc.text(`Box: ${box.name}`, 20, 60);
    doc.text(`Location: ${box.location || 'N/A'}`, 20, 70);
    doc.text(`Allowed IP: ${box.allowed_ip || 'Not set'}`, 20, 80);
    doc.setFontSize(24);
    doc.setTextColor(0, 100, 0);
    doc.text(`Token: ${box.access_token || 'N/A'}`, 20, 105);
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text('This token is required to access the election booth check-in system.', 20, 125);
    doc.text('Keep this document secure. Do not share it publicly.', 20, 133);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 145);
    doc.save(`token-${box.name.replace(/\s+/g, '-')}.pdf`);
    toast({ title: 'Token PDF downloaded' });
  };

  // Print all tokens
  const handlePrintAllTokens = () => {
    if (!boxes || boxes.length === 0) return;
    boxes.forEach(box => handlePrintToken(box));
    toast({ title: `${boxes.length} token PDFs downloaded` });
  };

  const supervisors = users?.filter(u => u.role === 'admin' || u.role === 'supervisor') || [];
  const voterFaculties = [...new Set(voters?.map(v => v.faculty_name).filter(Boolean) || [])];
  const unassignedCount = voters?.filter(v => !v.box_id).length || 0;

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
            {election.name_ar && <p className="text-muted-foreground" dir="rtl">{election.name_ar}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1">
                  <Trash2 className="h-4 w-4" /> Delete Election
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Election</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this election, all voting boxes, and all voter data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteElection} disabled={deletingElection} className="bg-destructive text-destructive-foreground">
                    {deletingElection ? 'Deleting...' : 'Delete Forever'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold">{voters?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total Voters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Box className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold">{boxes?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Voting Boxes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Vote className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-3xl font-bold">{voters?.filter(v => v.has_voted).length || 0}</div>
              <p className="text-sm text-muted-foreground">Checked In</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Shuffle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <div className="text-3xl font-bold">{unassignedCount}</div>
              <p className="text-sm text-muted-foreground">Unassigned</p>
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
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="font-semibold">Voting Boxes</h2>
              <div className="flex gap-2">
                {boxes && boxes.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={handlePrintAllTokens}>
                    <Printer className="h-4 w-4" /> Print All Tokens
                  </Button>
                )}
                <Dialog open={showAddBox} onOpenChange={setShowAddBox}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Box</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Voting Box</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Name</Label><Input value={boxForm.name} onChange={e => setBoxForm(f => ({ ...f, name: e.target.value }))} placeholder="Box A - Engineering" /></div>
                      <div><Label>Name (Arabic)</Label><Input value={boxForm.name_ar} onChange={e => setBoxForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="صندوق أ" dir="rtl" /></div>
                      <div><Label>Location</Label><Input value={boxForm.location} onChange={e => setBoxForm(f => ({ ...f, location: e.target.value }))} placeholder="Building A, Floor 1" /></div>
                      <div><Label>Location (Arabic)</Label><Input value={boxForm.location_ar} onChange={e => setBoxForm(f => ({ ...f, location_ar: e.target.value }))} placeholder="المبنى أ" dir="rtl" /></div>
                      <div>
                        <Label>Faculty (for auto-distribution)</Label>
                        <Select value={boxForm.faculty_id} onValueChange={v => setBoxForm(f => ({ ...f, faculty_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select faculty (optional)" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">No Faculty</SelectItem>
                            {faculties?.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                      <div>
                        <Label>Allowed IP Address</Label>
                        <Input value={boxForm.allowed_ip} onChange={e => setBoxForm(f => ({ ...f, allowed_ip: e.target.value }))} placeholder="e.g. 192.168.1.100" />
                        <p className="text-xs text-muted-foreground mt-1">Device restricted to this IP only</p>
                      </div>
                      <Button onClick={handleAddBox} disabled={createBox.isPending} className="w-full">Add Box</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boxes?.map(box => {
                const boxVoters = voters?.filter(v => v.box_id === box.id) || [];
                const voted = boxVoters.filter(v => v.has_voted).length;
                const boxAny = box as any;
                return (
                  <Card key={box.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{box.name}</CardTitle>
                          {box.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{box.name_ar}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBox.mutate(box.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">{box.location || 'No location set'}</div>
                      <div className="flex gap-4 text-sm">
                        <span><strong>{boxVoters.length}</strong> voters</span>
                        <span className="text-emerald-600"><strong>{voted}</strong> checked in</span>
                        <span className="text-muted-foreground">{boxVoters.length > 0 ? Math.round((voted / boxVoters.length) * 100) : 0}%</span>
                      </div>

                      {/* Access Token */}
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1">{boxAny.access_token || 'Generating...'}</code>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handlePrintToken(boxAny)}>
                          <Printer className="h-3 w-3" /> Print
                        </Button>
                      </div>

                      {/* IP Management */}
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          className="h-7 text-xs flex-1"
                          placeholder="Set allowed IP"
                          defaultValue={boxAny.allowed_ip || ''}
                          onBlur={e => {
                            const newIp = e.target.value.trim();
                            if (newIp !== (boxAny.allowed_ip || '')) {
                              updateBox.mutate({ id: box.id, allowed_ip: newIp || null } as any);
                            }
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                        {boxAny.allowed_ip && (
                          <Badge variant="outline" className="text-xs gap-1 shrink-0">
                            <Shield className="h-3 w-3" /> Locked
                          </Badge>
                        )}
                      </div>

                      {/* Supervisor / Create Account */}
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                        {box.supervisor_id ? (
                          <span className="text-xs text-muted-foreground">
                            Supervisor: {users?.find(u => u.id === box.supervisor_id)?.first_name || 'Assigned'} {users?.find(u => u.id === box.supervisor_id)?.last_name || ''}
                          </span>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowCreateAccount(box.id)}>
                            <UserPlus className="h-3 w-3" /> Create Account
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Create Account Dialog */}
            <Dialog open={!!showCreateAccount} onOpenChange={open => { if (!open) setShowCreateAccount(null); }}>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Supervisor Account</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Create a new account for the box supervisor. This account will be bound to the box and its IP address.
                </p>
                <div className="space-y-3">
                  <div><Label>Email</Label><Input value={accountForm.email} onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))} placeholder="supervisor@example.com" /></div>
                  <div><Label>Password</Label><Input type="password" value={accountForm.password} onChange={e => setAccountForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimum 6 characters" /></div>
                  <div><Label>First Name</Label><Input value={accountForm.first_name} onChange={e => setAccountForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" /></div>
                  <div><Label>Last Name</Label><Input value={accountForm.last_name} onChange={e => setAccountForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" /></div>
                  <Button onClick={() => showCreateAccount && handleCreateAccount(showCreateAccount)} disabled={creatingAccount || !accountForm.email || !accountForm.password} className="w-full">
                    {creatingAccount ? 'Creating...' : 'Create Account & Assign'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Voters Tab */}
          <TabsContent value="voters" className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="font-semibold">Voters ({voters?.length || 0})</h2>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4" /> Download Template
                </Button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()} disabled={uploadVoters.isPending}>
                  <FileSpreadsheet className="h-4 w-4" /> {uploadVoters.isPending ? 'Uploading...' : 'Upload Excel'}
                </Button>
                {boxes && boxes.length > 0 && unassignedCount > 0 && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={handleAutoDistribute} disabled={distributing}>
                    <Shuffle className="h-4 w-4" /> {distributing ? 'Distributing...' : `Auto-Distribute (${unassignedCount})`}
                  </Button>
                )}
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
                              {voterFaculties.map(f => <SelectItem key={f} value={f!}>{f}</SelectItem>)}
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
                          Unassigned voters{selectedFaculty && selectedFaculty !== ' ' ? ` from ${selectedFaculty}` : ''}: <strong>{voters?.filter(v => !v.box_id && (!selectedFaculty || selectedFaculty === ' ' || v.faculty_name === selectedFaculty)).length || 0}</strong>
                        </p>
                        <Button onClick={handleAssignVotersToBox} className="w-full">Assign</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {voters && voters.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1">
                        <Trash2 className="h-4 w-4" /> Delete All Voters
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Delete All Voters</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {voters.length} voters from this election. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllVoters} disabled={deletingAllVoters} className="bg-destructive text-destructive-foreground">
                          {deletingAllVoters ? 'Deleting...' : 'Delete All'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
                          {voter.student_name_ar && <div className="text-xs text-muted-foreground" dir="rtl">{voter.student_name_ar}</div>}
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
