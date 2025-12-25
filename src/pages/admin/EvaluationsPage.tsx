import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { MessageSquare, Star, Plus, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEvaluations } from '@/hooks/useEvaluations';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const ratingCategories = [
  { id: 'punctuality', label: 'Punctuality' },
  { id: 'teamwork', label: 'Teamwork' },
  { id: 'communication', label: 'Communication' },
  { id: 'initiative', label: 'Initiative' },
  { id: 'quality', label: 'Quality of Work' },
];

export function EvaluationsPage() {
  const { evaluations, isLoading, createEvaluation, updateEvaluation, deleteEvaluation } = useEvaluations();
  const { opportunities } = useOpportunities();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState('');
  const [evaluationToEdit, setEvaluationToEdit] = useState<any>(null);
  const [evaluationToDelete, setEvaluationToDelete] = useState<any>(null);

  // Get attendees for selected opportunity
  const { data: attendees } = useQuery({
    queryKey: ['opportunity-attendees', selectedOpportunity],
    queryFn: async () => {
      if (!selectedOpportunity) return [];
      const { data } = await supabase
        .from('attendance')
        .select(`
          volunteer:volunteers(
            id,
            application:volunteer_applications(first_name, family_name, university_id)
          )
        `)
        .eq('opportunity_id', selectedOpportunity);
      return data;
    },
    enabled: !!selectedOpportunity,
  });

  const handleCreateEvaluation = async () => {
    const ratingsArray = Object.entries(ratings).map(([category, score]) => ({
      category,
      score,
    }));

    await createEvaluation.mutateAsync({
      volunteerId: selectedVolunteer,
      opportunityId: selectedOpportunity,
      type: 'supervisor_rating',
      ratings: ratingsArray,
      comments,
    });

    setCreateDialogOpen(false);
    setSelectedOpportunity('');
    setSelectedVolunteer('');
    setRatings({});
    setComments('');
  };

  const handleEditEvaluation = async () => {
    if (!evaluationToEdit) return;

    const ratingsArray = Object.entries(ratings).map(([category, score]) => ({
      category,
      score,
    }));

    await updateEvaluation.mutateAsync({
      id: evaluationToEdit.id,
      ratings: ratingsArray,
      comments,
    });

    setEditDialogOpen(false);
    setEvaluationToEdit(null);
    setRatings({});
    setComments('');
  };

  const handleDeleteEvaluation = async () => {
    if (!evaluationToDelete) return;
    await deleteEvaluation.mutateAsync(evaluationToDelete.id);
    setDeleteDialogOpen(false);
    setEvaluationToDelete(null);
  };

  const openEditDialog = (evaluation: any) => {
    setEvaluationToEdit(evaluation);
    const ratingsData = evaluation.ratings as any[];
    const ratingsObj: { [key: string]: number } = {};
    ratingsData?.forEach(r => {
      ratingsObj[r.category] = r.score;
    });
    setRatings(ratingsObj);
    setComments(evaluation.comments || '');
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (evaluation: any) => {
    setEvaluationToDelete(evaluation);
    setDeleteDialogOpen(true);
  };

  const supervisorRatings = evaluations?.filter((e: any) => e.type === 'supervisor_rating');
  const volunteerFeedback = evaluations?.filter((e: any) => e.type === 'volunteer_feedback');

  if (isLoading) {
    return (
      <DashboardLayout title="Evaluations">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const renderEvaluationTable = (data: any[], showActions = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Volunteer</TableHead>
          <TableHead>Opportunity</TableHead>
          <TableHead>Overall Score</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Comments</TableHead>
          {showActions && <TableHead className="w-[70px]">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((evaluation: any) => {
          const ratingsData = evaluation.ratings as any[];
          const avgScore = ratingsData?.length 
            ? ratingsData.reduce((sum, r) => sum + r.score, 0) / ratingsData.length 
            : 0;

          return (
            <TableRow key={evaluation.id}>
              <TableCell>
                {evaluation.volunteer?.application?.first_name} {evaluation.volunteer?.application?.family_name}
              </TableCell>
              <TableCell>{evaluation.opportunity?.title}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span>{avgScore.toFixed(1)}/5</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {evaluation.created_at 
                  ? format(new Date(evaluation.created_at), 'MMM dd, yyyy')
                  : 'N/A'}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {evaluation.comments || '-'}
              </TableCell>
              {showActions && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(evaluation)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(evaluation)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          );
        })}
        {(!data || data.length === 0) && (
          <TableRow>
            <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8 text-muted-foreground">
              No evaluations yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout title="Evaluations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Evaluations</h2>
            <p className="text-muted-foreground">Rate volunteers and view feedback</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Rate Volunteer
          </Button>
        </div>

        <Tabs defaultValue="ratings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ratings">Supervisor Ratings</TabsTrigger>
            <TabsTrigger value="feedback">Volunteer Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="ratings">
            <Card>
              <CardContent className="p-0">
                {renderEvaluationTable(supervisorRatings, true)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardContent className="p-0">
                {renderEvaluationTable(volunteerFeedback, true)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Rating Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Rate Volunteer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Opportunity</Label>
                <Select value={selectedOpportunity} onValueChange={setSelectedOpportunity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select opportunity" />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunities?.filter((o: any) => o.status === 'published' || o.status === 'completed')
                      .map((opp: any) => (
                        <SelectItem key={opp.id} value={opp.id}>
                          {opp.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOpportunity && (
                <div className="grid gap-2">
                  <Label>Volunteer</Label>
                  <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select volunteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {attendees?.map((att: any) => (
                        <SelectItem key={att.volunteer.id} value={att.volunteer.id}>
                          {att.volunteer.application.first_name} {att.volunteer.application.family_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedVolunteer && (
                <div className="space-y-4">
                  {ratingCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{category.label}</Label>
                        <span className="text-sm font-medium">{ratings[category.id] || 3}/5</span>
                      </div>
                      <Slider
                        value={[ratings[category.id] || 3]}
                        onValueChange={([value]) => setRatings({ ...ratings, [category.id]: value })}
                        min={1}
                        max={5}
                        step={1}
                      />
                    </div>
                  ))}

                  <div className="grid gap-2">
                    <Label>Comments (Optional)</Label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Additional comments about the volunteer's performance..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreateEvaluation}
                disabled={!selectedVolunteer || createEvaluation.isPending}
              >
                {createEvaluation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Rating
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Rating Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Evaluation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {evaluationToEdit && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">
                    {evaluationToEdit.volunteer?.application?.first_name} {evaluationToEdit.volunteer?.application?.family_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{evaluationToEdit.opportunity?.title}</p>
                </div>
              )}

              <div className="space-y-4">
                {ratingCategories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{category.label}</Label>
                      <span className="text-sm font-medium">{ratings[category.id] || 3}/5</span>
                    </div>
                    <Slider
                      value={[ratings[category.id] || 3]}
                      onValueChange={([value]) => setRatings({ ...ratings, [category.id]: value })}
                      min={1}
                      max={5}
                      step={1}
                    />
                  </div>
                ))}

                <div className="grid gap-2">
                  <Label>Comments (Optional)</Label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Additional comments..."
                    rows={3}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleEditEvaluation}
                disabled={updateEvaluation.isPending}
              >
                {updateEvaluation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Evaluation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this evaluation for{' '}
                {evaluationToDelete?.volunteer?.application?.first_name} {evaluationToDelete?.volunteer?.application?.family_name}?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEvaluation}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteEvaluation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
