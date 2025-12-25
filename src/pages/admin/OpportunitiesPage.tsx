import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Calendar, MapPin, Users, QrCode, Eye, Send, Loader2 } from 'lucide-react';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useFaculties } from '@/hooks/useFaculties';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

export function OpportunitiesPage() {
  const { opportunities, isLoading, createOpportunity, publishOpportunity, generateQRCode, closeQRCode } = useOpportunities();
  const { data: faculties } = useFaculties();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
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

  const handleCreate = async () => {
    await createOpportunity.mutateAsync({
      ...formData,
      required_volunteers: Number(formData.required_volunteers),
      faculty_restriction: formData.faculty_restriction || null,
    });
    setCreateDialogOpen(false);
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

  const handleShowQR = (opp: any) => {
    setSelectedOpportunity(opp);
    setQrDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'published': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

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
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Opportunity</DialogTitle>
              </DialogHeader>
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
                    value={formData.faculty_restriction}
                    onValueChange={(value) => setFormData({ ...formData, faculty_restriction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Open to all faculties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Open to all faculties</SelectItem>
                      {faculties?.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createOpportunity.isPending}>
                  {createOpportunity.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                {opportunities?.map((opp: any) => (
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
                        {format(new Date(opp.date), 'MMM dd, yyyy')}
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
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {opp.registrations?.[0]?.count || 0}/{opp.required_volunteers}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(opp.status)}>{opp.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {opp.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => publishOpportunity.mutate(opp.id)}
                            disabled={publishOpportunity.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Publish
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
                                <QrCode className="h-4 w-4 mr-1" />
                                Generate QR
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShowQR(opp)}
                              >
                                <QrCode className="h-4 w-4 mr-1" />
                                Show QR
                              </Button>
                            )}
                          </>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!opportunities || opportunities.length === 0) && (
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

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attendance QR Code</DialogTitle>
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
                {selectedOpportunity.qr_code_active && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      closeQRCode.mutate(selectedOpportunity.id);
                      setQrDialogOpen(false);
                    }}
                  >
                    Close Check-in
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
