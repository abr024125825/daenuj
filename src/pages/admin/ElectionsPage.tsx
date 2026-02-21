import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useElections, useCreateElection, useUpdateElection } from '@/hooks/useElections';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Vote, Calendar, Users, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function ElectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: elections, isLoading } = useElections();
  const createElection = useCreateElection();
  const updateElection = useUpdateElection();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', name_ar: '', description: '', election_date: '' });

  const handleCreate = () => {
    if (!form.name || !form.election_date || !user) return;
    createElection.mutate({ ...form, created_by: user.id }, {
      onSuccess: () => {
        setShowCreate(false);
        setForm({ name: '', name_ar: '', description: '', election_date: '' });
      },
    });
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    if (s === 'closed') return 'bg-muted text-muted-foreground';
    return 'bg-amber-500/10 text-amber-600 border-amber-200';
  };

  return (
    <DashboardLayout title="Elections Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Vote className="h-6 w-6 text-primary" />
              Elections Management
            </h1>
            <p className="text-muted-foreground text-sm">إدارة الانتخابات والتأشير</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Election</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Election</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name (English)</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Student Council Election 2025" />
                </div>
                <div>
                  <Label>الاسم (عربي)</Label>
                  <Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="انتخابات مجلس الطلبة 2025" dir="rtl" className="font-cairo" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                </div>
                <div>
                  <Label>Election Date</Label>
                  <Input type="date" value={form.election_date} onChange={e => setForm(f => ({ ...f, election_date: e.target.value }))} />
                </div>
                <Button onClick={handleCreate} disabled={createElection.isPending} className="w-full">
                  {createElection.isPending ? 'Creating...' : 'Create Election'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Card key={i} className="animate-pulse h-48" />)}
          </div>
        ) : !elections?.length ? (
          <Card className="p-12 text-center">
            <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No elections yet. Create your first one.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elections.map(election => (
              <Card key={election.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/dashboard/elections/${election.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{election.name}</CardTitle>
                    <Badge variant="outline" className={statusColor(election.status)}>
                      {election.status === 'active' ? '🟢 Active' : election.status === 'closed' ? '⚫ Closed' : '🟡 Draft'}
                    </Badge>
                  </div>
                  {election.name_ar && <p className="text-sm text-muted-foreground font-cairo" dir="rtl">{election.name_ar}</p>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(election.election_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="gap-1" onClick={e => { e.stopPropagation(); navigate(`/dashboard/elections/${election.id}`); }}>
                      <Settings className="h-3.5 w-3.5" /> Manage
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={e => { e.stopPropagation(); navigate(`/dashboard/elections/${election.id}/results`); }}>
                      <BarChart3 className="h-3.5 w-3.5" /> Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
