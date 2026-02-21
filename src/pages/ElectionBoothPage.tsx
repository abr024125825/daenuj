import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, CheckCircle2, XCircle, Vote, Undo2, ShieldAlert, LogOut, Lock, Shield, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const LOCK_PASSWORD_REQUIRED = true;

interface BoothSession {
  userId: string;
  boxId: string;
  boxName: string;
  electionName: string;
  electionId: string;
  clientIP: string;
}

interface Voter {
  id: string;
  student_name: string;
  student_name_ar: string | null;
  university_id: string;
  faculty_name: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastActivityRef = useRef(Date.now());
  const lockTimerRef = useRef<ReturnType<typeof setInterval>>();

  // Inactivity lock
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!session || locked) return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetActivity));
    lockTimerRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        setLocked(true);
      }
    }, 10000);
    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    };
  }, [session, locked, resetActivity]);

  // Prevent right-click and dev tools
  useEffect(() => {
    const preventContext = (e: MouseEvent) => e.preventDefault();
    const preventDevTools = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('keydown', preventDevTools);
    return () => {
      document.removeEventListener('contextmenu', preventContext);
      document.removeEventListener('keydown', preventDevTools);
    };
  }, []);

  // Check existing auth session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        validateAndSetup(data.session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const validateAndSetup = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const clientIP = await getClientIP();

      // Find box assigned to this user
      const { data: boxes, error: boxErr } = await supabase
        .from('voting_boxes')
        .select('*')
        .eq('supervisor_id', userId);
      if (boxErr) throw boxErr;
      if (!boxes || boxes.length === 0) {
        setError('ACCESS DENIED: This account is not assigned to any voting box.');
        setLoading(false);
        return;
      }

      const box = boxes[0];

      // IP validation — admin must set allowed_ip first
      if (!box.allowed_ip) {
        setError('CONFIGURATION ERROR: No allowed IP has been set for this box. Contact the administrator to configure the allowed IP address.');
        setLoading(false);
        return;
      }

      if (box.allowed_ip !== clientIP) {
        setError(`ACCESS DENIED: This device is not authorized for this voting box.\n\nDetected IP: ${clientIP}\nAuthorized IP: ${box.allowed_ip}\n\nContact the administrator if you believe this is an error.`);
        setLoading(false);
        return;
      }

      // Get election info
      const { data: election } = await supabase
        .from('elections')
        .select('id, name, status')
        .eq('id', box.election_id)
        .single();

      if (!election || election.status !== 'active') {
        setError('This election is not currently active. Check-in is only available during active elections.');
        setLoading(false);
        return;
      }

      setSession({
        userId,
        boxId: box.id,
        boxName: box.name,
        electionName: election.name,
        electionId: box.election_id,
        clientIP,
      });

      loadVoters(box.election_id, box.id);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const loadVoters = async (electionId: string, boxId: string) => {
    const { data } = await supabase
      .from('election_voters')
      .select('id, student_name, student_name_ar, university_id, faculty_name, national_id, has_voted, voted_at')
      .eq('election_id', electionId)
      .eq('box_id', boxId)
      .order('student_name');
    if (data) setVoters(data);
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
    setError('');
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      setError(authErr.message);
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
    setLocked(false);
    setFailedAttempts(0);
  };

  const handleUnlock = async () => {
    setError('');
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: email || '_', password: unlockPassword });
    if (authErr) {
      setFailedAttempts(prev => prev + 1);
      if (failedAttempts + 1 >= 5) {
        // Force logout after 5 failed unlock attempts
        toast({ title: 'Too many failed attempts. Logging out.', variant: 'destructive' });
        handleLogout();
        return;
      }
      setError(`Incorrect password. ${5 - failedAttempts - 1} attempts remaining.`);
    } else {
      setLocked(false);
      setUnlockPassword('');
      setFailedAttempts(0);
      resetActivity();
    }
  };

  const handleCheckIn = async (voterId: string) => {
    if (!session) return;
    setCheckingIn(true);
    const { error: updateErr } = await supabase
      .from('election_voters')
      .update({ has_voted: true, voted_at: new Date().toISOString(), checked_in_by: session.userId })
      .eq('id', voterId);
    if (updateErr) {
      toast({ title: 'Error', description: updateErr.message, variant: 'destructive' });
    } else {
      toast({ title: '✓ Voter checked in successfully' });
      setSearch('');
      searchRef.current?.focus();
      loadVoters(session.electionId, session.boxId);
    }
    setCheckingIn(false);
  };

  const handleUndo = async (voterId: string) => {
    if (!session) return;
    const { error: updateErr } = await supabase
      .from('election_voters')
      .update({ has_voted: false, voted_at: null, checked_in_by: null })
      .eq('id', voterId);
    if (!updateErr) {
      toast({ title: 'Check-in undone' });
      loadVoters(session.electionId, session.boxId);
    }
  };

  const filtered = voters.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.student_name.toLowerCase().includes(q) ||
      v.university_id.toLowerCase().includes(q) ||
      (v.national_id || '').includes(q);
  });

  const totalVoters = voters.length;
  const votedCount = voters.filter(v => v.has_voted).length;
  const percentage = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

  // LOADING
  if (loading && !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Toaster />
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifying device authorization...</p>
        </div>
      </div>
    );
  }

  // LOCK SCREEN
  if (session && locked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Toaster />
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>Screen Locked</CardTitle>
            <p className="text-sm text-muted-foreground">Session locked due to inactivity</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-medium">{session.boxName}</p>
              <p>{session.electionName}</p>
            </div>
            <div>
              <Label>Password to Unlock</Label>
              <Input
                type="password"
                value={unlockPassword}
                onChange={e => setUnlockPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter your password"
                autoFocus
              />
            </div>
            <Button onClick={handleUnlock} className="w-full">Unlock</Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full text-muted-foreground">
              <LogOut className="h-3.5 w-3.5 mr-1" /> Sign out instead
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Toaster />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle className="text-xl">Election Booth Login</CardTitle>
            <p className="text-sm text-muted-foreground">Authorized devices only · IP-bound access</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex gap-2">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap text-xs">{error}</pre>
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="booth-operator@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Sign In'}
            </Button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
              <Shield className="h-3 w-3" />
              <span>Device-restricted access · Admin-configured IP</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KIOSK CHECK-IN SCREEN
  return (
    <div className="min-h-screen bg-background select-none">
      <Toaster />
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Vote className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg leading-tight">{session.electionName}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" /> {session.clientIP}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">{session.boxName}</Badge>
          <Button variant="ghost" size="icon" onClick={() => setLocked(true)} title="Lock Screen">
            <Lock className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
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
              <p className="text-xs text-muted-foreground">Total Voters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-emerald-600">{votedCount}</div>
              <p className="text-xs text-muted-foreground">Checked In</p>
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
            placeholder="Search by name, university ID, or national ID..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>University ID</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {search ? 'No voters found matching your search.' : 'No voters assigned to this box.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 150).map(voter => (
                    <TableRow key={voter.id} className={voter.has_voted ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''}>
                      <TableCell>
                        <div className="font-medium">{voter.student_name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{voter.university_id}</TableCell>
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
                          <Button size="sm" onClick={() => handleCheckIn(voter.id)} disabled={checkingIn} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
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
          {filtered.length > 150 && (
            <div className="p-3 text-center text-sm text-muted-foreground border-t">
              Showing first 150 of {filtered.length} results. Narrow your search.
            </div>
          )}
        </Card>

        {/* Security footer */}
        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2 pt-2">
          <Clock className="h-3 w-3" />
          <span>Auto-lock after 3 minutes of inactivity</span>
          <span>·</span>
          <Shield className="h-3 w-3" />
          <span>IP: {session.clientIP}</span>
        </div>
      </div>
    </div>
  );
}
