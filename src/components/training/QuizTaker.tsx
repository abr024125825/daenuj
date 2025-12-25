import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ClipboardList, CheckCircle, XCircle, Play, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { useMyQuizAttempts } from '@/hooks/useQuizzes';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number;
  is_required: boolean;
  questions?: Question[];
}

interface QuizTakerProps {
  quiz: Quiz;
}

export function QuizTaker({ quiz }: QuizTakerProps) {
  const { hasPassedQuiz, getAttemptCount, submitQuiz, getQuizAttempts } = useMyQuizAttempts();
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passed = hasPassedQuiz(quiz.id);
  const attemptCount = getAttemptCount(quiz.id);
  const canAttempt = attemptCount < quiz.max_attempts && !passed;
  const questions = quiz.questions || [];
  const attempts = getQuizAttempts(quiz.id);
  const lastAttempt = attempts[attempts.length - 1];

  const handleStartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setQuizDialogOpen(true);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitQuiz.mutateAsync({
        quizId: quiz.id,
        answers,
        questions,
      });
      setShowResults(true);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  if (questions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 text-center text-muted-foreground">
          <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">الاختبار غير متاح حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={passed ? 'border-green-500/50 bg-green-50/50' : ''}>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${passed ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                {passed ? (
                  <Trophy className="h-5 w-5 text-green-500" />
                ) : (
                  <ClipboardList className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">{quiz.title}</CardTitle>
                <CardDescription className="text-xs">
                  {questions.length} أسئلة • درجة النجاح {quiz.passing_score}%
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {quiz.is_required && (
                <Badge variant="destructive" className="text-xs">مطلوب</Badge>
              )}
              {passed && (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  ناجح
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardFooter className="py-3 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            المحاولات: {attemptCount} / {quiz.max_attempts}
            {lastAttempt && !passed && (
              <span className="mr-2">• آخر نتيجة: {lastAttempt.score}%</span>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={handleStartQuiz}
            disabled={!canAttempt}
            variant={passed ? "outline" : "default"}
          >
            {passed ? (
              <>إعادة المراجعة</>
            ) : canAttempt ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                بدء الاختبار
              </>
            ) : (
              <>انتهت المحاولات</>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{quiz.title}</DialogTitle>
            {quiz.description && (
              <DialogDescription>{quiz.description}</DialogDescription>
            )}
          </DialogHeader>

          {!showResults ? (
            <div className="space-y-6 py-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>السؤال {currentQuestionIndex + 1} من {questions.length}</span>
                  <span>{answeredCount} إجابة من {questions.length}</span>
                </div>
                <Progress value={progress} />
              </div>

              {/* Question */}
              {currentQuestion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {currentQuestionIndex + 1}. {currentQuestion.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={answers[currentQuestion.id] || ''}
                      onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                    >
                      {currentQuestion.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  السابق
                </Button>
                
                <div className="flex gap-1">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        idx === currentQuestionIndex
                          ? 'bg-primary text-primary-foreground'
                          : answers[questions[idx].id]
                          ? 'bg-green-500 text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={answeredCount < questions.length || submitting || passed}
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    تقديم الإجابات
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    التالي
                  </Button>
                )}
              </div>

              {answeredCount < questions.length && currentQuestionIndex === questions.length - 1 && (
                <p className="text-sm text-amber-600 flex items-center gap-1 justify-center">
                  <AlertCircle className="h-4 w-4" />
                  يرجى الإجابة على جميع الأسئلة قبل التقديم
                </p>
              )}
            </div>
          ) : (
            /* Results */
            <div className="space-y-6 py-4">
              {submitQuiz.data && (
                <div className={`text-center p-6 rounded-lg ${
                  submitQuiz.data.passed ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {submitQuiz.data.passed ? (
                    <>
                      <Trophy className="h-16 w-16 mx-auto text-green-500 mb-4" />
                      <h3 className="text-2xl font-bold text-green-700 mb-2">مبروك! 🎉</h3>
                      <p className="text-green-600">لقد اجتزت الاختبار بنجاح</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                      <h3 className="text-2xl font-bold text-red-700 mb-2">حاول مرة أخرى</h3>
                      <p className="text-red-600">لم تصل لدرجة النجاح المطلوبة</p>
                    </>
                  )}
                  <div className="mt-4 text-4xl font-bold">
                    {submitQuiz.data.score}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    درجة النجاح المطلوبة: {quiz.passing_score}%
                  </p>
                </div>
              )}

              {/* Review Answers */}
              <div className="space-y-3">
                <h4 className="font-medium">مراجعة الإجابات:</h4>
                {questions.map((q, idx) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correct_answer;
                  
                  return (
                    <Card key={q.id} className={isCorrect ? 'border-green-200' : 'border-red-200'}>
                      <CardContent className="py-3">
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{idx + 1}. {q.question}</p>
                            <p className="text-sm mt-1">
                              <span className="text-muted-foreground">إجابتك: </span>
                              <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                {userAnswer || 'لم تجب'}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-green-600 mt-1">
                                الإجابة الصحيحة: {q.correct_answer}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button 
                className="w-full" 
                onClick={() => setQuizDialogOpen(false)}
              >
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
