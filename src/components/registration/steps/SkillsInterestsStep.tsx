import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RegistrationData } from '../RegistrationWizard';
import { SKILLS, INTERESTS } from '@/types';
import { Sparkles, Heart } from 'lucide-react';

interface SkillsInterestsStepProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
}

export function SkillsInterestsStep({ data, onChange }: SkillsInterestsStepProps) {
  const toggleSkill = (skill: string) => {
    const newSkills = data.skills.includes(skill)
      ? data.skills.filter(s => s !== skill)
      : [...data.skills, skill];
    onChange({ skills: newSkills });
  };

  const toggleInterest = (interest: string) => {
    const newInterests = data.interests.includes(interest)
      ? data.interests.filter(i => i !== interest)
      : [...data.interests, interest];
    onChange({ interests: newInterests });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Skills & Interests</h2>
        <p className="text-muted-foreground mt-2">Help us match you with the right opportunities</p>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Your Skills</Label>
        </div>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SKILLS.map((skill) => (
            <label
              key={skill}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                data.skills.includes(skill)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                checked={data.skills.includes(skill)}
                onCheckedChange={() => toggleSkill(skill)}
              />
              <span className="text-sm">{skill}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-accent" />
          <Label className="text-base font-semibold">Areas of Interest</Label>
        </div>
        <p className="text-sm text-muted-foreground">Select the volunteering areas you're interested in</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {INTERESTS.map((interest) => (
            <label
              key={interest}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                data.interests.includes(interest)
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <Checkbox
                checked={data.interests.includes(interest)}
                onCheckedChange={() => toggleInterest(interest)}
              />
              <span className="text-sm">{interest}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience & Motivation */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="previousExperience">Previous Volunteer Experience</Label>
          <Textarea
            id="previousExperience"
            value={data.previousExperience}
            onChange={(e) => onChange({ previousExperience: e.target.value })}
            placeholder="Describe any previous volunteer work or community service experience..."
            className="min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivation">Why do you want to volunteer with us? *</Label>
          <Textarea
            id="motivation"
            value={data.motivation}
            onChange={(e) => onChange({ motivation: e.target.value })}
            placeholder="Tell us what motivates you to volunteer and what you hope to achieve..."
            className="min-h-[100px] resize-none"
            required
          />
        </div>
      </div>
    </div>
  );
}
