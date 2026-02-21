import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useElection, useElectionVoters, useVotingBoxes, useCheckInVoter, useUndoCheckIn } from '@/hooks/useElections';
import { useAuth } from '@/contexts/AuthContext';
import { Search, CheckCircle2, XCircle, Vote, Users, Undo2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function ElectionCheckInPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const { user } = useAuth();
  const { data: election } = useElection(electionId);
  const { data: boxes } = useVotingBoxes(electionId);
  const checkIn = useCheckInVoter();
  const undoCheckIn = useUndoCheckIn();

  // Find box assigned to current supervisor
  const myBox = boxes?.find(b => b.supervisor_id === user?.id);
  const boxId = myBox?.id;

  const { data: voters, refetch } = useElectionVoters(electionId, boxId);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Realtime subscription
  useEffect(() => {
    if (!electionId) return;
    const channel = supabase
      .channel('election-checkin')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'election_voters', filter: `election_id=eq.${electionId}` }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [electionId, refetch]);

  const filtered = voters?.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.student_name.toLowerCase().includes(q) ||
      (v.student_name_ar || '').includes(q) ||
      v.university_id.toLowerCase().includes(q) ||
      (v.national_id || '').includes(q);
  }) || [];

  const handleCheckIn = (voterId: string) => {
    if (!user) return;
    checkIn.mutate({ voterId, checkedInBy: user.id }, {
      onSuccess: () => {
        toast({ title: '✓ Voter checked in / تم التأشير' });
        setSearch('');
        searchRef.current?.focus();
      },
    });
  };

  const handleUndo = (voterId: string) => {
    undoCheckIn.mutate(voterId, {
      onSuccess: () => toast({ title: 'Check-in undone / تم التراجع' }),
    });
  };

  const totalVoters = voters?.length || 0;
  const votedCount = voters?.filter(v => v.has_voted).length || 0;
  const percentage = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

  if (!election) return <DashboardLayout title="Check-in"><div className="animate-pulse h-96" /></DashboardLayout>;

  return (
    <DashboardLayout title="Election Check-in">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Vote className="h-6 w-6 text-primary" />
            Check-in: {election.name}
          </h1>
          {myBox && (
            <p className="text-muted-foreground">
              Box: <strong>{myBox.name}</strong> {myBox.location && `· ${myBox.location}`}
              {myBox.name_ar && <span className="font-cairo mr-2" dir="rtl"> / {myBox.name_ar}</span>}
            </p>
          )}
          {!myBox && boxes && boxes.length > 0 && (
            <p className="text-amber-600">⚠ You are not assigned as a supervisor to any box. Showing all voters.</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{totalVoters}</div>
              <p className="text-xs text-muted-foreground">Total / المجموع</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{votedCount}</div>
              <p className="text-xs text-muted-foreground">Checked In / مُؤشَّر</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{percentage}%</div>
              <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, university ID, or national ID / ابحث بالاسم أو الرقم الجامعي"
            className="pl-10 h-12 text-lg"
            autoFocus
          />
        </div>

        {/* Voter List */}
        <Card>
          <div className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / الاسم</TableHead>
                  <TableHead>University ID</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {search ? 'No voters found / لم يتم العثور على ناخبين' : 'No voters in this box'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 100).map(voter => (
                    <TableRow key={voter.id} className={voter.has_voted ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''}>
                      <TableCell>
                        <div className="font-medium">{voter.student_name}</div>
                        {voter.student_name_ar && <div className="text-xs text-muted-foreground font-cairo" dir="rtl">{voter.student_name_ar}</div>}
                      </TableCell>
                      <TableCell className="font-mono">{voter.university_id}</TableCell>
                      <TableCell className="text-sm">{voter.faculty_name}</TableCell>
                      <TableCell>
                        {voter.has_voted ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Voted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {voter.has_voted ? (
                          <Button variant="ghost" size="sm" onClick={() => handleUndo(voter.id)} className="text-muted-foreground gap-1">
                            <Undo2 className="h-3.5 w-3.5" /> Undo
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleCheckIn(voter.id)} disabled={checkIn.isPending} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Check In
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 100 && (
            <div className="p-3 text-center text-sm text-muted-foreground border-t">
              Showing first 100 of {filtered.length} results. Narrow your search.
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
