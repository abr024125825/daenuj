import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegistrationData } from '../RegistrationWizard';
import { FACULTIES, ACADEMIC_YEARS } from '@/types';
import { GraduationCap } from 'lucide-react';
import { useMemo } from 'react';

interface AcademicInfoStepProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
}

export function AcademicInfoStep({ data, onChange }: AcademicInfoStepProps) {
  const selectedFaculty = useMemo(() => {
    return FACULTIES.find(f => f.name === data.faculty);
  }, [data.faculty]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Academic Information</h2>
        <p className="text-muted-foreground mt-2">Your university details</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="universityId">University ID *</Label>
        <Input
          id="universityId"
          value={data.universityId}
          onChange={(e) => onChange({ universityId: e.target.value })}
          placeholder="e.g., 2021123456"
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="faculty">Faculty *</Label>
        <Select
          value={data.faculty}
          onValueChange={(value) => onChange({ faculty: value, major: '' })}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select your faculty" />
          </SelectTrigger>
          <SelectContent>
            {FACULTIES.map((faculty) => (
              <SelectItem key={faculty.id} value={faculty.name}>
                {faculty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="major">Major *</Label>
        <Select
          value={data.major}
          onValueChange={(value) => onChange({ major: value })}
          disabled={!data.faculty}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={data.faculty ? "Select your major" : "Select faculty first"} />
          </SelectTrigger>
          <SelectContent>
            {selectedFaculty?.majors.map((major) => (
              <SelectItem key={major} value={major}>
                {major}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="academicYear">Academic Year *</Label>
        <Select
          value={data.academicYear}
          onValueChange={(value) => onChange({ academicYear: value })}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select your academic year" />
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_YEARS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
