import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, CheckCircle2, XCircle, Vote, Undo2, ShieldAlert, LogOut, Wifi } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface BoothSession {
  userId: string;
  boxId: string;
  boxName: string;
  boxNameAr: string | null;
  electionName: string;
  electionNameAr: string | null;
  electionId: string;
}

interface Voter {
  id: string;
  student_name: string;
  student_name_ar: string | null;
  university_id: string;
  faculty_name: string | null;
  faculty_name_ar: string | null;
  national_id: string | null;
  has_voted: boolean;
  voted_at: string | null;
}

async function getClientIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

export function ElectionBoothPage() {
  const [session, setSession] = useState<BoothSession | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ipError, setIpError] = useState('');
  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Check existing auth session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        validateAndSetup(data.session.user.id);
      }
    });
  }, []);

  const validateAndSetup = async (userId: string) => {
    setLoading(true);
    setIpError('');
    try {
      // Find box assigned to this user
      const { data: boxes, error: boxErr } = await supabase
        .from('voting_boxes')
        .select('*')
        .eq('supervisor_id', userId);
      if (boxErr) throw boxErr;
      if (!boxes || boxes.length === 0) {
        setIpError('This account is not assigned to any voting box.\nهذا الحساب غير مخصص لأي صندوق تصويت.');
        setLoading(false);
        return;
      }

      const box = boxes[0];

      // IP validation
      const clientIP = await getClientIP();
      if (box.allowed_ip && box.allowed_ip !== clientIP) {
        setIpError(`Access denied. This account is bound to a different device.\nتم رفض الوصول. هذا الحساب مرتبط بجهاز آخر.\n\nYour IP: ${clientIP}\nAllowed IP: ${box.allowed_ip}`);
        setLoading(false);
        return;
      }

      // Bind IP on first access
      if (!box.allowed_ip) {
        await supabase.from('voting_boxes').update({ allowed_ip: clientIP }).eq('id', box.id);
      }

      // Get election info
      const { data: election } = await supabase
        .from('elections')
        .select('id, name, name_ar')
        .eq('id', box.election_id)
        .single();

      setSession({
        userId,
        boxId: box.id,
        boxName: box.name,
        boxNameAr: box.name_ar,
        electionName: election?.name || '',
        electionNameAr: election?.name_ar || null,
        electionId: box.election_id,
      });

      // Load voters
      loadVoters(box.election_id, box.id);
    } catch (err: any) {
      setIpError(err.message);
    }
    setLoading(false);
  };

  const loadVoters = async (electionId: string, boxId: string) => {
    const { data, error } = await supabase
      .from('election_voters')
      .select('id, student_name, student_name_ar, university_id, faculty_name, faculty_name_ar, national_id, has_voted, voted_at')
      .eq('election_id', electionId)
      .eq('box_id', boxId)
      .order('student_name');
    if (!error && data) setVoters(data);
  };

  // Realtime
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('booth-realtime')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'election_voters',
        filter: `election_id=eq.${session.electionId}`,
      }, () => {
        loadVoters(session.electionId, session.boxId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const handleLogin = async () => {
    setLoading(true);
    setIpError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIpError(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      validateAndSetup(data.user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setVoters([]);
    setSearch('');
    setEmail('');
    setPassword('');
  };

  const handleCheckIn = async (voterId: string) => {
    if (!session) return;
    setCheckingIn(true);
    const { error } = await supabase
      .from('election_voters')
      .update({ has_voted: true, voted_at: new Date().toISOString(), checked_in_by: session.userId })
      .eq('id', voterId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✓ تم التأشير / Checked In' });
      setSearch('');
      searchRef.current?.focus();
      loadVoters(session.electionId, session.boxId);
    }
    setCheckingIn(false);
  };

  const handleUndo = async (voterId: string) => {
    if (!session) return;
    const { error } = await supabase
      .from('election_voters')
      .update({ has_voted: false, voted_at: null, checked_in_by: null })
      .eq('id', voterId);
    if (!error) {
      toast({ title: 'تم التراجع / Undone' });
      loadVoters(session.electionId, session.boxId);
    }
  };

  const filtered = voters.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.student_name.toLowerCase().includes(q) ||
      (v.student_name_ar || '').includes(q) ||
      v.university_id.toLowerCase().includes(q) ||
      (v.national_id || '').includes(q);
  });

  const totalVoters = voters.length;
  const votedCount = voters.filter(v => v.has_voted).length;
  const percentage = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Toaster />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Vote className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle className="text-xl">Election Booth Login</CardTitle>
            <p className="text-sm text-muted-foreground font-cairo" dir="rtl">تسجيل دخول صندوق التصويت</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {ipError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex gap-2">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap text-xs">{ipError}</pre>
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="supervisor@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? 'Checking... / جاري التحقق...' : 'Login / تسجيل الدخول'}
            </Button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
              <Wifi className="h-3 w-3" />
              <span>IP-bound access / وصول مربوط بالجهاز</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KIOSK CHECK-IN SCREEN
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Vote className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg leading-tight">{session.electionName}</h1>
            {session.electionNameAr && <p className="text-xs text-muted-foreground font-cairo" dir="rtl">{session.electionNameAr}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            {session.boxName}
            {session.boxNameAr && <span className="font-cairo">/ {session.boxNameAr}</span>}
          </Badge>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold">{totalVoters}</div>
              <p className="text-xs text-muted-foreground">Total / المجموع</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-emerald-600">{votedCount}</div>
              <p className="text-xs text-muted-foreground">Checked In / مُؤشَّر</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold">{percentage}%</div>
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
            placeholder="Search by name or university ID / ابحث بالاسم أو الرقم الجامعي"
            className="pl-10 h-14 text-lg"
            autoFocus
          />
        </div>

        {/* Voter Table */}
        <Card>
          <div className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / الاسم</TableHead>
                  <TableHead>University ID / الرقم الجامعي</TableHead>
                  <TableHead>Faculty / الكلية</TableHead>
                  <TableHead>Status / الحالة</TableHead>
                  <TableHead className="text-right">Action / إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {search ? 'No voters found / لم يتم العثور على ناخبين' : 'No voters assigned to this box / لا ناخبين في هذا الصندوق'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 150).map(voter => (
                    <TableRow key={voter.id} className={voter.has_voted ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''}>
                      <TableCell>
                        <div className="font-medium">{voter.student_name}</div>
                        {voter.student_name_ar && <div className="text-xs text-muted-foreground font-cairo" dir="rtl">{voter.student_name_ar}</div>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{voter.university_id}</TableCell>
                      <TableCell>
                        <div className="text-sm">{voter.faculty_name}</div>
                        {voter.faculty_name_ar && <div className="text-xs text-muted-foreground font-cairo" dir="rtl">{voter.faculty_name_ar}</div>}
                      </TableCell>
                      <TableCell>
                        {voter.has_voted ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Voted / صوّت
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3" /> Pending / بانتظار
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {voter.has_voted ? (
                          <Button variant="ghost" size="sm" onClick={() => handleUndo(voter.id)} className="text-muted-foreground gap-1">
                            <Undo2 className="h-3.5 w-3.5" /> Undo / تراجع
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleCheckIn(voter.id)} disabled={checkingIn} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Check In / تأشير
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 150 && (
            <div className="p-3 text-center text-sm text-muted-foreground border-t">
              Showing first 150 of {filtered.length} results. Narrow your search.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
