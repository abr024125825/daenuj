import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Calendar, MapPin, Users, QrCode, Eye, Send, Loader2, 
  Pencil, Trash2, CheckCircle, XCircle, Clock, UserCheck, RotateCcw
} from 'lucide-react';
import { useOpportunities, useOpportunityRegistrations } from '@/hooks/useOpportunities';
import { useFaculties } from '@/hooks/useFaculties';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function OpportunitiesPage() {
  const { 
    opportunities, 
    isLoading, 
    createOpportunity, 
    updateOpportunity,
    deleteOpportunity,
    publishOpportunity, 
    completeOpportunity,
    generateQRCode, 
    closeQRCode,
    reopenQRCode
  } = useOpportunities();
  const { data: faculties } = useFaculties();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [registrationsDialogOpen, setRegistrationsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    required_volunteers: 1,
    faculty_restriction: '',
  });

  // Get registrations for selected opportunity
  const { registrations, approveRegistration, rejectRegistration, manualCheckIn } = useOpportunityRegistrations(selectedOpportunity?.id);

  const handleCreate = async () => {
    if (!formData.title || !formData.description || !formData.date || !formData.start_time || !formData.end_time || !formData.location) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    await createOpportunity.mutateAsync({
      ...formData,
      required_volunteers: Number(formData.required_volunteers),
      faculty_restriction: formData.faculty_restriction || null,
    });
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedOpportunity) return;
    await updateOpportunity.mutateAsync({
      id: selectedOpportunity.id,
      ...formData,
      required_volunteers: Number(formData.required_volunteers),
      faculty_restriction: formData.faculty_restriction || null,
    });
    setEditDialogOpen(false);
    setSelectedOpportunity(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedOpportunity) return;
    await deleteOpportunity.mutateAsync(selectedOpportunity.id);
    setDeleteDialogOpen(false);
    setSelectedOpportunity(null);
  };

  const handleCompleteOpportunity = async (id: string) => {
    await completeOpportunity.mutateAsync(id);
  };

  const handleRejectRegistration = async (registrationId: string) => {
    await rejectRegistration.mutateAsync(registrationId);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      required_volunteers: 1,
      faculty_restriction: '',
    });
  };

  const openEditDialog = (opp: any) => {
    setSelectedOpportunity(opp);
    setFormData({
      title: opp.title,
      description: opp.description,
      date: opp.date,
      start_time: opp.start_time,
      end_time: opp.end_time,
      location: opp.location,
      required_volunteers: opp.required_volunteers,
      faculty_restriction: opp.faculty_restriction || '',
    });
    setEditDialogOpen(true);
  };

  const openDetailsDialog = (opp: any) => {
    setSelectedOpportunity(opp);
    setDetailsDialogOpen(true);
  };

  const openRegistrationsDialog = (opp: any) => {
    setSelectedOpportunity(opp);
    setRegistrationsDialogOpen(true);
  };

  const handleShowQR = (opp: any) => {
    setSelectedOpportunity(opp);
    setQrDialogOpen(true);
  };

  const openDeleteDialog = (opp: any) => {
    setSelectedOpportunity(opp);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'published': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredOpportunities = opportunities?.filter((opp: any) =>
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Opportunities">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Opportunities">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Manage Opportunities</h2>
            <p className="text-muted-foreground">Create and manage volunteering opportunities</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Opportunity
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{opportunities?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {opportunities?.filter((o: any) => o.status === 'draft').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Draft</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {opportunities?.filter((o: any) => o.status === 'published').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {opportunities?.filter((o: any) => o.status === 'completed').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Volunteers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpportunities?.map((opp: any) => (
                  <TableRow key={opp.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{opp.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{opp.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {opp.date ? format(new Date(opp.date), 'MMM dd, yyyy') : 'No date'}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {opp.start_time} - {opp.end_time}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {opp.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="gap-1 text-sm"
                        onClick={() => openRegistrationsDialog(opp)}
                      >
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {opp.registrations?.[0]?.count || 0}/{opp.required_volunteers}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(opp.status)}>{opp.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {opp.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => publishOpportunity.mutate(opp.id)}
                            disabled={publishOpportunity.isPending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {opp.status === 'published' && (
                          <>
                            {!opp.qr_code_token ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateQRCode.mutate(opp.id)}
                                disabled={generateQRCode.isPending}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShowQR(opp)}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteOpportunity(opp.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {opp.status === 'completed' && opp.qr_code_token && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShowQR(opp)}
                            title="View QR Code (Read Only)"
                          >
                            <QrCode className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openDetailsDialog(opp)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(opp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openDeleteDialog(opp)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredOpportunities || filteredOpportunities.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No opportunities yet. Create your first one!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Opportunity</DialogTitle>
            </DialogHeader>
            <OpportunityForm 
              formData={formData} 
              setFormData={setFormData} 
              faculties={faculties}
              onSubmit={handleCreate}
              isSubmitting={createOpportunity.isPending}
              submitLabel="Create"
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Opportunity</DialogTitle>
            </DialogHeader>
            <OpportunityForm 
              formData={formData} 
              setFormData={setFormData} 
              faculties={faculties}
              onSubmit={handleUpdate}
              isSubmitting={updateOpportunity.isPending}
              submitLabel="Save Changes"
            />
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Opportunity Details</DialogTitle>
            </DialogHeader>
            {selectedOpportunity && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusColor(selectedOpportunity.status)}>
                    {selectedOpportunity.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created: {selectedOpportunity.created_at 
                      ? format(new Date(selectedOpportunity.created_at), 'MMM dd, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedOpportunity.title}</h3>
                  <p className="text-muted-foreground mt-2">{selectedOpportunity.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {selectedOpportunity.date 
                          ? format(new Date(selectedOpportunity.date), 'EEEE, MMMM dd, yyyy')
                          : 'No date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{selectedOpportunity.start_time} - {selectedOpportunity.end_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedOpportunity.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Volunteers</p>
                      <p className="font-medium">
                        {selectedOpportunity.registrations?.[0]?.count || 0} / {selectedOpportunity.required_volunteers}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedOpportunity.faculty && (
                  <Badge variant="outline">{selectedOpportunity.faculty.name} only</Badge>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Registrations Dialog */}
        <Dialog open={registrationsDialogOpen} onOpenChange={setRegistrationsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrations - {selectedOpportunity?.title}</DialogTitle>
              <DialogDescription>
                Manage volunteer registrations for this opportunity
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Approved */}
              {registrations?.filter((r: any) => r.status === 'approved').length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Approved ({registrations?.filter((r: any) => r.status === 'approved').length})</p>
                  {registrations?.filter((r: any) => r.status === 'approved').map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-500/5 border-green-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">
                            {reg.volunteer?.application?.first_name?.[0]}{reg.volunteer?.application?.family_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {reg.volunteer?.application?.first_name} {reg.volunteer?.application?.family_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{reg.volunteer?.application?.university_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">approved</Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => manualCheckIn.mutate({
                            opportunityId: selectedOpportunity?.id,
                            volunteerId: reg.volunteer?.id,
                            registrationId: reg.id,
                          })}
                          disabled={manualCheckIn.isPending}
                          title="Manual Check-in"
                        >
                          <UserCheck className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRejectRegistration(reg.id)}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending */}
              {registrations?.filter((r: any) => r.status === 'pending').length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending ({registrations?.filter((r: any) => r.status === 'pending').length})</p>
                  {registrations?.filter((r: any) => r.status === 'pending').map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {reg.volunteer?.application?.first_name?.[0]}{reg.volunteer?.application?.family_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {reg.volunteer?.application?.first_name} {reg.volunteer?.application?.family_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{reg.volunteer?.application?.university_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">pending</Badge>
                        <Button size="sm" variant="outline" onClick={() => approveRegistration.mutate(reg.id)} disabled={approveRegistration.isPending}>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectRegistration(reg.id)}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Waitlisted */}
              {registrations?.filter((r: any) => r.status === 'waitlisted').length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Waiting List ({registrations?.filter((r: any) => r.status === 'waitlisted').length})
                  </p>
                  {registrations?.filter((r: any) => r.status === 'waitlisted').map((reg: any, index: number) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-500/5 border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-yellow-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {reg.volunteer?.application?.first_name} {reg.volunteer?.application?.family_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{reg.volunteer?.application?.university_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500">waitlisted</Badge>
                        <Button size="sm" variant="outline" onClick={() => approveRegistration.mutate(reg.id)} disabled={approveRegistration.isPending}>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRejectRegistration(reg.id)}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejected */}
              {registrations?.filter((r: any) => r.status === 'rejected').length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rejected ({registrations?.filter((r: any) => r.status === 'rejected').length})</p>
                  {registrations?.filter((r: any) => r.status === 'rejected').map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            {reg.volunteer?.application?.first_name?.[0]}{reg.volunteer?.application?.family_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {reg.volunteer?.application?.first_name} {reg.volunteer?.application?.family_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{reg.volunteer?.application?.university_id}</p>
                        </div>
                      </div>
                      <Badge variant="destructive">rejected</Badge>
                    </div>
                  ))}
                </div>
              )}

              {(!registrations || registrations.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No registrations yet</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Opportunity</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedOpportunity?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reopen QR Code Dialog */}
        <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reopen Check-in</DialogTitle>
              <DialogDescription>
                Please provide a reason for reopening the check-in for "{selectedOpportunity?.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reopen-reason">Reason</Label>
                <Textarea
                  id="reopen-reason"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g., Extended event hours, late arrivals, etc."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setReopenDialogOpen(false);
                  setReopenReason('');
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedOpportunity && reopenReason.trim()) {
                      reopenQRCode.mutate({ id: selectedOpportunity.id, reason: reopenReason.trim() });
                      setReopenDialogOpen(false);
                      setReopenReason('');
                      setQrDialogOpen(false);
                    }
                  }}
                  disabled={!reopenReason.trim() || reopenQRCode.isPending}
                >
                  {reopenQRCode.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Reopen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attendance QR Code</DialogTitle>
              <DialogDescription>
                Volunteers can scan this QR code or use the token to check in
              </DialogDescription>
            </DialogHeader>
            {selectedOpportunity && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG
                    value={selectedOpportunity.qr_code_token}
                    size={200}
                    level="H"
                  />
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Volunteers can scan this QR code to check in
                </p>
                <div className="flex items-center gap-2">
                  {selectedOpportunity.qr_code_active ? (
                    <Badge variant="default" className="gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                </div>
                {selectedOpportunity.qr_code_active ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      closeQRCode.mutate(selectedOpportunity.id);
                      setQrDialogOpen(false);
                    }}
                  >
                    Close Check-in
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReopenDialogOpen(true);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reopen Check-in
                  </Button>
                )}
                {selectedOpportunity.qr_reopen_reason && (
                  <div className="w-full p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Last Reopen Reason:</p>
                    <p className="text-sm">{selectedOpportunity.qr_reopen_reason}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function OpportunityForm({ 
  formData, 
  setFormData, 
  faculties, 
  onSubmit, 
  isSubmitting, 
  submitLabel 
}: {
  formData: any;
  setFormData: (data: any) => void;
  faculties: any;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Blood Donation Campaign"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the opportunity..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Main Campus Building A"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="required_volunteers">Required Volunteers</Label>
          <Input
            id="required_volunteers"
            type="number"
            min={1}
            value={formData.required_volunteers}
            onChange={(e) => setFormData({ ...formData, required_volunteers: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="faculty_restriction">Faculty Restriction (Optional)</Label>
        <Select
          value={formData.faculty_restriction || "all"}
          onValueChange={(value) => setFormData({ ...formData, faculty_restriction: value === "all" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Open to all faculties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Open to all faculties</SelectItem>
            {faculties?.map((faculty: any) => (
              <SelectItem key={faculty.id} value={faculty.id}>
                {faculty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
