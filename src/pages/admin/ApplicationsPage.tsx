import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useVolunteerApplications, useReviewApplication, VolunteerApplication } from '@/hooks/useApplications';
import { 
  ClipboardList, 
  Search, 
  User, 
  GraduationCap, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  AlertCircle,
  Briefcase,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';

export function ApplicationsPage() {
  const [selectedApp, setSelectedApp] = useState<VolunteerApplication | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [volunteerType, setVolunteerType] = useState<'general' | 'employment'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const { data: applications, isLoading } = useVolunteerApplications(
    activeTab as 'pending' | 'approved' | 'rejected'
  );
  const reviewMutation = useReviewApplication();

  const filteredApplications = applications?.filter(app => {
    const fullName = `${app.first_name} ${app.father_name} ${app.family_name}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || 
           app.university_id.includes(search) || 
           app.university_email.toLowerCase().includes(search);
  });

  const handleApprove = async () => {
    if (!selectedApp) return;
    await reviewMutation.mutateAsync({
      applicationId: selectedApp.id,
      status: 'approved',
      volunteerType,
    });
    setShowApproveDialog(false);
    setSelectedApp(null);
    setVolunteerType('general');
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    await reviewMutation.mutateAsync({
      applicationId: selectedApp.id,
      status: 'rejected',
      rejectionReason,
    });
    setShowRejectDialog(false);
    setSelectedApp(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Volunteer Applications">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('pending')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{applications?.filter(a => a.status === 'pending').length || 0}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('approved')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{applications?.filter(a => a.status === 'approved').length || 0}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('rejected')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{applications?.filter(a => a.status === 'rejected').length || 0}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Applications
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-2">Loading applications...</p>
                  </div>
                ) : filteredApplications?.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No applications found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Try a different search term' : `No ${activeTab} applications yet`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredApplications?.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedApp(app)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {app.first_name} {app.father_name} {app.family_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {app.faculty?.name} • {app.university_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground hidden md:block">
                            {app.created_at ? format(new Date(app.created_at), 'MMM d, yyyy') : ''}
                          </span>
                          {getStatusBadge(app.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp && !showRejectDialog} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Application Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                {getStatusBadge(selectedApp.status)}
                <span className="text-sm text-muted-foreground">
                  Submitted: {selectedApp.created_at 
                    ? format(new Date(selectedApp.created_at), 'MMMM d, yyyy')
                    : 'N/A'}
                </span>
              </div>

              {/* Personal Info */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Full Name:</span>
                    <p className="font-medium">{selectedApp.first_name} {selectedApp.father_name} {selectedApp.grandfather_name} {selectedApp.family_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">University Email:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedApp.university_email}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedApp.phone_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Emergency Contact:</span>
                    <p className="font-medium">{selectedApp.emergency_contact_name} ({selectedApp.emergency_contact_phone})</p>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academic Information
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">University ID:</span>
                    <p className="font-medium">{selectedApp.university_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Faculty:</span>
                    <p className="font-medium">{selectedApp.faculty?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Major:</span>
                    <p className="font-medium">{selectedApp.major?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Academic Year:</span>
                    <p className="font-medium">{selectedApp.academic_year}</p>
                  </div>
                </div>
              </div>

              {/* Skills & Interests */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h3 className="font-semibold">Skills & Interests</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Skills:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedApp.skills?.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Interests:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedApp.interests?.map((interest) => (
                        <Badge key={interest} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivation */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h3 className="font-semibold">Motivation</h3>
                <p className="text-sm">{selectedApp.motivation}</p>
                {selectedApp.previous_experience && (
                  <>
                    <h4 className="font-medium text-sm mt-4">Previous Experience:</h4>
                    <p className="text-sm">{selectedApp.previous_experience}</p>
                  </>
                )}
              </div>

              {/* Availability */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Availability
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {selectedApp.availability?.map((avail: any, idx: number) => (
                    <div key={idx} className="p-2 bg-background rounded border">
                      <p className="font-medium">{avail.day}</p>
                      <p className="text-muted-foreground">{avail.timeSlots?.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Reason if rejected */}
              {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h3 className="font-semibold text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Rejection Reason
                  </h3>
                  <p className="text-sm mt-2">{selectedApp.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {selectedApp?.status === 'pending' && (
            <DialogFooter className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={reviewMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="hero"
                onClick={() => setShowApproveDialog(true)}
                disabled={reviewMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog - Select Volunteer Type */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Volunteer</DialogTitle>
            <DialogDescription>
              Select the volunteer type for this applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={volunteerType} onValueChange={(v) => setVolunteerType(v as 'general' | 'employment')}>
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer" onClick={() => setVolunteerType('general')}>
                <RadioGroupItem value="general" id="general" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="general" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Heart className="h-4 w-4 text-primary" />
                    General Volunteer
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Voluntary participation. Assignment is optional and based on availability.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer" onClick={() => setVolunteerType('employment')}>
                <RadioGroupItem value="employment" id="employment" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="employment" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Briefcase className="h-4 w-4 text-warning" />
                    Student Employment Program
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mandatory participation. Automatic assignment is required and enforced.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleApprove}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this application. This will be visible to the applicant.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
