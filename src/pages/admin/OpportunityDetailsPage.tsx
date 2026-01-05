import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { 
  ArrowLeft, Calendar, MapPin, Users, Clock,
  ChevronDown, ChevronUp, CheckCircle, XCircle, 
  UserMinus, Printer, QrCode, Keyboard, Hash,
  Award, Trash2, Pencil, Download, Loader2, Send,
  Lock, Unlock, UserPlus, Sparkles, Shield, ClockIcon, IdCard
} from 'lucide-react';
import { useOpportunities, useOpportunityRegistrations } from '@/hooks/useOpportunities';
import { useFaculties } from '@/hooks/useFaculties';
import { useCertificates, useCertificateTemplates } from '@/hooks/useCertificates';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Checkbox } from '@/components/ui/checkbox';
import { INTERESTS } from '@/types';
import { 
  generateOpportunityVolunteersPDF, 
  generateOpportunityListPDF,
  generateOpportunityReportPDF 
} from '@/lib/generateOpportunityPDF';
import { VolunteerAvailabilityLists } from '@/components/admin/VolunteerAvailabilityLists';
import { OpportunityRecommendations } from '@/components/admin/OpportunityRecommendations';
import { BadgeManagement } from '@/components/admin/BadgeManagement';

export function OpportunityDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { opportunities, isLoading, updateOpportunity, deleteOpportunity, generateQRCode, closeQRCode, reopenQRCode, publishOpportunity, completeOpportunity } = useOpportunities();
  const { data: faculties } = useFaculties();
  const { registrations, approveRegistration, rejectRegistration, manualCheckIn } = useOpportunityRegistrations(id);
  const { issueCertificate } = useCertificates();
  const { templates } = useCertificateTemplates();
  
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('volunteers');
  const [attendanceMethod, setAttendanceMethod] = useState<'qr' | 'manual' | 'token' | null>(null);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [manualToken, setManualToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  
  // Password protection states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
  
  // Recommendation states
  const [recommendDialogOpen, setRecommendDialogOpen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [matchingVolunteers, setMatchingVolunteers] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    required_volunteers: 1,
    faculty_restriction: '',
    target_interests: [] as string[],
  });
  
  const opportunity = opportunities?.find((o: any) => o.id === id);
  
  useEffect(() => {
    if (opportunity) {
      setFormData({
        title: opportunity.title,
        description: opportunity.description,
        date: opportunity.date,
        start_time: opportunity.start_time,
        end_time: opportunity.end_time,
        location: opportunity.location,
        required_volunteers: opportunity.required_volunteers,
        faculty_restriction: opportunity.faculty_restriction || '',
        target_interests: opportunity.target_interests || [],
      });
      
      // Check if opportunity has password protection
      if (opportunity.access_password) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [opportunity]);

  const [attendance, setAttendance] = useState<any[]>([]);
  const [volunteersWithDetails, setVolunteersWithDetails] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      // Fetch attendance for this opportunity
      supabase
        .from('attendance')
        .select('*, volunteer:volunteers(id, user_id, application:volunteer_applications(*))')
        .eq('opportunity_id', id)
        .then(({ data }) => setAttendance(data || []));
    }
  }, [id, registrations]);

  useEffect(() => {
    const fetchVolunteerDetails = async () => {
      if (!registrations) return;
      
      const approvedRegs = registrations.filter((r: any) => r.status === 'approved');
      const details = await Promise.all(
        approvedRegs.map(async (reg: any) => {
          const { data: volunteer } = await supabase
            .from('volunteers')
            .select(`
              *,
              application:volunteer_applications(
                *,
                faculty:faculties(name),
                major:majors(name)
              )
            `)
            .eq('id', reg.volunteer_id)
            .single();
          
          const hasAttendance = attendance.some(a => a.volunteer_id === reg.volunteer_id);
          
          return {
            registration: reg,
            volunteer,
            hasAttendance,
          };
        })
      );
      setVolunteersWithDetails(details);
    };
    
    fetchVolunteerDetails();
  }, [registrations, attendance]);

  const pendingApplications = registrations?.filter((r: any) => r.status === 'pending') || [];
  const waitlistedApplications = registrations?.filter((r: any) => r.status === 'waitlisted' && !r.withdrawn_at) || [];
  const withdrawnApplications = registrations?.filter((r: any) => r.withdrawn_at) || [];
  const approvedVolunteers = registrations?.filter((r: any) => r.status === 'approved') || [];
  const rejectedApplications = registrations?.filter((r: any) => r.status === 'rejected' && !r.withdrawn_at) || [];

  const handleUpdate = async () => {
    if (!id) return;
    await updateOpportunity.mutateAsync({
      id,
      ...formData,
      required_volunteers: Number(formData.required_volunteers),
      faculty_restriction: formData.faculty_restriction || null,
      target_interests: formData.target_interests,
    });
    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteOpportunity.mutateAsync(id);
    navigate('/dashboard/opportunities');
  };

  const handleWithdraw = async () => {
    if (!selectedRegistration) return;
    
    setIsProcessing(true);
    try {
      await supabase
        .from('opportunity_registrations')
        .update({ 
          status: 'waitlisted',
          withdrawn_at: new Date().toISOString(),
          withdrawal_reason: withdrawReason || 'Withdrawn by admin',
        })
        .eq('id', selectedRegistration.id);
      
      // Notify the volunteer
      if (selectedRegistration.volunteer?.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedRegistration.volunteer.user_id,
            title: 'Withdrawal Recorded',
            message: `You have been withdrawn from the opportunity. Reason: ${withdrawReason || 'No reason provided'}`,
            type: 'warning',
          });
      }
      
      toast({ title: 'Success', description: 'Volunteer withdrawn successfully' });
      setWithdrawDialogOpen(false);
      setWithdrawReason('');
      setSelectedRegistration(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCheckIn = async (volunteerId: string, registrationId: string) => {
    if (!id) return;
    await manualCheckIn.mutateAsync({
      opportunityId: id,
      volunteerId,
      registrationId,
    });
  };

  const handleTokenCheckIn = async () => {
    if (!manualToken.trim() || !id) return;
    
    setIsProcessing(true);
    try {
      // Find the registration with matching token or check if it matches opportunity token
      if (opportunity?.qr_code_token !== manualToken.trim()) {
        throw new Error('Invalid token');
      }
      
      toast({ title: 'Success', description: 'Token validated. Please select a volunteer to check in.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setManualToken('');
    }
  };

  const handleIssueCertificates = async () => {
    if (!id || !opportunity) return;
    
    setIsProcessing(true);
    try {
      const attendedVolunteers = attendance.map(a => a.volunteer_id);
      const defaultTemplate = templates?.find((t: any) => t.is_default) || templates?.[0];
      
      // Calculate hours from opportunity
      const startParts = opportunity.start_time.split(':');
      const endParts = opportunity.end_time.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      const hours = (endMinutes - startMinutes) / 60;
      
      for (const volunteerId of attendedVolunteers) {
        // Check if certificate already exists
        const { data: existingCert } = await supabase
          .from('certificates')
          .select('id')
          .eq('volunteer_id', volunteerId)
          .eq('opportunity_id', id)
          .single();
        
        if (!existingCert) {
          await issueCertificate.mutateAsync({
            volunteerId: volunteerId,
            opportunityId: id,
            templateId: defaultTemplate?.id,
            hours: Math.max(hours, 1),
          });
        }
      }
      
      toast({ title: 'Success', description: `Certificates issued for ${attendedVolunteers.length} volunteers` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintVolunteers = async () => {
    if (!opportunity || volunteersWithDetails.length === 0) return;
    
    const volunteers = volunteersWithDetails.map(v => ({
      name: `${v.volunteer?.application?.first_name} ${v.volunteer?.application?.father_name} ${v.volunteer?.application?.family_name}`,
      university_id: v.volunteer?.application?.university_id || '',
      phone: v.volunteer?.application?.phone_number || '',
      email: v.volunteer?.application?.university_email || '',
      faculty: v.volunteer?.application?.faculty?.name || '',
      major: v.volunteer?.application?.major?.name || '',
      academic_year: v.volunteer?.application?.academic_year || '',
      emergency_contact: v.volunteer?.application?.emergency_contact_name || '',
      emergency_phone: v.volunteer?.application?.emergency_contact_phone || '',
    }));
    
    await generateOpportunityVolunteersPDF({
      opportunity: {
        title: opportunity.title,
        date: opportunity.date,
        location: opportunity.location,
      },
      volunteers,
    });
  };

  const handlePrintList = async (type: 'approved' | 'rejected' | 'waitlisted' | 'withdrawn') => {
    if (!opportunity) return;
    
    let filteredRegs = registrations?.filter((r: any) => {
      if (type === 'withdrawn') return r.status === 'rejected' && r.withdrawal_reason;
      return r.status === type;
    }) || [];
    
    // Use the already loaded volunteer data from registrations
    const volunteers = filteredRegs.map((reg: any) => ({
      name: reg.volunteer?.application 
        ? `${reg.volunteer.application.first_name || ''} ${reg.volunteer.application.father_name || ''} ${reg.volunteer.application.family_name || ''}`
        : 'Unknown Volunteer',
      university_id: reg.volunteer?.application?.university_id || 'N/A',
      reason: type === 'withdrawn' ? (reg.withdrawal_reason || 'No reason provided') : undefined,
    }));
    
    await generateOpportunityListPDF({
      opportunity: {
        title: opportunity.title,
        date: opportunity.date,
      },
      listType: type,
      volunteers,
    });
  };

  const handleDownloadAllReports = async () => {
    if (!opportunity) return;
    
    await generateOpportunityReportPDF({
      opportunity: {
        title: opportunity.title,
        description: opportunity.description,
        date: opportunity.date,
        location: opportunity.location,
        start_time: opportunity.start_time,
        end_time: opportunity.end_time,
        status: opportunity.status,
      },
      stats: {
        total_registrations: registrations?.length || 0,
        approved: approvedVolunteers.length,
        rejected: rejectedApplications.length,
        waitlisted: waitlistedApplications.length,
        attended: attendance.length,
      },
    });
  };

  // Password verification handler
  const handleVerifyPassword = () => {
    if (accessPassword === opportunity?.access_password) {
      setIsAuthenticated(true);
      setPasswordDialogOpen(false);
      setAccessPassword('');
      toast({ title: 'Success', description: 'Access granted' });
    } else {
      toast({ title: 'Error', description: 'Incorrect password', variant: 'destructive' });
    }
  };

  // Set password handler (admin only)
  const handleSetPassword = async () => {
    if (!id || !newPassword.trim()) {
      toast({ title: 'Error', description: 'Please enter a password', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('opportunities')
        .update({
          access_password: newPassword,
          access_password_set_by: user?.id,
          access_password_set_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Password set successfully. Only those with the password can access this opportunity.' });
      setShowSetPasswordDialog(false);
      setNewPassword('');
      setIsAuthenticated(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch matching volunteers based on interests
  const handleFindMatchingVolunteers = async () => {
    if (selectedInterests.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one interest', variant: 'destructive' });
      return;
    }
    
    setLoadingRecommendations(true);
    try {
      // Find volunteers whose interests match
      const { data: volunteers, error } = await supabase
        .from('volunteers')
        .select(`
          id,
          user_id,
          application:volunteer_applications(
            first_name,
            father_name,
            family_name,
            university_id,
            interests,
            phone_number,
            university_email
          )
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Filter volunteers with matching interests
      const matching = volunteers?.filter((v: any) => {
        const volunteerInterests = v.application?.interests || [];
        return selectedInterests.some(interest => volunteerInterests.includes(interest));
      }) || [];
      
      // Filter out already registered volunteers
      const registeredIds = registrations?.map((r: any) => r.volunteer_id) || [];
      const available = matching.filter((v: any) => !registeredIds.includes(v.id));
      
      setMatchingVolunteers(available);
      
      if (available.length === 0) {
        toast({ title: 'Info', description: 'No matching volunteers found' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Auto-approve matching volunteers
  const handleAutoApproveVolunteer = async (volunteerId: string) => {
    if (!id || !opportunity) return;
    
    setIsProcessing(true);
    try {
      // Get volunteer details for email
      const { data: volunteerData } = await supabase
        .from('volunteers')
        .select(`
          id,
          application:volunteer_applications(
            first_name,
            father_name,
            family_name,
            university_email
          )
        `)
        .eq('id', volunteerId)
        .single();

      // Register the volunteer with auto-approved status
      const { error } = await supabase
        .from('opportunity_registrations')
        .insert({
          opportunity_id: id,
          volunteer_id: volunteerId,
          status: 'approved',
          auto_approved: true,
          approved_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // Send email notification
      if (volunteerData?.application?.university_email) {
        try {
          await supabase.functions.invoke('send-volunteer-notification', {
            body: {
              to: volunteerData.application.university_email,
              volunteerName: `${volunteerData.application.first_name} ${volunteerData.application.father_name}`,
              opportunityTitle: opportunity.title,
              opportunityDate: format(new Date(opportunity.date), 'MMM dd, yyyy'),
              opportunityTime: `${opportunity.start_time} - ${opportunity.end_time}`,
              opportunityLocation: opportunity.location,
              type: 'auto_approved',
            },
          });
          console.log('Auto-approval email sent successfully');
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the whole operation if email fails
        }
      }
      
      // Remove from matching list
      setMatchingVolunteers(prev => prev.filter(v => v.id !== volunteerId));
      
      toast({ title: 'Success', description: 'Volunteer auto-approved for this opportunity' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Opportunity Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!opportunity) {
    return (
      <DashboardLayout title="Opportunity Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Opportunity not found</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard/opportunities')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Show password prompt if opportunity is protected and not authenticated
  if (opportunity.access_password && !isAuthenticated) {
    return (
      <DashboardLayout title="Opportunity Details">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="p-4 rounded-full bg-muted">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Password Protected</h3>
          <p className="text-muted-foreground text-center max-w-md">
            This opportunity is password protected. Enter the access password to view details.
          </p>
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Input
              type="password"
              placeholder="Enter password..."
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
            />
            <Button onClick={handleVerifyPassword}>
              <Unlock className="h-4 w-4 mr-2" />
              Unlock
            </Button>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard/opportunities')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'published': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout title="Opportunity Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard/opportunities')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-display font-bold">{opportunity.title}</h2>
                <Badge variant={getStatusColor(opportunity.status)}>{opportunity.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(opportunity.date), 'MMM dd, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {opportunity.start_time} - {opportunity.end_time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {opportunity.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {approvedVolunteers.length}/{opportunity.required_volunteers} volunteers
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Password Protection Button */}
            {!opportunity.access_password ? (
              <Button variant="outline" onClick={() => setShowSetPasswordDialog(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Set Password
              </Button>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Protected
              </Badge>
            )}
            
            {/* Recommend Button */}
            <Button variant="outline" onClick={() => setRecommendDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Recommend
            </Button>
            
            {opportunity.status === 'draft' && (
              <Button onClick={() => publishOpportunity.mutate(opportunity.id)}>
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
            {opportunity.status === 'published' && (
              <Button onClick={() => completeOpportunity.mutate(opportunity.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={handleDownloadAllReports}>
              <Download className="h-4 w-4 mr-2" />
              Download Reports
            </Button>
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">{opportunity.description}</p>
          </CardContent>
        </Card>

        {/* Section 1: Applications (Collapsible) */}
        <Collapsible open={applicationsOpen} onOpenChange={setApplicationsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Applications
                    <Badge variant="secondary">{pendingApplications.length} pending</Badge>
                    <Badge variant="outline">{waitlistedApplications.length} waitlisted</Badge>
                  </CardTitle>
                  {applicationsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {pendingApplications.length === 0 && waitlistedApplications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No pending applications</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Volunteer</TableHead>
                          <TableHead>University ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...pendingApplications, ...waitlistedApplications].map((reg: any) => (
                          <TableRow key={reg.id}>
                            <TableCell>
                              {reg.volunteer?.application?.first_name} {reg.volunteer?.application?.father_name} {reg.volunteer?.application?.family_name}
                            </TableCell>
                            <TableCell>{reg.volunteer?.application?.university_id}</TableCell>
                            <TableCell>
                              <Badge variant={reg.status === 'pending' ? 'secondary' : 'outline'}>
                                {reg.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(reg.registered_at), 'MMM dd, yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveRegistration.mutate(reg.id)}
                                  disabled={approveRegistration.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectRegistration.mutate(reg.id)}
                                  disabled={rejectRegistration.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  
                  {/* Print buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => handlePrintList('waitlisted')}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Waitlist
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1">
              <IdCard className="h-3 w-3" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="availability" className="gap-1">
              <ClockIcon className="h-3 w-3" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          {/* Section 2: Volunteers */}
          <TabsContent value="volunteers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Approved Volunteers ({approvedVolunteers.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrintVolunteers}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print All Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrintList('approved')}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Approved List
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrintList('rejected')}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Rejected List
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrintList('withdrawn')}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Withdrawn List
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {volunteersWithDetails.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No approved volunteers yet</p>
                ) : (
                  <div className="space-y-4">
                    {volunteersWithDetails.map((v: any) => (
                      <Card key={v.registration.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                              <div>
                                <p className="text-sm text-muted-foreground">Full Name</p>
                                <p className="font-medium">
                                  {v.volunteer?.application?.first_name} {v.volunteer?.application?.father_name} {v.volunteer?.application?.grandfather_name} {v.volunteer?.application?.family_name}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{v.volunteer?.application?.phone_number}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium text-sm">{v.volunteer?.application?.university_email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">University ID</p>
                                <p className="font-medium">{v.volunteer?.application?.university_id}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Faculty</p>
                                <p className="font-medium">{v.volunteer?.application?.faculty?.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Major</p>
                                <p className="font-medium">{v.volunteer?.application?.major?.name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Academic Year</p>
                                <p className="font-medium">{v.volunteer?.application?.academic_year}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Attendance</p>
                                <Badge variant={v.hasAttendance ? 'default' : 'secondary'}>
                                  {v.hasAttendance ? 'Checked In' : 'Not Checked In'}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-4"
                              onClick={() => {
                                setSelectedRegistration(v.registration);
                                setWithdrawDialogOpen(true);
                              }}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Withdraw
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section 3: Recommendations */}
          <TabsContent value="recommendations" className="space-y-4">
            <OpportunityRecommendations
              opportunityId={id || ''}
              opportunityDate={opportunity.date}
              startTime={opportunity.start_time}
              endTime={opportunity.end_time}
              targetInterests={opportunity.target_interests || []}
              registrations={registrations || []}
              requiredVolunteers={opportunity.required_volunteers}
              onAutoApprove={handleAutoApproveVolunteer}
              isProcessing={isProcessing}
            />
          </TabsContent>

          {/* Section 4: Badges */}
          <TabsContent value="badges" className="space-y-4">
            <BadgeManagement
              opportunityId={id || ''}
              opportunityTitle={opportunity.title}
              opportunityDate={opportunity.date}
              opportunityLocation={opportunity.location}
              registrations={registrations || []}
            />
          </TabsContent>

          {/* Section 5: Availability */}
          <TabsContent value="availability" className="space-y-4">
            <VolunteerAvailabilityLists
              opportunityId={id || ''}
              opportunityDate={opportunity.date}
              startTime={opportunity.start_time}
              endTime={opportunity.end_time}
              targetInterests={opportunity.target_interests || []}
              registrations={registrations || []}
              opportunityTitle={opportunity.title}
              opportunityLocation={opportunity.location}
              onAutoApprove={handleAutoApproveVolunteer}
            />
          </TabsContent>

          {/* Section 6: Attendance */}
          <TabsContent value="attendance" className="space-y-4">
            {attendanceMethod === null ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setAttendanceMethod('qr')}
                >
                  <CardContent className="p-8 text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">QR Code</h3>
                    <p className="text-muted-foreground">Display QR code for volunteers to scan</p>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setAttendanceMethod('manual')}
                >
                  <CardContent className="p-8 text-center">
                    <Keyboard className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">Manual Check-in</h3>
                    <p className="text-muted-foreground">Manually check in volunteers from the list</p>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setAttendanceMethod('token')}
                >
                  <CardContent className="p-8 text-center">
                    <Hash className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">Token Entry</h3>
                    <p className="text-muted-foreground">Enter token code for attendance</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setAttendanceMethod(null)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Methods
                </Button>
                
                {attendanceMethod === 'qr' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        QR Code Attendance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      {!opportunity.qr_code_token ? (
                        <div>
                          <p className="text-muted-foreground mb-4">Generate a QR code for volunteers to scan</p>
                          <Button onClick={() => generateQRCode.mutate(opportunity.id)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Generate QR Code
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-white p-8 rounded-lg inline-block">
                            <QRCodeSVG value={opportunity.qr_code_token} size={256} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Token: <code className="bg-muted px-2 py-1 rounded">{opportunity.qr_code_token}</code>
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant={opportunity.qr_code_active ? 'default' : 'secondary'}>
                              {opportunity.qr_code_active ? 'Active' : 'Closed'}
                            </Badge>
                            {opportunity.qr_code_active ? (
                              <Button variant="destructive" onClick={() => closeQRCode.mutate(opportunity.id)}>
                                Close Check-in
                              </Button>
                            ) : (
                              <Button onClick={() => setReopenDialogOpen(true)}>
                                Reopen Check-in
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {attendanceMethod === 'manual' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Manual Check-in
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Volunteer</TableHead>
                            <TableHead>University ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedVolunteers.map((reg: any) => {
                            const hasAttendance = attendance.some(a => a.volunteer_id === reg.volunteer_id);
                            return (
                              <TableRow key={reg.id}>
                                <TableCell>
                                  {reg.volunteer?.application?.first_name} {reg.volunteer?.application?.family_name}
                                </TableCell>
                                <TableCell>{reg.volunteer?.application?.university_id}</TableCell>
                                <TableCell>
                                  <Badge variant={hasAttendance ? 'default' : 'secondary'}>
                                    {hasAttendance ? 'Checked In' : 'Not Checked In'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {!hasAttendance && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleManualCheckIn(reg.volunteer_id, reg.id)}
                                      disabled={manualCheckIn.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Check In
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
                
                {attendanceMethod === 'token' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Token Entry
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="max-w-md mx-auto space-y-4">
                        <div>
                          <Label>Enter Token</Label>
                          <Input
                            placeholder="Enter the attendance token"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleTokenCheckIn} 
                          disabled={isProcessing || !manualToken.trim()}
                          className="w-full"
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Validate Token
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                          Current opportunity token: <code className="bg-muted px-2 py-1 rounded">{opportunity.qr_code_token || 'Not generated'}</code>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Section 4: Certificates */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Issue Certificates
                  </CardTitle>
                  <Button onClick={handleIssueCertificates} disabled={isProcessing || attendance.length === 0}>
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Award className="h-4 w-4 mr-2" />}
                    Issue Certificates for All Attendees
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-primary">{attendance.length}</p>
                        <p className="text-sm text-muted-foreground">Volunteers Attended</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-primary">
                          {(() => {
                            const startParts = opportunity.start_time.split(':');
                            const endParts = opportunity.end_time.split(':');
                            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                            const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                            return Math.max(1, Math.round((endMinutes - startMinutes) / 60));
                          })()}
                        </p>
                        <p className="text-sm text-muted-foreground">Hours per Certificate</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-primary">{templates?.length || 0}</p>
                        <p className="text-sm text-muted-foreground">Templates Available</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {attendance.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No volunteers have checked in yet. Certificates can only be issued to attendees.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Opportunity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Required Volunteers</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.required_volunteers}
                    onChange={(e) => setFormData({ ...formData, required_volunteers: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Faculty Restriction</Label>
                  <Select
                    value={formData.faculty_restriction || "none"}
                    onValueChange={(value) => setFormData({ ...formData, faculty_restriction: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No restriction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No restriction</SelectItem>
                      {faculties?.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Target Interests (for recommendations)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {INTERESTS.map((interest) => (
                      <label
                        key={interest}
                        className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer transition-all ${
                          formData.target_interests.includes(interest)
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Checkbox
                          checked={formData.target_interests.includes(interest)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, target_interests: [...formData.target_interests, interest] });
                            } else {
                              setFormData({ ...formData, target_interests: formData.target_interests.filter(i => i !== interest) });
                            }
                          }}
                        />
                        <span>{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={updateOpportunity.isPending}>
                  {updateOpportunity.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this opportunity? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Volunteer</DialogTitle>
              <DialogDescription>
                Remove this volunteer from the opportunity. You can optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Enter withdrawal reason..."
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleWithdraw} disabled={isProcessing} variant="destructive">
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Withdraw
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reopen QR Dialog */}
        <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reopen Check-in</DialogTitle>
              <DialogDescription>
                Please provide a reason for reopening the check-in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason</Label>
                <Textarea
                  placeholder="Enter reason for reopening..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReopenDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => {
                    reopenQRCode.mutate({ id: opportunity.id, reason: reopenReason });
                    setReopenDialogOpen(false);
                    setReopenReason('');
                  }} 
                  disabled={!reopenReason.trim()}
                >
                  Reopen
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Verify Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password Required
              </DialogTitle>
              <DialogDescription>
                This opportunity is password protected. Please enter the access password to view details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Access Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password..."
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => navigate('/dashboard/opportunities')}>Cancel</Button>
                <Button onClick={handleVerifyPassword}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Set Password Dialog */}
        <Dialog open={showSetPasswordDialog} onOpenChange={setShowSetPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Set Access Password
              </DialogTitle>
              <DialogDescription>
                Set a password to protect this opportunity. Only users with the password can access the details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Enter new password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSetPasswordDialog(false)}>Cancel</Button>
                <Button onClick={handleSetPassword} disabled={isProcessing || !newPassword.trim()}>
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Set Password
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recommend Volunteers Dialog */}
        <Dialog open={recommendDialogOpen} onOpenChange={setRecommendDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Recommend Volunteers
              </DialogTitle>
              <DialogDescription>
                Select interests to find matching volunteers. Matching volunteers will be auto-approved when added.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Interest Selection */}
              <div className="space-y-3">
                <Label>Select Target Interests</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {INTERESTS.map((interest) => (
                    <label
                      key={interest}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                        selectedInterests.includes(interest)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedInterests.includes(interest)}
                        onCheckedChange={() => toggleInterest(interest)}
                      />
                      <span>{interest}</span>
                    </label>
                  ))}
                </div>
                <Button 
                  onClick={handleFindMatchingVolunteers} 
                  disabled={loadingRecommendations || selectedInterests.length === 0}
                  className="w-full"
                >
                  {loadingRecommendations ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Find Matching Volunteers
                </Button>
              </div>

              {/* Matching Volunteers */}
              {matchingVolunteers.length > 0 && (
                <div className="space-y-3">
                  <Label>Matching Volunteers ({matchingVolunteers.length})</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {matchingVolunteers.map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {v.application?.first_name} {v.application?.father_name} {v.application?.family_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {v.application?.university_id} | {v.application?.phone_number}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {v.application?.interests?.slice(0, 3).map((int: string) => (
                              <Badge key={int} variant="outline" className="text-xs">{int}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAutoApproveVolunteer(v.id)}
                          disabled={isProcessing}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add & Approve
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
