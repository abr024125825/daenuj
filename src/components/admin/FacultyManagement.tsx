import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, Search, Loader2, Plus, Edit, Trash2, 
  Users, BookOpen, Clock, Award, Building2, ListTree
} from 'lucide-react';
import { useFaculties, useMajors, Faculty, Major } from '@/hooks/useFaculties';
import { useVolunteers } from '@/hooks/useVolunteers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function FacultyManagement() {
  const { data: faculties, isLoading: facultiesLoading } = useFaculties();
  const { volunteers } = useVolunteers();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [addFacultyOpen, setAddFacultyOpen] = useState(false);
  const [addMajorOpen, setAddMajorOpen] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newMajorName, setNewMajorName] = useState('');
  const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
  const [editMajor, setEditMajor] = useState<Major | null>(null);

  // Fetch all majors at once for the view
  const { data: allMajors, isLoading: majorsLoading } = useQuery({
    queryKey: ['all-majors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Major[];
    },
  });

  // Faculty stats
  const getFacultyStats = (facultyId: string) => {
    const facultyVolunteers = volunteers?.filter(
      (v: any) => v.application?.faculty_id === facultyId
    ) || [];
    
    const totalHours = facultyVolunteers.reduce(
      (sum: number, v: any) => sum + (v.total_hours || 0), 0
    );
    
    const activeCount = facultyVolunteers.filter((v: any) => v.is_active).length;
    const completedOps = facultyVolunteers.reduce(
      (sum: number, v: any) => sum + (v.opportunities_completed || 0), 0
    );
    
    const majorsCount = allMajors?.filter(m => m.faculty_id === facultyId).length || 0;
    
    return {
      totalVolunteers: facultyVolunteers.length,
      activeVolunteers: activeCount,
      totalHours,
      completedOpportunities: completedOps,
      majorsCount,
    };
  };

  // Mutations
  const addFacultyMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('faculties').insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      toast({ title: 'Success', description: 'Faculty added successfully' });
      setAddFacultyOpen(false);
      setNewFacultyName('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateFacultyMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('faculties').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      toast({ title: 'Success', description: 'Faculty updated successfully' });
      setEditFaculty(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteFacultyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faculties').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      toast({ title: 'Success', description: 'Faculty deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const addMajorMutation = useMutation({
    mutationFn: async ({ name, facultyId }: { name: string; facultyId: string }) => {
      const { error } = await supabase.from('majors').insert({ name, faculty_id: facultyId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-majors'] });
      toast({ title: 'Success', description: 'Major added successfully' });
      setAddMajorOpen(false);
      setNewMajorName('');
      setSelectedFacultyId(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMajorMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('majors').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-majors'] });
      toast({ title: 'Success', description: 'Major updated successfully' });
      setEditMajor(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMajorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('majors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-majors'] });
      toast({ title: 'Success', description: 'Major deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const filteredFaculties = faculties?.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Overall stats
  const overallStats = {
    totalFaculties: faculties?.length || 0,
    totalMajors: allMajors?.length || 0,
    totalVolunteers: volunteers?.length || 0,
    totalHours: volunteers?.reduce((sum: number, v: any) => sum + (v.total_hours || 0), 0) || 0,
  };

  if (facultiesLoading || majorsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{overallStats.totalFaculties}</p>
                <p className="text-sm text-muted-foreground">Faculties</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-secondary/20">
                <ListTree className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-secondary">{overallStats.totalMajors}</p>
                <p className="text-sm text-muted-foreground">Majors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/20">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">{overallStats.totalVolunteers}</p>
                <p className="text-sm text-muted-foreground">Volunteers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-warning/20">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-3xl font-bold text-warning">{overallStats.totalHours}</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Faculties & Majors
              </CardTitle>
              <CardDescription>Manage university faculties and their majors</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search faculties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setAddFacultyOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Faculty
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filteredFaculties.map((faculty) => {
              const stats = getFacultyStats(faculty.id);
              const facultyMajors = allMajors?.filter(m => m.faculty_id === faculty.id) || [];
              const volunteerPercentage = overallStats.totalVolunteers > 0 
                ? (stats.totalVolunteers / overallStats.totalVolunteers) * 100 
                : 0;

              return (
                <AccordionItem key={faculty.id} value={faculty.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{faculty.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.majorsCount} majors • {stats.totalVolunteers} volunteers
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mr-4">
                        <div className="hidden md:flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-primary">{stats.activeVolunteers}</p>
                            <p className="text-xs text-muted-foreground">Active</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-warning">{stats.totalHours}</p>
                            <p className="text-xs text-muted-foreground">Hours</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-secondary">{stats.completedOpportunities}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-4">
                      {/* Faculty Stats Card */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="text-center">
                          <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                          <p className="text-xl font-bold">{stats.totalVolunteers}</p>
                          <p className="text-xs text-muted-foreground">Total Volunteers</p>
                        </div>
                        <div className="text-center">
                          <Award className="h-5 w-5 mx-auto text-secondary mb-1" />
                          <p className="text-xl font-bold">{stats.activeVolunteers}</p>
                          <p className="text-xs text-muted-foreground">Active</p>
                        </div>
                        <div className="text-center">
                          <Clock className="h-5 w-5 mx-auto text-warning mb-1" />
                          <p className="text-xl font-bold">{stats.totalHours}</p>
                          <p className="text-xs text-muted-foreground">Total Hours</p>
                        </div>
                        <div className="text-center">
                          <BookOpen className="h-5 w-5 mx-auto text-accent mb-1" />
                          <p className="text-xl font-bold">{stats.completedOpportunities}</p>
                          <p className="text-xs text-muted-foreground">Opportunities</p>
                        </div>
                      </div>

                      {/* Volunteer Share */}
                      <div className="px-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Share of Total Volunteers</span>
                          <span className="text-sm font-medium">{volunteerPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={volunteerPercentage} className="h-2" />
                      </div>

                      {/* Majors Table */}
                      <div className="px-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm">Majors ({facultyMajors.length})</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedFacultyId(faculty.id);
                              setAddMajorOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Major
                          </Button>
                        </div>
                        {facultyMajors.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Major Name</TableHead>
                                <TableHead className="w-24 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {facultyMajors.map((major) => (
                                <TableRow key={major.id}>
                                  <TableCell className="font-medium">{major.name}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setEditMajor(major)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => deleteMajorMutation.mutate(major.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No majors added yet
                          </p>
                        )}
                      </div>

                      {/* Faculty Actions */}
                      <div className="flex items-center justify-end gap-2 px-4 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditFaculty(faculty)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Faculty
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (stats.totalVolunteers > 0) {
                              toast({
                                title: 'Cannot Delete',
                                description: 'This faculty has volunteers. Remove them first.',
                                variant: 'destructive',
                              });
                              return;
                            }
                            if (facultyMajors.length > 0) {
                              toast({
                                title: 'Cannot Delete',
                                description: 'This faculty has majors. Delete them first.',
                                variant: 'destructive',
                              });
                              return;
                            }
                            deleteFacultyMutation.mutate(faculty.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Faculty
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {filteredFaculties.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No faculties found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Faculty Dialog */}
      <Dialog open={addFacultyOpen} onOpenChange={setAddFacultyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Faculty</DialogTitle>
            <DialogDescription>Create a new faculty for the university</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="faculty-name">Faculty Name</Label>
              <Input
                id="faculty-name"
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
                placeholder="e.g., Faculty of Engineering"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFacultyOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => addFacultyMutation.mutate(newFacultyName)}
              disabled={!newFacultyName.trim() || addFacultyMutation.isPending}
            >
              {addFacultyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Faculty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Faculty Dialog */}
      <Dialog open={!!editFaculty} onOpenChange={(open) => !open && setEditFaculty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
            <DialogDescription>Update faculty details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-faculty-name">Faculty Name</Label>
              <Input
                id="edit-faculty-name"
                value={editFaculty?.name || ''}
                onChange={(e) => setEditFaculty(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Faculty name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFaculty(null)}>Cancel</Button>
            <Button 
              onClick={() => editFaculty && updateFacultyMutation.mutate({ id: editFaculty.id, name: editFaculty.name })}
              disabled={!editFaculty?.name.trim() || updateFacultyMutation.isPending}
            >
              {updateFacultyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Major Dialog */}
      <Dialog open={addMajorOpen} onOpenChange={setAddMajorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Major</DialogTitle>
            <DialogDescription>Create a new major for this faculty</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="major-name">Major Name</Label>
              <Input
                id="major-name"
                value={newMajorName}
                onChange={(e) => setNewMajorName(e.target.value)}
                placeholder="e.g., Computer Engineering"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMajorOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => selectedFacultyId && addMajorMutation.mutate({ name: newMajorName, facultyId: selectedFacultyId })}
              disabled={!newMajorName.trim() || !selectedFacultyId || addMajorMutation.isPending}
            >
              {addMajorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Major
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Major Dialog */}
      <Dialog open={!!editMajor} onOpenChange={(open) => !open && setEditMajor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Major</DialogTitle>
            <DialogDescription>Update major details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-major-name">Major Name</Label>
              <Input
                id="edit-major-name"
                value={editMajor?.name || ''}
                onChange={(e) => setEditMajor(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Major name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMajor(null)}>Cancel</Button>
            <Button 
              onClick={() => editMajor && updateMajorMutation.mutate({ id: editMajor.id, name: editMajor.name })}
              disabled={!editMajor?.name.trim() || updateMajorMutation.isPending}
            >
              {updateMajorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
