import jsPDF from 'jspdf';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

interface AssignmentData {
  id: string;
  assigned_role: string;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  notes: string | null;
  exam?: {
    course_name: string;
    course_code: string | null;
    exam_date: string;
    start_time: string;
    end_time: string;
    location: string | null;
    student?: {
      student_name: string;
      university_id: string;
      disability_type: string | null;
    };
  };
}

interface VolunteerInfo {
  id: string;
  volunteer_type: 'general' | 'employment';
  full_name: string;
  university_id?: string;
  faculty?: string;
  total_hours: number;
}

const ROLE_LABELS: Record<string, string> = {
  reader: 'Reader',
  extra_time: 'Extra Time Supervisor',
  companion: 'Companion',
  scribe: 'Scribe',
  separate_room: 'Separate Room Supervisor',
  assistive_technology: 'Assistive Technology Support',
  other: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function calculateDurationHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

export function generateVolunteerAssignmentReport(
  volunteer: VolunteerInfo,
  assignments: AssignmentData[],
  dateRange?: { start: Date; end: Date }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFillColor(41, 65, 148);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Volunteer Activity Report', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, pageWidth / 2, 28, { align: 'center' });
  
  // Volunteer Info Section
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 42, pageWidth - 28, 32, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Volunteer Information', 20, 52);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${volunteer.full_name}`, 20, 62);
  doc.text(`Type: ${volunteer.volunteer_type === 'employment' ? 'Employment Program' : 'General Volunteer'}`, 20, 69);
  
  if (volunteer.university_id) {
    doc.text(`University ID: ${volunteer.university_id}`, 110, 62);
  }
  if (volunteer.faculty) {
    doc.text(`Faculty: ${volunteer.faculty}`, 110, 69);
  }
  
  // Filter assignments by date range if provided
  let filteredAssignments = assignments;
  if (dateRange) {
    filteredAssignments = assignments.filter(a => {
      const examDate = a.exam?.exam_date ? new Date(a.exam.exam_date) : null;
      return examDate && examDate >= dateRange.start && examDate <= dateRange.end;
    });
  }
  
  // Calculate statistics
  const completedAssignments = filteredAssignments.filter(a => a.status === 'completed');
  const totalHours = completedAssignments.reduce((sum, a) => {
    if (a.exam) {
      return sum + calculateDurationHours(a.exam.start_time, a.exam.end_time);
    }
    return sum;
  }, 0);
  
  // Summary Statistics
  doc.setFillColor(230, 240, 255);
  doc.rect(14, 80, pageWidth - 28, 20, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 20, 90);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Assignments: ${filteredAssignments.length}`, 20, 97);
  doc.text(`Completed: ${completedAssignments.length}`, 70, 97);
  doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 120, 97);
  
  // Group by month
  const months = new Map<string, AssignmentData[]>();
  filteredAssignments.forEach(assignment => {
    if (assignment.exam?.exam_date) {
      const monthKey = format(new Date(assignment.exam.exam_date), 'yyyy-MM');
      if (!months.has(monthKey)) {
        months.set(monthKey, []);
      }
      months.get(monthKey)!.push(assignment);
    }
  });
  
  // Sort months
  const sortedMonths = Array.from(months.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  
  let yPos = 110;
  
  // Monthly breakdown
  sortedMonths.forEach(([monthKey, monthAssignments]) => {
    const monthDate = new Date(monthKey + '-01');
    const monthHours = monthAssignments.reduce((sum, a) => {
      if (a.exam) {
        return sum + calculateDurationHours(a.exam.start_time, a.exam.end_time);
      }
      return sum;
    }, 0);
    
    // Check for page break
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    // Month header
    doc.setFillColor(41, 65, 148);
    doc.setTextColor(255, 255, 255);
    doc.rect(14, yPos, pageWidth - 28, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(format(monthDate, 'MMMM yyyy'), 20, yPos + 7);
    doc.text(`${monthAssignments.length} assignments | ${monthHours.toFixed(1)} hours`, pageWidth - 20, yPos + 7, { align: 'right' });
    
    yPos += 15;
    
    // Table header
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 16, yPos);
    doc.text('Time', 38, yPos);
    doc.text('Student', 60, yPos);
    doc.text('Course', 100, yPos);
    doc.text('Role', 145, yPos);
    doc.text('Status', 175, yPos);
    
    yPos += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 4;
    
    // Assignment rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    monthAssignments.forEach(assignment => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      const exam = assignment.exam;
      if (exam) {
        doc.text(format(new Date(exam.exam_date), 'MMM dd'), 16, yPos);
        doc.text(`${exam.start_time}-${exam.end_time}`, 38, yPos);
        
        // Student info (truncated)
        const studentName = exam.student?.student_name || '-';
        const truncatedStudent = studentName.length > 20 ? studentName.substring(0, 18) + '..' : studentName;
        doc.text(truncatedStudent, 60, yPos);
        
        // Course (truncated)
        const truncatedCourse = exam.course_name.length > 22 ? exam.course_name.substring(0, 20) + '..' : exam.course_name;
        doc.text(truncatedCourse, 100, yPos);
        
        doc.text(ROLE_LABELS[assignment.assigned_role] || assignment.assigned_role, 145, yPos);
        doc.text(STATUS_LABELS[assignment.status] || assignment.status, 175, yPos);
        
        yPos += 6;
      }
    });
    
    yPos += 5;
  });
  
  // Footer on last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  // Save
  const fileName = `volunteer_report_${volunteer.full_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
