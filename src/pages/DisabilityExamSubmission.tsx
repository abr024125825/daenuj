import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Accessibility, 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  Trash2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Logo } from '@/components/Logo';

interface ExamEntry {
  id: string;
  course_name: string;
  course_code: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location: string;
  notes: string;
}

export function DisabilityExamSubmission() {
  const { toast } = useToast();
  const [step, setStep] = useState<'verify' | 'exams' | 'success'>('verify');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [universityId, setUniversityId] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [studentInfo, setStudentInfo] = useState<{ id: string; student_name: string } | null>(null);
  const [exams, setExams] = useState<ExamEntry[]>([
    createEmptyExam(),
  ]);

  function createEmptyExam(): ExamEntry {
    return {
      id: crypto.randomUUID(),
      course_name: '',
      course_code: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      duration_minutes: 60,
      location: '',
      notes: '',
    };
  }

  const handleVerify = async () => {
    if (!universityId.trim() || !nationalId.trim()) {
      toast({ title: 'Error', description: 'Please enter both your University ID and National ID', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from('disability_students')
        .select('id, student_name')
        .eq('university_id', universityId.trim())
        .eq('national_id', nationalId.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({ 
          title: 'Verification Failed', 
          description: 'No active student found with the provided University ID and National ID. Please contact the Disability Services office.',
          variant: 'destructive' 
        });
        return;
      }

      setStudentInfo(data);
      setStep('exams');
      toast({ title: 'Verified', description: `Welcome, ${data.student_name}!` });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const updateExam = (id: string, field: keyof ExamEntry, value: string | number) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addExam = () => {
    setExams(prev => [...prev, createEmptyExam()]);
  };

  const removeExam = (id: string) => {
    if (exams.length <= 1) return;
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const handleSubmit = async () => {
    if (!studentInfo) return;

    // Validate all exams
    const invalidExams = exams.filter(e => !e.course_name || !e.exam_date || !e.start_time || !e.end_time);
    if (invalidExams.length > 0) {
      toast({ title: 'Error', description: 'Please fill in the required fields for all exams (Course Name, Date, Start Time, End Time)', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const submissions = exams.map(exam => ({
        student_id: studentInfo.id,
        course_name: exam.course_name,
        course_code: exam.course_code || null,
        exam_date: exam.exam_date,
        start_time: exam.start_time,
        end_time: exam.end_time,
        duration_minutes: exam.duration_minutes,
        location: exam.location || null,
        notes: exam.notes || null,
      }));

      const { error } = await supabase
        .from('disability_student_exam_submissions')
        .insert(submissions);

      if (error) throw error;

      setStep('success');
      toast({ title: 'Success', description: `${exams.length} exam(s) submitted successfully!` });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm" role="banner">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <h1 className="text-lg font-bold">Disability Exam Submission</h1>
              <p className="text-xs text-muted-foreground">Dean of Student Affairs</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Accessibility className="h-3 w-3" aria-hidden="true" />
            <span>Accessible</span>
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl" role="main" aria-label="Exam submission form">
        {step === 'verify' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Student Verification</CardTitle>
              <CardDescription>
                Enter your University ID and National ID to verify your identity and submit exam schedules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="university-id">University ID <span className="text-destructive" aria-label="required">*</span></Label>
                <Input
                  id="university-id"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  placeholder="e.g., 0192345678"
                  className="h-12 text-lg"
                  aria-required="true"
                  aria-describedby="university-id-help"
                  autoComplete="off"
                />
                <p id="university-id-help" className="text-xs text-muted-foreground">
                  Your 10-digit university student ID number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="national-id">National ID <span className="text-destructive" aria-label="required">*</span></Label>
                <Input
                  id="national-id"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g., 9991234567"
                  className="h-12 text-lg"
                  aria-required="true"
                  aria-describedby="national-id-help"
                  autoComplete="off"
                />
                <p id="national-id-help" className="text-xs text-muted-foreground">
                  Your national identification number
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" role="note">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Important</p>
                    <p>You must be registered as a student with disabilities to use this form. If you are not registered, please visit the Disability Services office first.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleVerify} 
                disabled={isVerifying || !universityId.trim() || !nationalId.trim()} 
                className="w-full h-12 text-lg"
                aria-label="Verify identity and proceed"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'exams' && studentInfo && (
          <div className="space-y-6">
            {/* Student Info Bar */}
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Verified: {studentInfo.student_name}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">University ID: {universityId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                  Submit Exam Schedules
                </CardTitle>
                <CardDescription>
                  Add your upcoming exams below. You can add multiple exams at once.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6" role="list" aria-label="Exam entries">
                  {exams.map((exam, index) => (
                    <fieldset 
                      key={exam.id} 
                      className="p-4 border rounded-lg space-y-4 relative"
                      role="listitem"
                      aria-label={`Exam ${index + 1}`}
                    >
                      <legend className="sr-only">Exam {index + 1}</legend>
                      
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm text-muted-foreground">
                          Exam {index + 1}
                        </h3>
                        {exams.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExam(exam.id)}
                            aria-label={`Remove exam ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`course-name-${exam.id}`}>
                            Course Name <span className="text-destructive" aria-label="required">*</span>
                          </Label>
                          <Input
                            id={`course-name-${exam.id}`}
                            value={exam.course_name}
                            onChange={(e) => updateExam(exam.id, 'course_name', e.target.value)}
                            placeholder="e.g., Introduction to Programming"
                            aria-required="true"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`course-code-${exam.id}`}>Course Code</Label>
                          <Input
                            id={`course-code-${exam.id}`}
                            value={exam.course_code}
                            onChange={(e) => updateExam(exam.id, 'course_code', e.target.value)}
                            placeholder="e.g., CS101"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`exam-date-${exam.id}`}>
                          <Calendar className="h-4 w-4 inline mr-1" aria-hidden="true" />
                          Exam Date <span className="text-destructive" aria-label="required">*</span>
                        </Label>
                        <Input
                          id={`exam-date-${exam.id}`}
                          type="date"
                          value={exam.exam_date}
                          onChange={(e) => updateExam(exam.id, 'exam_date', e.target.value)}
                          aria-required="true"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`start-time-${exam.id}`}>
                            <Clock className="h-4 w-4 inline mr-1" aria-hidden="true" />
                            Start Time <span className="text-destructive" aria-label="required">*</span>
                          </Label>
                          <Input
                            id={`start-time-${exam.id}`}
                            type="time"
                            value={exam.start_time}
                            onChange={(e) => updateExam(exam.id, 'start_time', e.target.value)}
                            aria-required="true"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`end-time-${exam.id}`}>
                            <Clock className="h-4 w-4 inline mr-1" aria-hidden="true" />
                            End Time <span className="text-destructive" aria-label="required">*</span>
                          </Label>
                          <Input
                            id={`end-time-${exam.id}`}
                            type="time"
                            value={exam.end_time}
                            onChange={(e) => updateExam(exam.id, 'end_time', e.target.value)}
                            aria-required="true"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`duration-${exam.id}`}>Duration (minutes)</Label>
                          <Input
                            id={`duration-${exam.id}`}
                            type="number"
                            min="1"
                            value={exam.duration_minutes}
                            onChange={(e) => updateExam(exam.id, 'duration_minutes', parseInt(e.target.value) || 60)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`location-${exam.id}`}>Location</Label>
                          <Input
                            id={`location-${exam.id}`}
                            value={exam.location}
                            onChange={(e) => updateExam(exam.id, 'location', e.target.value)}
                            placeholder="e.g., Building A, Room 101"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`notes-${exam.id}`}>Additional Notes</Label>
                        <Textarea
                          id={`notes-${exam.id}`}
                          value={exam.notes}
                          onChange={(e) => updateExam(exam.id, 'notes', e.target.value)}
                          placeholder="Any special instructions or notes..."
                          rows={2}
                        />
                      </div>
                    </fieldset>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addExam}
                  className="w-full mt-4"
                  aria-label="Add another exam"
                >
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Add Another Exam
                </Button>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('verify');
                      setStudentInfo(null);
                      setExams([createEmptyExam()]);
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-12"
                    aria-label={`Submit ${exams.length} exam(s)`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                        Submitting...
                      </>
                    ) : (
                      `Submit ${exams.length} Exam(s)`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'success' && (
          <Card className="text-center">
            <CardContent className="py-12 space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" aria-hidden="true">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                  Exams Submitted Successfully!
                </h2>
                <p className="text-muted-foreground mt-2">
                  Your exam schedules have been submitted and will be reviewed by the Disability Services team. 
                  Volunteers will be assigned to assist you.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted" role="status">
                <p className="text-sm font-medium">{exams.length} exam(s) submitted for {studentInfo?.student_name}</p>
              </div>
              <Button
                onClick={() => {
                  setStep('verify');
                  setStudentInfo(null);
                  setUniversityId('');
                  setNationalId('');
                  setExams([createEmptyExam()]);
                }}
                variant="outline"
              >
                Submit More Exams
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground" role="contentinfo">
        <p>Dean of Student Affairs — University of Jordan</p>
        <p className="mt-1">For assistance, contact the Disability Services office</p>
      </footer>
    </div>
  );
}
