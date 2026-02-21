import { useState, useEffect } from 'react';
import { getFriendlyError } from '@/lib/errorUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Target, Clock, Trophy, Loader2, Edit, Save, Download } from 'lucide-react';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export function VolunteerHoursTargetSettings() {
  const { semesters, isLoading: semestersLoading } = useAcademicSemesters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [targetHours, setTargetHours] = useState('20');
  const [cumulativeTargetHours, setCumulativeTargetHours] = useState('50');

  // Fetch volunteers who achieved target
  const { data: achieversData, isLoading: achieversLoading } = useQuery({
    queryKey: ['volunteer-achievers'],
    queryFn: async () => {
      const { data: volunteers, error } = await supabase
        .from('volunteers')
        .select(`
          *,
          application:volunteer_applications(
            first_name,
            father_name,
            family_name,
            university_id,
            faculty:faculties(name)
          )
        `)
        .eq('is_active', true)
        .order('total_hours', { ascending: false });

      if (error) throw error;
      return volunteers;
    },
  });

  // Update semester target hours
  const updateTargetHours = useMutation({
    mutationFn: async ({ semesterId, targetHours, cumulativeHours }: { 
      semesterId: string; 
      targetHours: number;
      cumulativeHours: number;
    }) => {
      const { error } = await supabase
        .from('academic_semesters')
        .update({ 
          target_volunteer_hours: targetHours,
          cumulative_target_hours: cumulativeHours,
        })
        .eq('id', semesterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      toast({ title: 'Success', description: 'Target hours updated successfully' });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: getFriendlyError(error), variant: 'destructive' });
    },
  });

  const handleEditClick = (semester: any) => {
    setSelectedSemester(semester);
    setTargetHours(String(semester.target_volunteer_hours || 20));
    setCumulativeTargetHours(String(semester.cumulative_target_hours || 50));
    setEditDialogOpen(true);
  };

  const handleSaveTargets = () => {
    if (!selectedSemester) return;
    updateTargetHours.mutate({
      semesterId: selectedSemester.id,
      targetHours: parseInt(targetHours) || 20,
      cumulativeHours: parseInt(cumulativeTargetHours) || 50,
    });
  };

  // Get current active semester
  const activeSemester = semesters?.find(s => s.is_active);
  const semesterTargetHours = activeSemester?.target_volunteer_hours || 20;
  const totalTargetHours = activeSemester?.cumulative_target_hours || 50;

  // Filter achievers
  const semesterAchievers = achieversData?.filter(v => (v.total_hours || 0) >= semesterTargetHours) || [];
  const totalAchievers = achieversData?.filter(v => (v.total_hours || 0) >= totalTargetHours) || [];

  // Generate PDF report
  const generateAchieversReport = (type: 'semester' | 'total') => {
    const doc = new jsPDF();
    const achievers = type === 'semester' ? semesterAchievers : totalAchievers;
    const target = type === 'semester' ? semesterTargetHours : totalTargetHours;
    const title = type === 'semester' 
      ? `Semester Achievers Report (${activeSemester?.name || 'Current Semester'})`
      : 'Cumulative Hours Achievers Report';

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Volunteer Achievement Report', 14, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 14, 30);

    // Stats summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Target Hours: ${target}`, 14, 55);
    doc.text(`Total Achievers: ${achievers.length}`, 14, 65);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 75);

    // Table header
    let y = 95;
    doc.setFillColor(243, 244, 246);
    doc.rect(14, y - 6, 182, 10, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 18, y);
    doc.text('Student Name', 30, y);
    doc.text('University ID', 90, y);
    doc.text('Faculty', 125, y);
    doc.text('Hours', 170, y);

    // Table rows
    doc.setFont('helvetica', 'normal');
    y += 10;

    achievers.forEach((volunteer, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const app = volunteer.application;
      const name = app ? `${app.first_name} ${app.father_name} ${app.family_name}` : 'N/A';

      doc.text(String(index + 1), 18, y);
      doc.text(name.substring(0, 35), 30, y);
      doc.text(app?.university_id || 'N/A', 90, y);
      doc.text((app?.faculty?.name || 'N/A').substring(0, 20), 125, y);
      doc.text(String(volunteer.total_hours || 0), 170, y);
      y += 8;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 100, 290, { align: 'center' });
    }

    doc.save(`achievers-report-${type}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Success', description: 'Report downloaded successfully' });
  };

  return (
    <div className="space-y-6">
      {/* Target Hours Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Volunteer Hours Targets
          </CardTitle>
          <CardDescription>
            Set target volunteer hours for each semester and cumulative total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {semestersLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : semesters?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No semesters created yet</p>
              <p className="text-sm mt-1">Create a semester first to set hour targets</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Semester Target</TableHead>
                  <TableHead>Cumulative Target</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters?.map((semester: any) => (
                  <TableRow key={semester.id}>
                    <TableCell className="font-medium">{semester.name}</TableCell>
                    <TableCell>{semester.academic_year}</TableCell>
                    <TableCell>
                      <Badge variant={semester.is_active ? 'default' : 'secondary'}>
                        {semester.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        <Clock className="h-3 w-3 mr-1" />
                        {semester.target_volunteer_hours || 20} hrs
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        <Trophy className="h-3 w-3 mr-1" />
                        {semester.cumulative_target_hours || 50} hrs
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(semester)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Achievers Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Semester Achievers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Semester Achievers
                </CardTitle>
                <CardDescription>
                  Volunteers who reached {semesterTargetHours}+ hours this semester
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAchieversReport('semester')}
                disabled={semesterAchievers.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {achieversLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : semesterAchievers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No achievers yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {semesterAchievers.slice(0, 10).map((volunteer: any, index) => (
                  <div key={volunteer.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {volunteer.application?.first_name} {volunteer.application?.family_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {volunteer.application?.faculty?.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {volunteer.total_hours || 0} hrs
                    </Badge>
                  </div>
                ))}
                {semesterAchievers.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{semesterAchievers.length - 10} more achievers
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Achievers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Cumulative Achievers
                </CardTitle>
                <CardDescription>
                  Volunteers who reached {totalTargetHours}+ total hours
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAchieversReport('total')}
                disabled={totalAchievers.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {achieversLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : totalAchievers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No achievers yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {totalAchievers.slice(0, 10).map((volunteer: any, index) => (
                  <div key={volunteer.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {volunteer.application?.first_name} {volunteer.application?.family_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {volunteer.application?.faculty?.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {volunteer.total_hours || 0} hrs
                    </Badge>
                  </div>
                ))}
                {totalAchievers.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{totalAchievers.length - 10} more achievers
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Edit Target Hours
            </DialogTitle>
            <DialogDescription>
              Set target volunteer hours for {selectedSemester?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetHours">Semester Target Hours</Label>
              <Input
                id="targetHours"
                type="number"
                min="1"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                placeholder="20"
              />
              <p className="text-xs text-muted-foreground">
                Hours required for semester achievement recognition
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cumulativeHours">Cumulative Target Hours</Label>
              <Input
                id="cumulativeHours"
                type="number"
                min="1"
                value={cumulativeTargetHours}
                onChange={(e) => setCumulativeTargetHours(e.target.value)}
                placeholder="50"
              />
              <p className="text-xs text-muted-foreground">
                Total hours across all semesters for overall achievement
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTargets} disabled={updateTargetHours.isPending}>
              {updateTargetHours.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
