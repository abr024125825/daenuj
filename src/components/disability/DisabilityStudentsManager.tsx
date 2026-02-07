import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Pencil, Trash2, Loader2, Search, User, FileSpreadsheet, FileText } from 'lucide-react';
import { useDisabilityStudents, DisabilityStudent, SpecialNeedType } from '@/hooks/useDisabilityStudents';
import { useAuth } from '@/contexts/AuthContext';
import { ExcelUploadDialog } from './ExcelUploadDialog';
import { parseStudentsExcel, ParsedStudent } from '@/lib/excelParser';
import { useToast } from '@/hooks/use-toast';
import { generateStudentReport } from '@/lib/generateStudentReport';
import { useDisabilityExams } from '@/hooks/useDisabilityExams';
import { useDisabilityExamAssignments } from '@/hooks/useDisabilityExamAssignments';

const SPECIAL_NEEDS: { value: SpecialNeedType; label: string }[] = [
  { value: 'reader', label: 'Reader' },
  { value: 'extra_time', label: 'Extra Time' },
  { value: 'companion', label: 'Companion' },
  { value: 'scribe', label: 'Scribe' },
  { value: 'separate_room', label: 'Separate Room' },
  { value: 'assistive_technology', label: 'Assistive Technology' },
  { value: 'other', label: 'Other' },
];

export function DisabilityStudentsManager() {
  const { user } = useAuth();
  const { students, isLoading, addStudent, updateStudent, deleteStudent } = useDisabilityStudents();
  const { exams } = useDisabilityExams();
  const { assignments } = useDisabilityExamAssignments();

  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<DisabilityStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    student_name: '',
    university_id: '',
    disability_type: '',
    disability_code: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
    special_needs: [] as SpecialNeedType[],
    is_active: true,
  });

  const filteredStudents = students?.filter(student =>
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.university_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!user) return;

    const studentData = {
      student_name: formData.student_name,
      university_id: formData.university_id,
      disability_type: formData.disability_type || null,
      disability_code: formData.disability_code || null,
      contact_phone: formData.contact_phone || null,
      contact_email: formData.contact_email || null,
      notes: formData.notes || null,
      special_needs: formData.special_needs.length > 0 ? formData.special_needs : null,
      is_active: formData.is_active,
      created_by: user.id,
    };

    if (selectedStudent) {
      await updateStudent.mutateAsync({ id: selectedStudent.id, ...studentData });
    } else {
      await addStudent.mutateAsync(studentData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (student: DisabilityStudent) => {
    setSelectedStudent(student);
    setFormData({
      student_name: student.student_name,
      university_id: student.university_id,
      disability_type: student.disability_type || '',
      disability_code: student.disability_code || '',
      contact_phone: student.contact_phone || '',
      contact_email: student.contact_email || '',
      notes: student.notes || '',
      special_needs: student.special_needs || [],
      is_active: student.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    await deleteStudent.mutateAsync(selectedStudent.id);
    setDeleteDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleDownloadReport = async (student: DisabilityStudent) => {
    // Get all exams for this student
    const studentExams = exams?.filter(e => e.student_id === student.id) || [];
    
    // Format exams with assignments
    const examsWithAssignments = studentExams.map(exam => ({
      ...exam,
      assignments: assignments?.filter(a => a.exam_id === exam.id).map(a => ({
        id: a.id,
        assigned_role: a.assigned_role,
        status: a.status,
        volunteer: a.volunteer,
      })),
    }));
    
    await generateStudentReport(student, examsWithAssignments);
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFormData({
      student_name: '',
      university_id: '',
      disability_type: '',
      disability_code: '',
      contact_phone: '',
      contact_email: '',
      notes: '',
      special_needs: [],
      is_active: true,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const toggleSpecialNeed = (need: SpecialNeedType) => {
    setFormData(prev => ({
      ...prev,
      special_needs: prev.special_needs.includes(need)
        ? prev.special_needs.filter(n => n !== need)
        : [...prev.special_needs, need],
    }));
  };

  const handleBulkUpload = async (data: ParsedStudent[]) => {
    if (!user) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const student of data) {
      try {
        await addStudent.mutateAsync({
          student_name: student.student_name,
          university_id: student.university_id,
          disability_type: student.disability_type || null,
          disability_code: student.disability_code || null,
          contact_phone: student.contact_phone || null,
          contact_email: student.contact_email || null,
          notes: student.notes || null,
          special_needs: (student.special_needs as SpecialNeedType[]) || null,
          is_active: true,
          created_by: user.id,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }
    
    toast({
      title: 'Upload Complete',
      description: `Added ${successCount} student(s)${errorCount > 0 ? ` - ${errorCount} failed` : ''}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Students with Disabilities
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Upload Excel
            </Button>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredStudents && filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No students found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>University ID</TableHead>
                <TableHead>Disability Type</TableHead>
                <TableHead>Special Needs</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.student_name}</TableCell>
                  <TableCell className="font-mono text-sm">{student.university_id}</TableCell>
                  <TableCell>
                    {student.disability_type && (
                      <Badge variant="outline">{student.disability_type}</Badge>
                    )}
                    {student.disability_code && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({student.disability_code})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.special_needs?.map((need) => (
                        <Badge key={need} variant="secondary" className="text-xs">
                          {SPECIAL_NEEDS.find(n => n.value === need)?.label || need}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {student.contact_phone && <p>{student.contact_phone}</p>}
                      {student.contact_email && (
                        <p className="text-muted-foreground">{student.contact_email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.is_active ? 'default' : 'secondary'}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Download Report"
                        onClick={() => handleDownloadReport(student)}
                      >
                        <FileText className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(student)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedStudent(student);
                          setDeleteDialogOpen(true);
                        }}
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

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStudent ? 'Edit Student' : 'Add Student'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student_name">Student Name *</Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university_id">University ID *</Label>
                <Input
                  id="university_id"
                  value={formData.university_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, university_id: e.target.value }))}
                  placeholder="e.g., 12345678"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disability_type">Disability Type</Label>
                  <Input
                    id="disability_type"
                    value={formData.disability_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, disability_type: e.target.value }))}
                    placeholder="e.g., Visual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disability_code">Code</Label>
                  <Input
                    id="disability_code"
                    value={formData.disability_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, disability_code: e.target.value }))}
                    placeholder="e.g., V1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Default Special Needs</Label>
                <p className="text-xs text-muted-foreground">
                  These will be pre-filled when creating exams for this student
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SPECIAL_NEEDS.map((need) => (
                    <div key={need.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`special-${need.value}`}
                        checked={formData.special_needs.includes(need.value)}
                        onCheckedChange={() => toggleSpecialNeed(need.value)}
                      />
                      <label
                        htmlFor={`special-${need.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {need.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active Status</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.student_name || !formData.university_id}
              >
                {selectedStudent ? 'Save Changes' : 'Add Student'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this student? This will also delete all their exam records and assignments.
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

        {/* Excel Upload Dialog */}
        <ExcelUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          type="students"
          onUpload={(data) => handleBulkUpload(data as ParsedStudent[])}
          parseFile={parseStudentsExcel}
        />
      </CardContent>
    </Card>
  );
}
