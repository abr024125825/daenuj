import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Slider } from '@/components/ui/slider';
import { MessageSquare, Star, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { useMyFeedback } from '@/hooks/useEvaluations';
import { format } from 'date-fns';

const feedbackCategories = [
  { id: 'organization', label: 'Organization' },
  { id: 'communication', label: 'Communication' },
  { id: 'experience', label: 'Overall Experience' },
];

export function VolunteerEvaluationsPage() {
  const { feedback, eligibleOpportunities, isLoading, submitFeedback } = useMyFeedback();
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState('');

  const handleSubmitFeedback = async () => {
    if (!selectedOpportunity) return;

    const ratingsArray = Object.entries(ratings).map(([category, score]) => ({
      category,
      score,
    }));

    await submitFeedback.mutateAsync({
      opportunityId: selectedOpportunity.opportunity_id,
      ratings: ratingsArray,
      comments,
    });

    setFeedbackDialogOpen(false);
    setSelectedOpportunity(null);
    setRatings({});
    setComments('');
  };

  const openFeedbackDialog = (opp: any) => {
    setSelectedOpportunity(opp);
    setRatings({});
    setComments('');
    setFeedbackDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Evaluations">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Evaluations">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Evaluations & Feedback</h2>
          <p className="text-muted-foreground">Share your experience with volunteering opportunities</p>
        </div>

        {/* Pending Feedback */}
        {eligibleOpportunities && eligibleOpportunities.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Pending Feedback</CardTitle>
              <CardDescription>You attended these opportunities. Share your feedback!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eligibleOpportunities.map((opp: any) => (
                  <div key={opp.opportunity_id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{opp.opportunity?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {opp.opportunity?.date 
                            ? format(new Date(opp.opportunity.date), 'MMM dd, yyyy')
                            : 'Date not available'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openFeedbackDialog(opp)}>
                      Give Feedback
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submitted Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>My Submitted Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback?.map((f: any) => {
                const ratingsData = f.ratings as any[];
                const avgScore = ratingsData?.length 
                  ? ratingsData.reduce((sum, r) => sum + r.score, 0) / ratingsData.length 
                  : 0;

                return (
                  <div key={f.id} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{f.opportunity?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {f.opportunity?.date 
                            ? format(new Date(f.opportunity.date), 'MMM dd, yyyy')
                            : 'Date not available'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="font-medium">{avgScore.toFixed(1)}/5</span>
                      </div>
                    </div>
                    {f.comments && (
                      <p className="text-sm text-muted-foreground mt-2">{f.comments}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Submitted {f.created_at 
                          ? format(new Date(f.created_at), 'MMM dd')
                          : ''}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {(!feedback || feedback.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                  <p>No feedback submitted yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Share Your Feedback</DialogTitle>
            </DialogHeader>
            {selectedOpportunity && (
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedOpportunity.opportunity?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedOpportunity.opportunity?.date), 'MMMM dd, yyyy')}
                  </p>
                </div>

                <div className="space-y-4">
                  {feedbackCategories.map((category) => (
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
                    <Label>Additional Comments (Optional)</Label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Share your thoughts about this opportunity..."
                      rows={3}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitFeedback}
                  disabled={submitFeedback.isPending}
                >
                  {submitFeedback.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Feedback
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
