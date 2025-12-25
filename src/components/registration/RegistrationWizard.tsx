import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { AcademicInfoStep } from './steps/AcademicInfoStep';
import { SkillsInterestsStep } from './steps/SkillsInterestsStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { ReviewStep } from './steps/ReviewStep';
import { useSubmitApplication } from '@/hooks/useApplications';
import { useFaculties, useMajors } from '@/hooks/useFaculties';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RegistrationData {
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  familyName: string;
  universityEmail: string;
  phoneNumber: string;
  universityId: string;
  facultyId: string;
  majorId: string;
  academicYear: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  skills: string[];
  interests: string[];
  previousExperience: string;
  motivation: string;
  availability: { day: string; timeSlots: string[] }[];
  acceptCodeOfConduct: boolean;
}

const STEPS = [
  { id: 1, title: 'Account', description: 'Create account' },
  { id: 2, title: 'Personal Info', description: 'Basic details' },
  { id: 3, title: 'Academic Info', description: 'University details' },
  { id: 4, title: 'Skills & Interests', description: 'Your expertise' },
  { id: 5, title: 'Availability', description: 'When you can volunteer' },
  { id: 6, title: 'Review & Submit', description: 'Confirm details' },
];

export function RegistrationWizard({ onClose }: { onClose: () => void }) {
  const { isAuthenticated, signup, login, user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(isAuthenticated ? 2 : 1);
  const submitMutation = useSubmitApplication();
  const { data: faculties } = useFaculties();

  // Auth state
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    familyName: '',
    universityEmail: '',
    phoneNumber: '',
    universityId: '',
    facultyId: '',
    majorId: '',
    academicYear: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    skills: [],
    interests: [],
    previousExperience: '',
    motivation: '',
    availability: [],
    acceptCodeOfConduct: false,
  });

  const { data: majors } = useMajors(formData.facultyId);

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleAuth = async () => {
    if (isSignup && password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match' });
      return;
    }
    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters' });
      return;
    }

    setIsAuthLoading(true);
    
    if (isSignup) {
      const result = await signup(email, password);
      if (result.success) {
        toast({ title: 'Account Created!', description: 'Please continue with your application.' });
        setCurrentStep(2);
        // Pre-fill the university email
        updateFormData({ universityEmail: email });
      } else {
        toast({ variant: 'destructive', title: 'Signup Failed', description: result.error });
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        toast({ title: 'Welcome Back!', description: 'Continue with your application.' });
        setCurrentStep(2);
      } else {
        toast({ variant: 'destructive', title: 'Login Failed', description: result.error });
      }
    }
    setIsAuthLoading(false);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > (isAuthenticated ? 2 : 1)) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    await submitMutation.mutateAsync({
      first_name: formData.firstName,
      father_name: formData.fatherName,
      grandfather_name: formData.grandfatherName,
      family_name: formData.familyName,
      university_email: formData.universityEmail,
      phone_number: formData.phoneNumber,
      university_id: formData.universityId,
      faculty_id: formData.facultyId,
      major_id: formData.majorId,
      academic_year: formData.academicYear,
      emergency_contact_name: formData.emergencyContactName,
      emergency_contact_phone: formData.emergencyContactPhone,
      skills: formData.skills,
      interests: formData.interests,
      previous_experience: formData.previousExperience || null,
      motivation: formData.motivation,
      availability: formData.availability,
    });
    onClose();
  };

  const renderAuthStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-foreground">
          {isSignup ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {isSignup 
            ? 'Create an account to submit your volunteer application' 
            : 'Sign in to continue your application'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@ju.edu.jo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}

        <Button 
          type="button" 
          className="w-full" 
          onClick={handleAuth}
          disabled={isAuthLoading || !email || !password}
        >
          {isAuthLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isSignup ? (
            <UserPlus className="h-4 w-4 mr-2" />
          ) : (
            <LogIn className="h-4 w-4 mr-2" />
          )}
          {isSignup ? 'Create Account & Continue' : 'Sign In & Continue'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderAuthStep();
      case 2:
        return <PersonalInfoStep data={formData} onChange={updateFormData} />;
      case 3:
        return (
          <AcademicInfoStep 
            data={formData} 
            onChange={updateFormData} 
            faculties={faculties || []}
            majors={majors || []}
          />
        );
      case 4:
        return <SkillsInterestsStep data={formData} onChange={updateFormData} />;
      case 5:
        return <AvailabilityStep data={formData} onChange={updateFormData} />;
      case 6:
        return (
          <ReviewStep 
            data={formData} 
            onChange={updateFormData}
            faculties={faculties || []}
            majors={majors || []}
          />
        );
      default:
        return null;
    }
  };

  // Determine which steps to show based on auth state
  const visibleSteps = isAuthenticated ? STEPS.slice(1) : STEPS;
  const displayStep = isAuthenticated ? currentStep - 1 : currentStep;

  return (
    <div className="flex flex-col h-full">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {visibleSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    displayStep > index + 1
                      ? 'bg-primary text-primary-foreground'
                      : displayStep === index + 1
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {displayStep > index + 1 ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="hidden md:block mt-2 text-center">
                  <p className={`text-sm font-medium ${displayStep >= index + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < visibleSteps.length - 1 && (
                <div
                  className={`w-8 lg:w-16 h-1 mx-1 rounded transition-colors ${
                    displayStep > index + 1 ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto animate-fade-in">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-border bg-card">
        <div className="flex justify-between max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || (isAuthenticated && currentStep === 2)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep === 1 ? (
            <div /> // Empty div to maintain layout when auth step is shown
          ) : currentStep === STEPS.length ? (
            <Button
              variant="hero"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !formData.acceptCodeOfConduct}
              className="gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          ) : (
            <Button variant="hero" onClick={handleNext} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
