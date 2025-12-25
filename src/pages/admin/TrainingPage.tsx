import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { GraduationCap, Plus, BookOpen, Video, FileText, Loader2, Pencil, Trash2, Link2 } from 'lucide-react';
import { useTrainingCourses } from '@/hooks/useTraining';

export function TrainingPage() {
  const { courses, isLoading, createCourse, addContent, deleteCourse, deleteContent, updateCourse } = useTrainingCourses();
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editCourseDialogOpen, setEditCourseDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteContentDialogOpen, setDeleteContentDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [editingCourse, setEditingCourse] = useState<any>(null);
  
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    is_required: false,
  });
  const [newContent, setNewContent] = useState({
    title: '',
    type: 'text',
    content: '',
  });

  const handleCreateCourse = async () => {
    await createCourse.mutateAsync(newCourse);
    setCourseDialogOpen(false);
    setNewCourse({ title: '', description: '', is_required: false });
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;
    await updateCourse.mutateAsync({
      id: editingCourse.id,
      title: editingCourse.title,
      description: editingCourse.description,
      is_required: editingCourse.is_required,
    });
    setEditCourseDialogOpen(false);
    setEditingCourse(null);
  };

  const handleAddContent = async () => {
    await addContent.mutateAsync({
      ...newContent,
      course_id: selectedCourseId,
    });
    setContentDialogOpen(false);
    setNewContent({ title: '', type: 'text', content: '' });
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourseId) return;
    await deleteCourse.mutateAsync(selectedCourseId);
    setDeleteDialogOpen(false);
    setSelectedCourseId('');
  };

  const handleDeleteContent = async () => {
    if (!selectedContentId) return;
    await deleteContent.mutateAsync(selectedContentId);
    setDeleteContentDialogOpen(false);
    setSelectedContentId('');
  };

  const openContentDialog = (courseId: string) => {
    setSelectedCourseId(courseId);
    setContentDialogOpen(true);
  };

  const openEditCourseDialog = (course: any) => {
    setEditingCourse({ ...course });
    setEditCourseDialogOpen(true);
  };

  const openDeleteCourseDialog = (courseId: string) => {
    setSelectedCourseId(courseId);
    setDeleteDialogOpen(true);
  };

  const openDeleteContentDialog = (contentId: string) => {
    setSelectedContentId(contentId);
    setDeleteContentDialogOpen(true);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'document': return FileText;
      case 'link': return Link2;
      default: return BookOpen;
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Training Courses</h2>
            <p className="text-muted-foreground">Manage training content for volunteers</p>
          </div>
          <Button onClick={() => setCourseDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>

        <div className="space-y-4">
          {courses?.map((course: any) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.is_required && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                    <Badge variant="secondary">
                      {course.content?.length || 0} items
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openContentDialog(course.id)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Content
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditCourseDialog(course)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openDeleteCourseDialog(course.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {course.content && course.content.length > 0 && (
                <CardContent>
                  <Accordion type="single" collapsible>
                    {course.content.map((item: any, index: number) => {
                      const Icon = getContentIcon(item.type);
                      return (
                        <AccordionItem key={item.id} value={item.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                {index + 1}
                              </span>
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{item.title}</span>
                              <Badge variant="outline" className="ml-2">{item.type}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-12 prose prose-sm max-w-none">
                              {item.type === 'video' || item.type === 'link' ? (
                                <div className="space-y-2">
                                  <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {item.type === 'video' ? 'Watch Video' : 'Open Link'}
                                  </a>
                                  {item.type === 'video' && item.content.includes('youtube') && (
                                    <div className="aspect-video mt-2">
                                      <iframe
                                        src={item.content.replace('watch?v=', 'embed/')}
                                        className="w-full h-full rounded-lg"
                                        allowFullScreen
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : item.type === 'document' ? (
                                <div className="space-y-2">
                                  <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Download Document
                                  </a>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">{item.content}</p>
                              )}
                              <div className="flex justify-end mt-4">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-destructive"
                                  onClick={() => openDeleteContentDialog(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              )}
            </Card>
          ))}
          {(!courses || courses.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                <p className="text-muted-foreground">Create your first training course to get started</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Course Dialog */}
        <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Training Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Course Title</Label>
                <Input
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Introduction to Volunteering"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Course description..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Required Course</Label>
                  <p className="text-sm text-muted-foreground">Volunteers must complete this before participating</p>
                </div>
                <Switch
                  checked={newCourse.is_required}
                  onCheckedChange={(checked) => setNewCourse({ ...newCourse, is_required: checked })}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateCourse}
                disabled={!newCourse.title || createCourse.isPending}
              >
                {createCourse.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={editCourseDialogOpen} onOpenChange={setEditCourseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Training Course</DialogTitle>
            </DialogHeader>
            {editingCourse && (
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Course Title</Label>
                  <Input
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Required Course</Label>
                    <p className="text-sm text-muted-foreground">Volunteers must complete this before participating</p>
                  </div>
                  <Switch
                    checked={editingCourse.is_required}
                    onCheckedChange={(checked) => setEditingCourse({ ...editingCourse, is_required: checked })}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleUpdateCourse}
                  disabled={!editingCourse.title || updateCourse.isPending}
                >
                  {updateCourse.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Content Dialog */}
        <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Content</DialogTitle>
              <DialogDescription>
                Add text, video, document, or link to the course
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Content Title</Label>
                <Input
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  placeholder="Lesson 1: Getting Started"
                />
              </div>
              <div className="grid gap-2">
                <Label>Content Type</Label>
                <Select
                  value={newContent.type}
                  onValueChange={(value) => setNewContent({ ...newContent, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Content</SelectItem>
                    <SelectItem value="video">Video URL (YouTube, Vimeo)</SelectItem>
                    <SelectItem value="document">Document URL (PDF, DOC)</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>
                  {newContent.type === 'text' ? 'Content' : 
                   newContent.type === 'video' ? 'Video URL' :
                   newContent.type === 'document' ? 'Document URL' : 'Link URL'}
                </Label>
                <Textarea
                  value={newContent.content}
                  onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                  placeholder={
                    newContent.type === 'video' ? 'https://youtube.com/watch?v=...' : 
                    newContent.type === 'document' ? 'https://example.com/document.pdf' :
                    newContent.type === 'link' ? 'https://example.com' :
                    'Content text...'
                  }
                  rows={newContent.type === 'text' ? 6 : 2}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAddContent}
                disabled={!newContent.title || !newContent.content || addContent.isPending}
              >
                {addContent.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Content
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Course Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this course? This will also delete all content within it. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Content Confirmation */}
        <AlertDialog open={deleteContentDialogOpen} onOpenChange={setDeleteContentDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Content</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this content? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteContent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
