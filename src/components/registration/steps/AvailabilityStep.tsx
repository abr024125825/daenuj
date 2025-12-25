import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RegistrationData } from '../RegistrationWizard';
import { Calendar, Sun, Sunset, Moon } from 'lucide-react';

interface AvailabilityStepProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '8:00 AM - 12:00 PM', icon: Sun },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 PM - 5:00 PM', icon: Sunset },
  { id: 'evening', label: 'Evening', time: '5:00 PM - 9:00 PM', icon: Moon },
];

export function AvailabilityStep({ data, onChange }: AvailabilityStepProps) {
  const toggleTimeSlot = (day: string, slot: string) => {
    const existingDay = data.availability.find(a => a.day === day);
    
    if (existingDay) {
      const hasSlot = existingDay.timeSlots.includes(slot);
      const newTimeSlots = hasSlot
        ? existingDay.timeSlots.filter(s => s !== slot)
        : [...existingDay.timeSlots, slot];
      
      if (newTimeSlots.length === 0) {
        onChange({
          availability: data.availability.filter(a => a.day !== day)
        });
      } else {
        onChange({
          availability: data.availability.map(a =>
            a.day === day ? { ...a, timeSlots: newTimeSlots } : a
          )
        });
      }
    } else {
      onChange({
        availability: [...data.availability, { day, timeSlots: [slot] }]
      });
    }
  };

  const isSlotSelected = (day: string, slot: string) => {
    const dayAvailability = data.availability.find(a => a.day === day);
    return dayAvailability?.timeSlots.includes(slot) || false;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Your Availability</h2>
        <p className="text-muted-foreground mt-2">Select the times when you're available to volunteer</p>
      </div>

      {/* Time Slot Legend */}
      <div className="flex flex-wrap gap-4 justify-center mb-6 p-4 bg-muted/30 rounded-lg">
        {TIME_SLOTS.map((slot) => {
          const Icon = slot.icon;
          return (
            <div key={slot.id} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{slot.label}:</span>
              <span className="text-muted-foreground">{slot.time}</span>
            </div>
          );
        })}
      </div>

      {/* Availability Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-3 font-medium text-muted-foreground">Day</th>
              {TIME_SLOTS.map((slot) => {
                const Icon = slot.icon;
                return (
                  <th key={slot.id} className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-sm">{slot.label}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="border-t border-border">
                <td className="p-3 font-medium">{day}</td>
                {TIME_SLOTS.map((slot) => (
                  <td key={slot.id} className="p-3 text-center">
                    <label className="flex items-center justify-center cursor-pointer">
                      <Checkbox
                        checked={isSlotSelected(day, slot.id)}
                        onCheckedChange={() => toggleTimeSlot(day, slot.id)}
                        className="h-6 w-6"
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <h4 className="font-medium text-foreground mb-2">Your Selected Availability</h4>
        {data.availability.length > 0 ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            {data.availability.map((avail) => (
              <p key={avail.day}>
                <span className="font-medium text-foreground">{avail.day}:</span>{' '}
                {avail.timeSlots.map(s => TIME_SLOTS.find(t => t.id === s)?.label).join(', ')}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No time slots selected yet</p>
        )}
      </div>
    </div>
  );
}
