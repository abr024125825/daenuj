import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PsychAccessGate } from './PsychAccessGate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Users, Loader2, ArrowRight } from 'lucide-react';
import { usePsychologicalProfiles } from '@/hooks/usePsychologicalProfiles';
import { format } from 'date-fns';

export function PsychProfilesPage() {
  const navigate = useNavigate();
  const { profiles, profilesLoading, createProfile } = usePsychologicalProfiles();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({
    student_name: '',
    university_id: '',
    phone: '',
    faculty: '',
    academic_year: '',
    referral_source: '',
  });

  const filtered = profiles?.filter(
    (p) =>
      p.student_name.toLowerCase().includes(search.toLowerCase()) ||
      p.university_id.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search))
  );

  const handleCreate = async () => {
    if (!newProfile.student_name || !newProfile.university_id) return;
    await createProfile.mutateAsync(newProfile);
    setCreateDialogOpen(false);
    setNewProfile({ student_name: '', university_id: '', phone: '', faculty: '', academic_year: '', referral_source: '' });
  };

  return (
    <PsychAccessGate>
      <DashboardLayout title="Student Profiles">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold">Psychological Profiles</h2>
              <p className="text-muted-foreground">{profiles?.length || 0} students registered</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {profilesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>University ID</TableHead>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No profiles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered?.map((p) => (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/dashboard/psych-profiles/${p.id}`)}
                        >
                          <TableCell className="font-medium">{p.student_name}</TableCell>
                          <TableCell>{p.university_id}</TableCell>
                          <TableCell className="text-muted-foreground">{p.faculty || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(p.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Profile Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Student Profile</DialogTitle>
              <DialogDescription>Create a new psychological support profile</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Student Name *</Label>
                  <Input
                    value={newProfile.student_name}
                    onChange={(e) => setNewProfile({ ...newProfile, student_name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>University ID *</Label>
                  <Input
                    value={newProfile.university_id}
                    onChange={(e) => setNewProfile({ ...newProfile, university_id: e.target.value })}
                    placeholder="e.g. 2020123456"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newProfile.phone}
                    onChange={(e) => setNewProfile({ ...newProfile, phone: e.target.value })}
                    placeholder="Contact number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Faculty</Label>
                  <Input
                    value={newProfile.faculty}
                    onChange={(e) => setNewProfile({ ...newProfile, faculty: e.target.value })}
                    placeholder="e.g. Science"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input
                    value={newProfile.academic_year}
                    onChange={(e) => setNewProfile({ ...newProfile, academic_year: e.target.value })}
                    placeholder="e.g. 2024/2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Referral Source</Label>
                  <Input
                    value={newProfile.referral_source}
                    onChange={(e) => setNewProfile({ ...newProfile, referral_source: e.target.value })}
                    placeholder="e.g. Self, Faculty"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createProfile.isPending || !newProfile.student_name || !newProfile.university_id}>
                {createProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </PsychAccessGate>
  );
}
