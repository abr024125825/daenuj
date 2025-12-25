import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GraduationCap, BookOpen, Video, FileText, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { useMyTraining } from '@/hooks/useTraining';

export function VolunteerTrainingPage() {
  const { courses, isLoading, markContentComplete, getCompletedContentIds, isCourseComplete } = useMyTraining();
  const completedContentIds = getCompletedContentIds();

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'document': return FileText;
      default: return BookOpen;
    }
  };

  const calculateProgress = (course: any) => {
    if (!course.content || course.content.length === 0) return 0;
    const completed = course.content.filter((c: any) => completedContentIds.has(c.id)).length;
    return (completed / course.content.length) * 100;
  };

  const requiredCourses = courses?.filter((c: any) => c.is_required) || [];
  const optionalCourses = courses?.filter((c: any) => !c.is_required) || [];

  const requiredCompleted = requiredCourses.filter((c: any) => 
    isCourseComplete(c.id, c.content?.length || 0)
  ).length;

  if (isLoading) {
    return (
      <DashboardLayout title="Training">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Training">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Training Courses</h2>
          <p className="text-muted-foreground">Complete required training to participate in opportunities</p>
        </div>

        {/* Progress Overview */}
        <Card className="gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Required Training Progress</h3>
                <p className="text-primary-foreground/70">
                  {requiredCompleted} of {requiredCourses.length} required courses completed
                </p>
              </div>
              {requiredCompleted === requiredCourses.length && requiredCourses.length > 0 && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  All Required Complete
                </Badge>
              )}
            </div>
            <Progress 
              value={requiredCourses.length ? (requiredCompleted / requiredCourses.length) * 100 : 100} 
              className="bg-primary-foreground/20"
            />
          </CardContent>
        </Card>

        {/* Required Courses */}
        {requiredCourses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="destructive">Required</Badge>
              Complete these before volunteering
            </h3>
            {requiredCourses.map((course: any) => {
              const progress = calculateProgress(course);
              const isComplete = isCourseComplete(course.id, course.content?.length || 0);

              return (
                <Card key={course.id} className={isComplete ? 'border-green-500/50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                          {isComplete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <GraduationCap className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={isComplete ? 'default' : 'secondary'}>
                        {Math.round(progress)}% Complete
                      </Badge>
                    </div>
                    <Progress value={progress} className="mt-4" />
                  </CardHeader>
                  {course.content && course.content.length > 0 && (
                    <CardContent>
                      <Accordion type="single" collapsible>
                        {course.content.map((item: any, index: number) => {
                          const Icon = getContentIcon(item.type);
                          const isItemComplete = completedContentIds.has(item.id);

                          return (
                            <AccordionItem key={item.id} value={item.id}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  {isItemComplete ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span className={isItemComplete ? 'line-through text-muted-foreground' : ''}>
                                    {item.title}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-12 space-y-4">
                                  {item.type === 'video' ? (
                                    <a 
                                      href={item.content} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-primary hover:underline"
                                    >
                                      Watch Video
                                    </a>
                                  ) : (
                                    <p className="whitespace-pre-wrap text-muted-foreground">{item.content}</p>
                                  )}
                                  {!isItemComplete && (
                                    <Button
                                      size="sm"
                                      onClick={() => markContentComplete.mutate({ courseId: course.id, contentId: item.id })}
                                      disabled={markContentComplete.isPending}
                                    >
                                      {markContentComplete.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                      Mark as Complete
                                    </Button>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Optional Courses */}
        {optionalCourses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Training</h3>
            {optionalCourses.map((course: any) => {
              const progress = calculateProgress(course);
              const isComplete = isCourseComplete(course.id, course.content?.length || 0);

              return (
                <Card key={course.id} className={isComplete ? 'border-green-500/50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-500/10' : 'bg-muted'}`}>
                          {isComplete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <GraduationCap className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {Math.round(progress)}% Complete
                      </Badge>
                    </div>
                    <Progress value={progress} className="mt-4" />
                  </CardHeader>
                  {course.content && course.content.length > 0 && (
                    <CardContent>
                      <Accordion type="single" collapsible>
                        {course.content.map((item: any) => {
                          const Icon = getContentIcon(item.type);
                          const isItemComplete = completedContentIds.has(item.id);

                          return (
                            <AccordionItem key={item.id} value={item.id}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  {isItemComplete ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  <span className={isItemComplete ? 'line-through text-muted-foreground' : ''}>
                                    {item.title}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-12 space-y-4">
                                  {item.type === 'video' ? (
                                    <a 
                                      href={item.content} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-primary hover:underline"
                                    >
                                      Watch Video
                                    </a>
                                  ) : (
                                    <p className="whitespace-pre-wrap text-muted-foreground">{item.content}</p>
                                  )}
                                  {!isItemComplete && (
                                    <Button
                                      size="sm"
                                      onClick={() => markContentComplete.mutate({ courseId: course.id, contentId: item.id })}
                                      disabled={markContentComplete.isPending}
                                    >
                                      Mark as Complete
                                    </Button>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {(!courses || courses.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No training courses yet</h3>
              <p className="text-muted-foreground">Training courses will appear here when available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
