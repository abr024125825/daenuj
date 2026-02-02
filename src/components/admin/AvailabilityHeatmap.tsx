import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Info } from 'lucide-react';
import { useAvailabilityHeatmap } from '@/hooks/useAvailabilityHeatmap';
import { useFaculties } from '@/hooks/useFaculties';
import { useAcademicSemesters } from '@/hooks/useAcademicSemesters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AvailabilityHeatmap() {
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const { data: faculties } = useFaculties();
  const { activeSemester } = useAcademicSemesters();
  
  const { heatmap, totalVolunteers, isLoading } = useAvailabilityHeatmap(
    activeSemester?.id,
    selectedFaculty === 'all' ? undefined : selectedFaculty
  );

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  const getColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-green-400';
    if (percentage >= 40) return 'bg-yellow-400';
    if (percentage >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getColorLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Moderate';
    if (percentage >= 20) return 'Limited';
    return 'Low';
  };

  const formatHour = (hour: number) => {
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Volunteer Availability Heatmap
            </CardTitle>
            <CardDescription>
              Visual overview of when volunteers are available ({totalVolunteers} total)
            </CardDescription>
          </div>
          <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {faculties?.map((faculty) => (
                <SelectItem key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {totalVolunteers === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No volunteers found for the selected criteria.</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Availability:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-xs">80-100%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-400" />
                <span className="text-xs">60-79%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-yellow-400" />
                <span className="text-xs">40-59%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-orange-400" />
                <span className="text-xs">20-39%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-400" />
                <span className="text-xs">0-19%</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header Row */}
                <div className="grid grid-cols-[100px_repeat(12,1fr)] gap-1 mb-1">
                  <div /> {/* Empty corner cell */}
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className="text-xs text-center text-muted-foreground font-medium py-1"
                    >
                      {formatHour(hour)}
                    </div>
                  ))}
                </div>

                {/* Day Rows */}
                <TooltipProvider>
                  {days.map(day => (
                    <div key={day} className="grid grid-cols-[100px_repeat(12,1fr)] gap-1 mb-1">
                      <div className="text-sm font-medium py-2 flex items-center">
                        {day}
                      </div>
                      {hours.map(hour => {
                        const cell = heatmap.find(h => h.day === day && h.hour === hour);
                        if (!cell) return <div key={hour} className="h-10 bg-muted rounded" />;

                        return (
                          <Tooltip key={hour}>
                            <TooltipTrigger asChild>
                              <div
                                className={`
                                  h-10 rounded cursor-pointer transition-all hover:scale-105 hover:shadow-md
                                  flex items-center justify-center
                                  ${getColor(cell.percentage)}
                                `}
                              >
                                <span className="text-xs font-semibold text-white drop-shadow">
                                  {cell.availableCount}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-semibold">{day} at {formatHour(hour)}</p>
                                <p>{cell.availableCount} of {cell.totalCount} available</p>
                                <p className="text-muted-foreground">
                                  {cell.percentage}% - {getColorLabel(cell.percentage)}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </TooltipProvider>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Morning (8-12)', 'Afternoon (12-4)', 'Evening (4-8)'].map((period, idx) => {
                const startHour = idx === 0 ? 8 : idx === 1 ? 12 : 16;
                const endHour = idx === 0 ? 12 : idx === 1 ? 16 : 20;
                
                const periodCells = heatmap.filter(h => h.hour >= startHour && h.hour < endHour);
                const avgAvailable = periodCells.length > 0
                  ? Math.round(periodCells.reduce((sum, c) => sum + c.percentage, 0) / periodCells.length)
                  : 0;

                return (
                  <div key={period} className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">{period}</p>
                    <p className="text-2xl font-bold">{avgAvailable}%</p>
                    <Badge variant="secondary" className="mt-1">
                      {getColorLabel(avgAvailable)}
                    </Badge>
                  </div>
                );
              })}
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Total Volunteers</p>
                <p className="text-2xl font-bold">{totalVolunteers}</p>
                <Badge variant="outline" className="mt-1">Active</Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
