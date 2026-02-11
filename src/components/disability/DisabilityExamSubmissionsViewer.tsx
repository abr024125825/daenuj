import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Loader2, Search, Inbox, Check, Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ExamSubmission {
  id: string;
  student_id: string;
  course_name: string;
  course_code: string | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location: string | null;
  notes: string | null;
  submitted_at: string;
  is_processed: boolean;
  student?: {
    student_name: string;
    university_id: string;
  };
}

export function DisabilityExamSubmissionsViewer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeSemester } = useAcademicSemesters();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['disability-exam-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disability_student_exam_submissions')
        .select(`
          *,
          student:disability_students(student_name, university_id)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as ExamSubmission[];
    },
  });

  const approveSubmissions = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user || !activeSemester) throw new Error('Missing context');

      const toApprove = submissions?.filter(s => ids.includes(s.id)) || [];

      // Create disability exams from submissions
      for (const sub of toApprove) {
        const { error: examError } = await supabase
          .from('disability_exams')
          .insert({
            student_id: sub.student_id,
            course_name: sub.course_name,
            course_code: sub.course_code,
            exam_date: sub.exam_date,
            start_time: sub.start_time,
            end_time: sub.end_time,
            duration_minutes: sub.duration_minutes,
            location: sub.location,
            special_needs_notes: sub.notes,
            semester_id: activeSemester.id,
            status: 'pending',
            created_by: user.id,
            extra_time_minutes: 0,
            special_needs: [],
          });

        if (examError) throw examError;

        // Mark as processed
        await supabase
          .from('disability_student_exam_submissions')
          .update({ is_processed: true, processed_at: new Date().toISOString(), processed_by: user.id })
          .eq('id', sub.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-exam-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['disability-exams'] });
      toast({ title: 'Success', description: `${selectedIds.length} submission(s) approved and added to exams` });
      setSelectedIds([]);
      setApproveDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSubmission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('disability_student_exam_submissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disability-exam-submissions'] });
      toast({ title: 'Deleted', description: 'Submission removed' });
    },
  });

  const filtered = submissions?.filter(s =>
    s.student?.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student?.university_id?.includes(searchQuery)
  );

  const pendingSubmissions = filtered?.filter(s => !s.is_processed) || [];
  const processedSubmissions = filtered?.filter(s => s.is_processed) || [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
            <Inbox className="h-5 w-5" />
            Student Exam Submissions
            {pendingSubmissions.length > 0 && (
              <Badge variant="destructive">{pendingSubmissions.length} new</Badge>
            )}
          </CardTitle>
          {selectedIds.length > 0 && (
            <Button onClick={() => setApproveDialogOpen(true)}>
              <Check className="h-4 w-4 mr-2" />
              Approve {selectedIds.length} Selected
            </Button>
          )}
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {pendingSubmissions.length === 0 && processedSubmissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No exam submissions yet</p>
            <p className="text-sm mt-1">Students can submit their exam schedules at /disability-exam-submit</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingSubmissions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Pending Review ({pendingSubmissions.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSubmissions.map(sub => (
                      <TableRow key={sub.id} className="bg-amber-50/50 dark:bg-amber-950/10">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(sub.id)}
                            onChange={() => toggleSelect(sub.id)}
                            aria-label={`Select submission for ${sub.course_name}`}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{sub.student?.student_name}</p>
                          <p className="text-xs text-muted-foreground">{sub.student?.university_id}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{sub.course_name}</p>
                          {sub.course_code && <p className="text-xs text-muted-foreground font-mono">{sub.course_code}</p>}
                        </TableCell>
                        <TableCell>
                          <p>{format(new Date(sub.exam_date), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">{sub.start_time} - {sub.end_time}</p>
                        </TableCell>
                        <TableCell>{sub.duration_minutes} min</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(sub.submitted_at), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSubmission.mutate(sub.id)}
                            aria-label="Delete submission"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {processedSubmissions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Processed ({processedSubmissions.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedSubmissions.slice(0, 10).map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.student?.student_name}</TableCell>
                        <TableCell>{sub.course_name}</TableCell>
                        <TableCell>{format(new Date(sub.exam_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(sub.submitted_at), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Processed</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Submissions</AlertDialogTitle>
              <AlertDialogDescription>
                This will create {selectedIds.length} disability exam(s) from the selected submissions.
                Volunteers can then be assigned to these exams.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => approveSubmissions.mutate(selectedIds)}
                disabled={approveSubmissions.isPending}
              >
                {approveSubmissions.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve & Create Exams
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
