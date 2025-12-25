import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Award, Plus, FileText, Search, Loader2, Download, Pencil, Trash2 } from 'lucide-react';
import { useCertificates, useCertificateTemplates } from '@/hooks/useCertificates';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { generateCertificatePDF } from '@/lib/generateCertificatePDF';

const defaultTemplateHtml = `
<div style="text-align: center; padding: 40px; font-family: 'Georgia', serif;">
  <h1 style="color: #1a365d; font-size: 32px;">Certificate of Appreciation</h1>
  <p style="font-size: 18px; margin-top: 30px;">This is to certify that</p>
  <h2 style="color: #2563eb; font-size: 28px; margin: 20px 0;">{{volunteer_name}}</h2>
  <p style="font-size: 18px;">has successfully completed</p>
  <h3 style="font-size: 24px; margin: 20px 0;">{{opportunity_title}}</h3>
  <p style="font-size: 18px;">contributing <strong>{{hours}} hours</strong> of volunteer service</p>
  <p style="font-size: 14px; margin-top: 40px; color: #666;">
    Certificate Number: {{certificate_number}}<br/>
    Date Issued: {{date}}
  </p>
</div>
`;

export function CertificatesPage() {
  const { certificates, isLoading, issueCertificate } = useCertificates();
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useCertificateTemplates();
  const { opportunities } = useOpportunities();
  const [searchQuery, setSearchQuery] = useState('');
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
  const [deleteTemplateDialogOpen, setDeleteTemplateDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [hours, setHours] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateToEdit, setTemplateToEdit] = useState<any>(null);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    template_html: defaultTemplateHtml,
  });
  const [editTemplate, setEditTemplate] = useState({
    name: '',
    description: '',
    template_html: '',
  });

  // Get volunteers who attended the selected opportunity
  const { data: attendees } = useQuery({
    queryKey: ['opportunity-attendees', selectedOpportunity],
    queryFn: async () => {
      if (!selectedOpportunity) return [];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          volunteer:volunteers(
            id,
            application:volunteer_applications(first_name, father_name, family_name, university_id)
          )
        `)
        .eq('opportunity_id', selectedOpportunity);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOpportunity,
  });

  const handleIssueCertificate = async () => {
    if (!selectedVolunteer || !selectedOpportunity || !hours) return;
    
    await issueCertificate.mutateAsync({
      volunteerId: selectedVolunteer,
      opportunityId: selectedOpportunity,
      hours: parseFloat(hours),
      templateId: selectedTemplate || undefined,
    });
    
    setIssueDialogOpen(false);
    setSelectedOpportunity('');
    setSelectedVolunteer('');
    setHours('');
  };

  const handleCreateTemplate = async () => {
    await createTemplate.mutateAsync(newTemplate);
    setTemplateDialogOpen(false);
    setNewTemplate({ name: '', description: '', template_html: defaultTemplateHtml });
  };

  const handleEditTemplate = async () => {
    if (!templateToEdit) return;
    await updateTemplate.mutateAsync({
      id: templateToEdit.id,
      ...editTemplate,
    });
    setEditTemplateDialogOpen(false);
    setTemplateToEdit(null);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    await deleteTemplate.mutateAsync(templateToDelete.id);
    setDeleteTemplateDialogOpen(false);
    setTemplateToDelete(null);
  };

  const openEditDialog = (template: any) => {
    setTemplateToEdit(template);
    setEditTemplate({
      name: template.name,
      description: template.description || '',
      template_html: template.template_html,
    });
    setEditTemplateDialogOpen(true);
  };

  const openDeleteDialog = (template: any) => {
    setTemplateToDelete(template);
    setDeleteTemplateDialogOpen(true);
  };

  const completedOpportunities = opportunities?.filter(
    (opp: any) => opp.status === 'completed' || opp.status === 'published'
  );

  const filteredCertificates = certificates?.filter((cert: any) => {
    const volunteerName = `${cert.volunteer?.application?.first_name} ${cert.volunteer?.application?.family_name}`;
    return volunteerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           cert.certificate_number.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Certificates">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Certificates">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Certificates</h2>
            <p className="text-muted-foreground">Issue and manage volunteer certificates</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              New Template
            </Button>
            <Button onClick={() => setIssueDialogOpen(true)}>
              <Award className="h-4 w-4 mr-2" />
              Issue Certificate
            </Button>
          </div>
        </div>

        <Tabs defaultValue="certificates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="certificates">Issued Certificates</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Certificates</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search certificates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate #</TableHead>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Opportunity</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates?.map((cert: any) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-sm">
                          {cert.certificate_number}
                        </TableCell>
                        <TableCell>
                          {cert.volunteer?.application?.first_name} {cert.volunteer?.application?.family_name}
                        </TableCell>
                        <TableCell>{cert.opportunity?.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{cert.hours} hrs</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cert.issued_at ? format(new Date(cert.issued_at), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              const volunteerName = cert.volunteer?.application 
                                ? `${cert.volunteer.application.first_name} ${cert.volunteer.application.father_name || ''} ${cert.volunteer.application.family_name}`
                                : 'Volunteer';
                              await generateCertificatePDF({
                                volunteerName,
                                opportunityTitle: cert.opportunity?.title || 'Volunteering Activity',
                                hours: cert.hours,
                                certificateNumber: cert.certificate_number,
                                issuedAt: cert.issued_at ? format(new Date(cert.issued_at), 'MMMM dd, yyyy') : 'N/A',
                                opportunityDate: cert.opportunity?.date ? format(new Date(cert.opportunity.date), 'MMMM dd, yyyy') : 'N/A',
                                location: cert.opportunity?.location || '',
                              });
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredCertificates || filteredCertificates.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No certificates issued yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates?.map((template: any) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      {template.is_default && (
                        <Badge>Default</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-muted rounded-lg flex items-center justify-center mb-4">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(template)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!templates || templates.length === 0) && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No templates created yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Issue Certificate Dialog */}
        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Opportunity</Label>
                <Select value={selectedOpportunity} onValueChange={setSelectedOpportunity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select opportunity" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedOpportunities?.map((opp: any) => (
                      <SelectItem key={opp.id} value={opp.id}>
                        {opp.title} - {opp.date ? format(new Date(opp.date), 'MMM dd, yyyy') : 'No date'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOpportunity && (
                <div className="grid gap-2">
                  <Label>Volunteer</Label>
                  <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select volunteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {attendees?.map((att: any) => (
                        <SelectItem key={att.volunteer.id} value={att.volunteer.id}>
                          {att.volunteer.application.first_name} {att.volunteer.application.family_name} ({att.volunteer.application.university_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Number of volunteer hours"
                />
              </div>

              <div className="grid gap-2">
                <Label>Template (Optional)</Label>
                <Select value={selectedTemplate || "default"} onValueChange={(v) => setSelectedTemplate(v === "default" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Use default template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Template</SelectItem>
                    {templates?.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleIssueCertificate}
                disabled={!selectedVolunteer || !selectedOpportunity || !hours || issueCertificate.isPending}
              >
                {issueCertificate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Issue Certificate
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Template Dialog */}
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Certificate Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Template Name</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Standard Certificate"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Certificate template description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Template HTML</Label>
                <Textarea
                  value={newTemplate.template_html}
                  onChange={(e) => setNewTemplate({ ...newTemplate, template_html: e.target.value })}
                  placeholder="HTML template with placeholders"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use placeholders: {'{{volunteer_name}}'}, {'{{opportunity_title}}'}, {'{{hours}}'}, {'{{date}}'}, {'{{certificate_number}}'}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name || createTemplate.isPending}
              >
                {createTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Template Dialog */}
        <Dialog open={editTemplateDialogOpen} onOpenChange={setEditTemplateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Certificate Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Template Name</Label>
                <Input
                  value={editTemplate.name}
                  onChange={(e) => setEditTemplate({ ...editTemplate, name: e.target.value })}
                  placeholder="Standard Certificate"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={editTemplate.description}
                  onChange={(e) => setEditTemplate({ ...editTemplate, description: e.target.value })}
                  placeholder="Certificate template description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Template HTML</Label>
                <Textarea
                  value={editTemplate.template_html}
                  onChange={(e) => setEditTemplate({ ...editTemplate, template_html: e.target.value })}
                  placeholder="HTML template with placeholders"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use placeholders: {'{{volunteer_name}}'}, {'{{opportunity_title}}'}, {'{{hours}}'}, {'{{date}}'}, {'{{certificate_number}}'}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleEditTemplate}
                disabled={!editTemplate.name || updateTemplate.isPending}
              >
                {updateTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Template Dialog */}
        <AlertDialog open={deleteTemplateDialogOpen} onOpenChange={setDeleteTemplateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTemplate}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
