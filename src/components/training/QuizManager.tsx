import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClipboardList, Plus, Pencil, Trash2, Loader2, HelpCircle } from 'lucide-react';
import { useQuizzes } from '@/hooks/useQuizzes';

interface QuizManagerProps {
  courseId: string;
  courseName: string;
}

export function QuizManager({ courseId, courseName }: QuizManagerProps) {
  const { quizzes, isLoading, createQuiz, updateQuiz, deleteQuiz, addQuestion, deleteQuestion } = useQuizzes(courseId);
  
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [deleteQuizDialogOpen, setDeleteQuizDialogOpen] = useState(false);
  const [deleteQuestionDialogOpen, setDeleteQuestionDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit_minutes: null as number | null,
    max_attempts: 3,
    is_required: true,
  });

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
  });

  const handleCreateQuiz = async () => {
    await createQuiz.mutateAsync({
      ...newQuiz,
      course_id: courseId,
      order_index: quizzes?.length || 0,
    });
    setQuizDialogOpen(false);
    setNewQuiz({
      title: '',
      description: '',
      passing_score: 70,
      time_limit_minutes: null,
      max_attempts: 3,
      is_required: true,
    });
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz) return;
    await updateQuiz.mutateAsync(editingQuiz);
    setEditingQuiz(null);
  };

  const handleAddQuestion = async () => {
    const options = newQuestion.options.filter(o => o.trim() !== '');
    if (options.length < 2) {
      return;
    }
    
    await addQuestion.mutateAsync({
      quiz_id: selectedQuizId,
      question: newQuestion.question,
      options: options,
      correct_answer: newQuestion.correct_answer,
      points: newQuestion.points,
      order_index: 0,
    });
    setQuestionDialogOpen(false);
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
    });
  };

  const handleDeleteQuiz = async () => {
    await deleteQuiz.mutateAsync(selectedQuizId);
    setDeleteQuizDialogOpen(false);
    setSelectedQuizId('');
  };

  const handleDeleteQuestion = async () => {
    await deleteQuestion.mutateAsync(selectedQuestionId);
    setDeleteQuestionDialogOpen(false);
    setSelectedQuestionId('');
  };

  const openQuestionDialog = (quizId: string) => {
    setSelectedQuizId(quizId);
    setQuestionDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const courseQuizzes = quizzes?.filter(q => q.course_id === courseId) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Course Quizzes
        </h4>
        <Button size="sm" onClick={() => setQuizDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Quiz
        </Button>
      </div>

      {courseQuizzes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quizzes for this course</p>
      ) : (
        <div className="space-y-3">
          {courseQuizzes.map((quiz: any) => (
            <Card key={quiz.id} className="border-dashed">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      {quiz.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Passing Score: {quiz.passing_score}% | 
                      {quiz.questions?.length || 0} questions | 
                      {quiz.max_attempts} attempts
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {quiz.is_required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => openQuestionDialog(quiz.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingQuiz(quiz)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => {
                      setSelectedQuizId(quiz.id);
                      setDeleteQuizDialogOpen(true);
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {quiz.questions && quiz.questions.length > 0 && (
                <CardContent className="py-2">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="questions" className="border-none">
                      <AccordionTrigger className="py-2 text-sm">
                        View Questions ({quiz.questions.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {quiz.questions.map((q: any, idx: number) => (
                            <div key={q.id} className="flex items-start justify-between p-2 bg-muted/50 rounded-md">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                                <div className="mt-1 space-y-1">
                                  {q.options?.map((opt: string, i: number) => (
                                    <p key={i} className={`text-xs ${opt === q.correct_answer ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                      {opt === q.correct_answer ? '✓ ' : '  '}{opt}
                                    </p>
                                  ))}
                                </div>
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6"
                                onClick={() => {
                                  setSelectedQuestionId(q.id);
                                  setDeleteQuestionDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Quiz Title</Label>
              <Input
                value={newQuiz.title}
                onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                placeholder="Introduction Quiz"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={newQuiz.description}
                onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                placeholder="Quiz description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Passing Score (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newQuiz.passing_score}
                  onChange={(e) => setNewQuiz({ ...newQuiz, passing_score: parseInt(e.target.value) || 70 })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Max Attempts</Label>
                <Input
                  type="number"
                  min={1}
                  value={newQuiz.max_attempts}
                  onChange={(e) => setNewQuiz({ ...newQuiz, max_attempts: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Required Quiz</Label>
                <p className="text-sm text-muted-foreground">Must be passed to complete the course</p>
              </div>
              <Switch
                checked={newQuiz.is_required}
                onCheckedChange={(checked) => setNewQuiz({ ...newQuiz, is_required: checked })}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateQuiz}
              disabled={!newQuiz.title || createQuiz.isPending}
            >
              {createQuiz.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Quiz Dialog */}
      <Dialog open={!!editingQuiz} onOpenChange={() => setEditingQuiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
          </DialogHeader>
          {editingQuiz && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Quiz Title</Label>
                <Input
                  value={editingQuiz.title}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={editingQuiz.description || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editingQuiz.passing_score}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, passing_score: parseInt(e.target.value) || 70 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Max Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingQuiz.max_attempts}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, max_attempts: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Required Quiz</Label>
                <Switch
                  checked={editingQuiz.is_required}
                  onCheckedChange={(checked) => setEditingQuiz({ ...editingQuiz, is_required: checked })}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleUpdateQuiz}
                disabled={updateQuiz.isPending}
              >
                {updateQuiz.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Question</Label>
              <Textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="Enter question text..."
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Options (at least 2)</Label>
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...newQuestion.options];
                      newOptions[idx] = e.target.value;
                      setNewQuestion({ ...newQuestion, options: newOptions });
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={newQuestion.correct_answer === opt && opt ? "default" : "outline"}
                    onClick={() => setNewQuestion({ ...newQuestion, correct_answer: opt })}
                    disabled={!opt}
                    className="shrink-0"
                  >
                    Correct
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                value={newQuestion.points}
                onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAddQuestion}
              disabled={
                !newQuestion.question || 
                !newQuestion.correct_answer ||
                newQuestion.options.filter(o => o.trim()).length < 2 ||
                addQuestion.isPending
              }
            >
              {addQuestion.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Confirmation */}
      <AlertDialog open={deleteQuizDialogOpen} onOpenChange={setDeleteQuizDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz? All questions and attempts will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuiz}>
              {deleteQuiz.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirmation */}
      <AlertDialog open={deleteQuestionDialogOpen} onOpenChange={setDeleteQuestionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion}>
              {deleteQuestion.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
