import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle,
  Star,
  Loader2
} from 'lucide-react';
import { useOpportunityMatching } from '@/hooks/useOpportunityMatching';
import { useOpportunityRegistrations } from '@/hooks/useOpportunities';
import { format } from 'date-fns';

export function OpportunityRecommendations() {
  const { matches, volunteer, isLoading } = useOpportunityMatching();
  const { registerForOpportunity } = useOpportunityRegistrations();

  const handleRegister = async (opportunityId: string) => {
    if (!volunteer) return;
    await registerForOpportunity.mutateAsync({
      opportunityId,
      volunteerId: volunteer.id,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!volunteer) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Complete your volunteer registration to see recommendations.</p>
        </CardContent>
      </Card>
    );
  }

  const topMatches = matches.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Recommendations
        </CardTitle>
        <CardDescription>
          Opportunities matched to your interests and availability
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topMatches.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No matching opportunities at the moment.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back later for new opportunities!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topMatches.map((match, index) => (
              <div
                key={match.opportunity.id}
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  match.isAvailable 
                    ? 'bg-card border-border' 
                    : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {index < 3 && (
                        <div className={`
                          flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${index === 0 ? 'bg-yellow-500 text-yellow-950' : 
                            index === 1 ? 'bg-gray-300 text-gray-700' : 
                            'bg-amber-600 text-amber-50'}
                        `}>
                          {index + 1}
                        </div>
                      )}
                      <h4 className="font-semibold truncate">{match.opportunity.title}</h4>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {match.matchReasons.map((reason, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {reason}
                        </Badge>
                      ))}
                      {!match.isAvailable && match.conflictReason && (
                        <Badge variant="outline" className="text-xs text-destructive border-destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {match.conflictReason}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(match.opportunity.date), 'MMM dd')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {match.opportunity.start_time?.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.opportunity.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {match.opportunity.registrations?.[0]?.count || 0}/{match.opportunity.required_volunteers}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {match.matchScore}%
                      </div>
                      <Progress value={match.matchScore} className="w-16 h-2 mt-1" />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRegister(match.opportunity.id)}
                      disabled={!match.isAvailable || registerForOpportunity.isPending}
                    >
                      {registerForOpportunity.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Register'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
