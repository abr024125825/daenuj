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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Users, Shield, Settings, Search, Loader2, UserCog, UserPlus } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function SettingsPage() {
  const { users, isLoading, updateUserRole, toggleUserActive } = useUsers();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'supervisor' | 'volunteer'>('volunteer');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const filteredUsers = users?.filter(
    (u: any) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }

    setIsCreatingUser(true);
    try {
      // Create the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            first_name: newUserFirstName,
            last_name: newUserLastName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update the user's role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: newUserRole })
          .eq('user_id', authData.user.id);

        if (roleError) throw roleError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            role: newUserRole,
            first_name: newUserFirstName,
            last_name: newUserLastName,
          })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;

        toast({ 
          title: 'تم بنجاح', 
          description: `تم إنشاء حساب ${newUserRole === 'admin' ? 'المدير' : newUserRole === 'supervisor' ? 'المشرف' : 'المتطوع'} بنجاح` 
        });
        setCreateUserDialogOpen(false);
        resetCreateUserForm();
      }
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const resetCreateUserForm = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserRole('volunteer');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supervisor': return 'default';
      default: return 'secondary';
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
            <h2 className="text-2xl font-display font-bold">إعدادات النظام</h2>
            <p className="text-muted-foreground">إدارة المستخدمين والأدوار وإعدادات النظام</p>
          </div>
          <Button onClick={() => setCreateUserDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            إنشاء مستخدم جديد
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>Manage user roles and access</CardDescription>
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
                      const userRole = u.user_roles?.[0]?.role || u.role || 'volunteer';
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
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="volunteer">Volunteer</SelectItem>
                                  <SelectItem value="supervisor">Supervisor</SelectItem>
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
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-approve volunteer registrations</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically approve opportunity registrations
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications for important events
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
              <DialogDescription>
                إنشاء حساب جديد مع اختيار الدور المناسب
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-user-first-name">الاسم الأول</Label>
                  <Input
                    id="new-user-first-name"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    placeholder="أحمد"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-user-last-name">اسم العائلة</Label>
                  <Input
                    id="new-user-last-name"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    placeholder="المشرف"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-user-email">البريد الإلكتروني</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@university.edu"
                  dir="ltr"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-user-password">كلمة المرور</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="كلمة مرور آمنة"
                  dir="ltr"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-user-role">الدور</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(value) => setNewUserRole(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volunteer">متطوع</SelectItem>
                    <SelectItem value="supervisor">مشرف</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateUser}
                disabled={isCreatingUser}
              >
                {isCreatingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                إنشاء المستخدم
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
