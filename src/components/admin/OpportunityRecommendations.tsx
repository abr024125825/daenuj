import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Sparkles, 
  UserPlus, 
  Loader2, 
  Star, 
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { useVolunteerAvailability } from '@/hooks/useVolunteerCourses';

interface RecommendedVolunteer {
  id: string;
  volunteer: any;
  matchScore: number;
  matchReasons: string[];
  interestMatches: string[];
  isAvailable: boolean;
  experienceLevel: 'new' | 'intermediate' | 'experienced';
}

interface OpportunityRecommendationsProps {
  opportunityId: string;
  opportunityDate: string;
  startTime: string;
  endTime: string;
  targetInterests: string[];
  registrations: any[];
  requiredVolunteers: number;
  onAutoApprove?: (volunteerId: string) => void;
  isProcessing?: boolean;
}

export function OpportunityRecommendations({
  opportunityId,
  opportunityDate,
  startTime,
  endTime,
  targetInterests,
  registrations,
  requiredVolunteers,
  onAutoApprove,
  isProcessing,
}: OpportunityRecommendationsProps) {
  const { availableVolunteers, isLoading } = useVolunteerAvailability(opportunityDate, startTime, endTime);
  const [addingId, setAddingId] = useState<string | null>(null);

  const registeredIds = useMemo(() => 
    new Set(registrations?.map((r: any) => r.volunteer_id) || []),
    [registrations]
  );

  const approvedCount = useMemo(() => 
    registrations?.filter((r: any) => r.status === 'approved').length || 0,
    [registrations]
  );

  // Calculate recommendations with scoring
  const recommendations = useMemo((): RecommendedVolunteer[] => {
    if (!availableVolunteers?.available) return [];

    const available = availableVolunteers.available.filter(
      (v: any) => !registeredIds.has(v.id)
    );

    return available.map((volunteer: any) => {
      const volunteerInterests = volunteer.application?.interests || [];
      const interestMatches = targetInterests.filter(i => volunteerInterests.includes(i));
      const matchReasons: string[] = [];
      let score = 0;

      // Interest match scoring (up to 40 points)
      if (interestMatches.length > 0) {
        const interestScore = Math.min((interestMatches.length / targetInterests.length) * 40, 40);
        score += interestScore;
        matchReasons.push(`${interestMatches.length} matching interest${interestMatches.length > 1 ? 's' : ''}`);
      }

      // Availability bonus (30 points for being available)
      score += 30;
      matchReasons.push('Available during opportunity');

      // Experience level scoring (up to 20 points)
      const opportunitiesCompleted = volunteer.opportunities_completed || 0;
      let experienceLevel: 'new' | 'intermediate' | 'experienced' = 'new';
      if (opportunitiesCompleted >= 10) {
        experienceLevel = 'experienced';
        score += 20;
        matchReasons.push('Experienced volunteer');
      } else if (opportunitiesCompleted >= 3) {
        experienceLevel = 'intermediate';
        score += 10;
        matchReasons.push('Some experience');
      } else {
        score += 5;
        matchReasons.push('New volunteer');
      }

      // Rating bonus (up to 10 points)
      const rating = volunteer.rating || 0;
      if (rating > 0) {
        score += Math.min(rating * 2, 10);
        if (rating >= 4) {
          matchReasons.push('High rating');
        }
      }

      return {
        id: volunteer.id,
        volunteer,
        matchScore: Math.round(score),
        matchReasons,
        interestMatches,
        isAvailable: true,
        experienceLevel,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [availableVolunteers, registeredIds, targetInterests]);

  const handleAddVolunteer = async (volunteerId: string) => {
    if (!onAutoApprove) return;
    setAddingId(volunteerId);
    await onAutoApprove(volunteerId);
    setAddingId(null);
  };

  const topRecommendations = recommendations.slice(0, 10);
  const slotsRemaining = Math.max(requiredVolunteers - approvedCount, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (availableVolunteers?.noActiveSemester) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p>No active semester. Set an active semester to enable recommendations.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered volunteer matching based on availability and interests
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={slotsRemaining > 0 ? 'outline' : 'secondary'}>
              <Users className="h-3 w-3 mr-1" />
              {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topRecommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations available</p>
            <p className="text-sm">All available volunteers are already registered</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Found {recommendations.length} available volunteer{recommendations.length !== 1 ? 's' : ''} • 
              Showing top {topRecommendations.length} matches
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Why Recommended</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRecommendations.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">
                            {rec.volunteer.application?.first_name} {rec.volunteer.application?.father_name} {rec.volunteer.application?.family_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {rec.volunteer.application?.university_id}
                          </p>
                        </div>
                        {rec.experienceLevel === 'experienced' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              </TooltipTrigger>
                              <TooltipContent>Experienced volunteer</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 w-24">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{rec.matchScore}%</span>
                        </div>
                        <Progress 
                          value={rec.matchScore} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rec.isAvailable && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="h-3 w-3" />
                            Available
                          </Badge>
                        )}
                        {rec.interestMatches.slice(0, 2).map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {rec.interestMatches.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{rec.interestMatches.length - 2}
                          </Badge>
                        )}
                        {rec.experienceLevel !== 'new' && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {rec.experienceLevel === 'experienced' ? 'Expert' : 'Skilled'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleAddVolunteer(rec.id)}
                        disabled={isProcessing || addingId === rec.id || slotsRemaining === 0}
                      >
                        {addingId === rec.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {slotsRemaining > 0 && topRecommendations.length >= slotsRemaining && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm">
                  You have enough recommended volunteers to fill remaining slots
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
