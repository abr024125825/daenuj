import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Users, Shield, Settings, Search, Loader2, Calendar, Key, Mail, GraduationCap, Target, Building2, Brain, Lock } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SemesterManagement } from '@/components/admin/SemesterManagement';
import { SystemConfigurationPanel } from '@/components/admin/SystemConfigurationPanel';
import { PasswordManagementPanel } from '@/components/admin/PasswordManagementPanel';
import { FacultyManagement } from '@/components/admin/FacultyManagement';
import { FacultyCoordinatorCreator } from '@/components/admin/FacultyCoordinatorCreator';
import { VolunteerHoursTargetSettings } from '@/components/admin/VolunteerHoursTargetSettings';
import { usePasswordManagement } from '@/hooks/usePasswordManagement';

export function SettingsPage() {
  const { users, isLoading, updateUserRole, toggleUserActive } = useUsers();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { resetUserPassword, isUpdating: isResettingPassword } = usePasswordManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [seederDialogOpen, setSeederDialogOpen] = useState(false);
  const [seederEmail, setSeederEmail] = useState('');
  const [seederPassword, setSeederPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  
  // Password reset state
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);

  // Psychologist creation state
  const [psychEmail, setPsychEmail] = useState('');
  const [psychPassword, setPsychPassword] = useState('');
  const [psychFirstName, setPsychFirstName] = useState('');
  const [psychLastName, setPsychLastName] = useState('');
  const [isCreatingPsych, setIsCreatingPsych] = useState(false);

  // Psych access password state
  const [psychAccessPassword, setPsychAccessPassword] = useState('');
  const [isSavingPsychPassword, setIsSavingPsychPassword] = useState(false);

  const filteredUsers = users?.filter(
    (u: any) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAdmin = async () => {
    if (!seederEmail || !seederPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-coordinator', {
        body: {
          email: seederEmail,
          password: seederPassword,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Success', description: 'Admin user created successfully' });
      setSeederDialogOpen(false);
      setSeederEmail('');
      setSeederPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUserForReset) return;
    
    const result = await resetUserPassword(selectedUserForReset.email);
    if (result) {
      setPasswordResetDialogOpen(false);
      setSelectedUserForReset(null);
    }
  };

  const openPasswordReset = (user: any) => {
    setSelectedUserForReset(user);
    setPasswordResetDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supervisor': return 'default';
      case 'psychologist': return 'default';
      default: return 'secondary';
    }
  };

  const handleCreatePsychologist = async () => {
    if (!psychEmail || !psychPassword || !psychFirstName || !psychLastName) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setIsCreatingPsych(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-coordinator', {
        body: {
          email: psychEmail,
          password: psychPassword,
          first_name: psychFirstName,
          last_name: psychLastName,
          role: 'psychologist',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Success', description: 'Psychologist account created' });
      setPsychEmail('');
      setPsychPassword('');
      setPsychFirstName('');
      setPsychLastName('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingPsych(false);
    }
  };

  const handleSavePsychAccessPassword = async () => {
    if (!psychAccessPassword.trim()) return;
    setIsSavingPsychPassword(true);
    try {
      const { error } = await supabase.from('system_settings').upsert({
        setting_key: 'psych_access_password',
        setting_value: { password: psychAccessPassword } as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });
      if (error) throw error;
      toast({ title: 'Saved', description: 'Clinical access password updated' });
      setPsychAccessPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSavingPsychPassword(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">System Settings</h2>
            <p className="text-muted-foreground">Manage users, roles, and system configuration</p>
          </div>
          <Button onClick={() => setSeederDialogOpen(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Create Admin User
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-flex">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="coordinators" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Coordinators</span>
            </TabsTrigger>
            <TabsTrigger value="faculties" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Faculties</span>
            </TabsTrigger>
            <TabsTrigger value="semesters" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Semesters</span>
            </TabsTrigger>
            <TabsTrigger value="targets" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Targets</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="psychologists" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Psych</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>Manage user roles, access, and send password reset emails</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((u: any) => {
                        const userRole = u.role || 'volunteer';
                        const isCurrentUser = u.user_id === currentUser?.id;

                        return (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">
                                    {u.first_name?.[0]}{u.last_name?.[0]}
                                  </span>
                                </div>
                                <span className="font-medium">
                                  {u.first_name} {u.last_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(userRole)}>
                                {userRole}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.is_active ? 'outline' : 'secondary'}>
                                {u.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(u.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={userRole}
                                  onValueChange={(value) => 
                                    updateUserRole.mutate({ 
                                      userId: u.user_id, 
                                      role: value as any 
                                    })
                                  }
                                  disabled={isCurrentUser}
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="volunteer">Volunteer</SelectItem>
                                    <SelectItem value="supervisor">Supervisor</SelectItem>
                                    <SelectItem value="disability_coordinator">Disability Coord.</SelectItem>
                                    <SelectItem value="psychologist">Psychologist</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Switch
                                  checked={u.is_active}
                                  onCheckedChange={(checked) =>
                                    toggleUserActive.mutate({ userId: u.user_id, isActive: checked })
                                  }
                                  disabled={isCurrentUser}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openPasswordReset(u)}
                                  disabled={isCurrentUser}
                                  title="Send Password Reset Email"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coordinators" className="space-y-4">
            <FacultyCoordinatorCreator />
          </TabsContent>

          <TabsContent value="faculties" className="space-y-4">
            <FacultyManagement />
          </TabsContent>

          <TabsContent value="semesters" className="space-y-4">
            <SemesterManagement />
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <VolunteerHoursTargetSettings />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <SystemConfigurationPanel />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <PasswordManagementPanel />
          </TabsContent>

          <TabsContent value="psychologists" className="space-y-4">
            {/* Create Psychologist Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Create Psychologist Account
                </CardTitle>
                <CardDescription>
                  Create a new psychologist user with access to the clinical support module
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={psychFirstName} onChange={(e) => setPsychFirstName(e.target.value)} placeholder="First name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={psychLastName} onChange={(e) => setPsychLastName(e.target.value)} placeholder="Last name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={psychEmail} onChange={(e) => setPsychEmail(e.target.value)} placeholder="psychologist@university.edu" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={psychPassword} onChange={(e) => setPsychPassword(e.target.value)} placeholder="Secure password" />
                  </div>
                </div>
                <Button onClick={handleCreatePsychologist} disabled={isCreatingPsych}>
                  {isCreatingPsych && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Psychologist Account
                </Button>
              </CardContent>
            </Card>

            {/* Clinical Access Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Clinical Access Password
                </CardTitle>
                <CardDescription>
                  Set or change the password required to access clinical data. Psychologists must enter this password each session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>New Clinical Access Password</Label>
                  <Input
                    type="password"
                    value={psychAccessPassword}
                    onChange={(e) => setPsychAccessPassword(e.target.value)}
                    placeholder="Enter new access password"
                  />
                </div>
                <Button onClick={handleSavePsychAccessPassword} disabled={isSavingPsychPassword || !psychAccessPassword.trim()}>
                  {isSavingPsychPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Access Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Admin Seeder Dialog */}
        <Dialog open={seederDialogOpen} onOpenChange={setSeederDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin user with full system access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={seederEmail}
                  onChange={(e) => setSeederEmail(e.target.value)}
                  placeholder="admin@university.edu"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={seederPassword}
                  onChange={(e) => setSeederPassword(e.target.value)}
                  placeholder="Secure password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSeederDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAdmin} disabled={isCreatingAdmin}>
                {isCreatingAdmin && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={passwordResetDialogOpen} onOpenChange={setPasswordResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Password Reset Email
              </DialogTitle>
              <DialogDescription>
                A password reset link will be sent to{' '}
                <strong>{selectedUserForReset?.email}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {selectedUserForReset?.first_name?.[0]}{selectedUserForReset?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedUserForReset?.first_name} {selectedUserForReset?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedUserForReset?.email}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                The user will receive an email with a link to reset their password. 
                The link is valid for a limited time.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePasswordReset} disabled={isResettingPassword}>
                {isResettingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Reset Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
