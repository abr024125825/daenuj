import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { UserPlus, Building2, Loader2, Shield, Mail } from 'lucide-react';
import { useFaculties } from '@/hooks/useFaculties';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export function FacultyCoordinatorCreator() {
  const { data: faculties } = useFaculties();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    facultyId: '',
  });

  // Fetch existing faculty coordinators
  const { data: coordinators, isLoading } = useQuery({
    queryKey: ['faculty-coordinators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          faculty:faculties(name)
        `)
        .eq('role', 'supervisor')
        .not('faculty_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleCreateCoordinator = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.facultyId) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait for profile trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 2. Update role to supervisor in user_roles
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'supervisor' })
          .eq('user_id', authData.user.id);

        if (roleError) {
          // If update fails, try insert
          const { error: insertRoleError } = await supabase
            .from('user_roles')
            .insert({ user_id: authData.user.id, role: 'supervisor' });
          if (insertRoleError) throw insertRoleError;
        }

        // 3. Update profile with role and faculty_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'supervisor',
            faculty_id: formData.facultyId,
            first_name: formData.firstName,
            last_name: formData.lastName,
          })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;

        toast({ 
          title: 'Success', 
          description: `Faculty coordinator created successfully for ${faculties?.find(f => f.id === formData.facultyId)?.name}` 
        });
        
        queryClient.invalidateQueries({ queryKey: ['faculty-coordinators'] });
        queryClient.invalidateQueries({ queryKey: ['all-users'] });
        
        setDialogOpen(false);
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          facultyId: '',
        });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const getFacultyName = (facultyId: string | null) => {
    if (!facultyId) return 'Not Assigned';
    return faculties?.find(f => f.id === facultyId)?.name || 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Faculty Coordinators
            </CardTitle>
            <CardDescription>
              Create and manage coordinator accounts for each faculty
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Coordinator
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : coordinators?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No faculty coordinators created yet</p>
            <p className="text-sm mt-1">Create a coordinator account for each faculty</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordinators?.map((coordinator: any) => (
                <TableRow key={coordinator.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {coordinator.first_name?.[0]}{coordinator.last_name?.[0]}
                        </span>
                      </div>
                      <span className="font-medium">
                        {coordinator.first_name} {coordinator.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {coordinator.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {coordinator.faculty?.name || 'Not Assigned'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coordinator.is_active ? 'default' : 'secondary'}>
                      {coordinator.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(coordinator.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Create Coordinator Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create Faculty Coordinator
              </DialogTitle>
              <DialogDescription>
                Create a new coordinator account with access to manage a specific faculty
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="coordinator@university.edu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Secure password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty *</Label>
                <Select
                  value={formData.facultyId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, facultyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties?.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This coordinator will have access to manage volunteers, 
                  applications, and reports only within the selected faculty.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCoordinator} 
                disabled={isCreating || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.facultyId}
              >
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Coordinator
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
