import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Calendar, Power, PowerOff, Trash2, Loader2 } from 'lucide-react';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export function SemesterManagement() {
  const { user } = useAuth();
  const { semesters, isLoading, createSemester, activateSemester, closeSemester, deleteSemester } = useAcademicSemesters();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    academic_year: '',
    semester_number: '1',
    start_date: '',
    end_date: '',
  });

  const handleSubmit = async () => {
    if (!user?.id) return;

    await createSemester.mutateAsync({
      name: formData.name,
      academic_year: formData.academic_year,
      semester_number: parseInt(formData.semester_number),
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: false,
      created_by: user.id,
    });

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedSemesterId) return;
    await deleteSemester.mutateAsync(selectedSemesterId);
    setDeleteDialogOpen(false);
    setSelectedSemesterId(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      academic_year: '',
      semester_number: '1',
      start_date: '',
      end_date: '',
    });
  };

  // Generate academic year options (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const academicYearOptions = Array.from({ length: 6 }, (_, i) => {
    const startYear = currentYear + i;
    return `${startYear}-${startYear + 1}`;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Academic Semesters
            </CardTitle>
            <CardDescription>
              Manage academic semesters and years
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Semester
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {semesters?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No semesters created yet</p>
            <p className="text-sm mt-1">Create a semester to enable course schedule management</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semesters?.map(semester => (
                <TableRow key={semester.id}>
                  <TableCell className="font-medium">{semester.name}</TableCell>
                  <TableCell>{semester.academic_year}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {semester.semester_number === 1 ? 'First' : semester.semester_number === 2 ? 'Second' : 'Summer'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(semester.start_date), 'MMM d, yyyy')} - {format(new Date(semester.end_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={semester.is_active ? 'default' : 'secondary'}>
                      {semester.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {semester.is_active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => closeSemester.mutate(semester.id)}
                          title="Close Semester"
                        >
                          <PowerOff className="h-4 w-4 text-orange-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => activateSemester.mutate(semester.id)}
                          title="Activate Semester"
                        >
                          <Power className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSemesterId(semester.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={semester.is_active}
                        title={semester.is_active ? 'Cannot delete active semester' : 'Delete Semester'}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add Semester Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Semester</DialogTitle>
              <DialogDescription>
                Add a new academic semester for course schedule management
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Semester Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Fall 2024"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year *</Label>
                  <Select
                    value={formData.academic_year}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, academic_year: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearOptions.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester_number">Semester *</Label>
                  <Select
                    value={formData.semester_number}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, semester_number: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">First Semester</SelectItem>
                      <SelectItem value="2">Second Semester</SelectItem>
                      <SelectItem value="3">Summer Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.academic_year || !formData.start_date || !formData.end_date || createSemester.isPending}
              >
                {createSemester.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Semester</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this semester? All associated course schedules will also be deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
