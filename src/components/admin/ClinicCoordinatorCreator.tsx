import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function ClinicCoordinatorCreator() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!email || !password || !firstName || !lastName) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-coordinator', {
        body: { email, password, first_name: firstName, last_name: lastName, role: 'clinic_coordinator' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Success', description: 'Clinic Coordinator account created' });
      setEmail(''); setPassword(''); setFirstName(''); setLastName('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Create Clinic Coordinator Account
        </CardTitle>
        <CardDescription>
          Create a coordinator who can register patients, book appointments, and assign patients to providers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="clinic@university.edu" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Secure password" />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Clinic Coordinator
        </Button>
      </CardContent>
    </Card>
  );
}
