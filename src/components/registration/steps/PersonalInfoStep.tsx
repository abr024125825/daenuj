import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegistrationData } from '../RegistrationWizard';
import { User, Phone, Mail, AlertCircle } from 'lucide-react';

interface PersonalInfoStepProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
}

export function PersonalInfoStep({ data, onChange }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Personal Information</h2>
        <p className="text-muted-foreground mt-2">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Mohammed"
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fatherName">Father's Name *</Label>
          <Input
            id="fatherName"
            value={data.fatherName}
            onChange={(e) => onChange({ fatherName: e.target.value })}
            placeholder="Ahmad"
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grandfatherName">Grandfather's Name *</Label>
          <Input
            id="grandfatherName"
            value={data.grandfatherName}
            onChange={(e) => onChange({ grandfatherName: e.target.value })}
            placeholder="Khalid"
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="familyName">Family Name *</Label>
          <Input
            id="familyName"
            value={data.familyName}
            onChange={(e) => onChange({ familyName: e.target.value })}
            placeholder="Al-Hashemi"
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="universityEmail">University Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="universityEmail"
            type="email"
            value={data.universityEmail}
            onChange={(e) => onChange({ universityEmail: e.target.value })}
            placeholder="your.name@ju.edu.jo"
            className="h-11 pl-10"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">This will be your username for login</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="phoneNumber"
            type="tel"
            value={data.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value })}
            placeholder="07X XXX XXXX"
            className="h-11 pl-10"
            required
          />
        </div>
      </div>

      <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">Emergency Contact</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a contact person in case of emergency during volunteer activities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name *</Label>
                <Input
                  id="emergencyContactName"
                  value={data.emergencyContactName}
                  onChange={(e) => onChange({ emergencyContactName: e.target.value })}
                  placeholder="Full Name"
                  className="h-11 bg-background"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={data.emergencyContactPhone}
                  onChange={(e) => onChange({ emergencyContactPhone: e.target.value })}
                  placeholder="07X XXX XXXX"
                  className="h-11 bg-background"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
