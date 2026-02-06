import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.webp';

interface VolunteerData {
  volunteer: {
    id: string;
    first_name: string;
    father_name: string;
    grandfather_name: string;
    family_name: string;
    university_email: string;
    phone_number: string;
    university_id: string;
    academic_year: string;
    faculty_name: string;
    major_name: string;
    skills: string[];
    interests: string[];
    motivation: string;
    previous_experience?: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    total_hours: number;
    opportunities_completed: number;
    rating?: number;
    is_active: boolean;
    created_at: string;
  };
  attendance?: Array<{
    opportunity_title: string;
    date: string;
    check_in_time: string;
  }>;
  certificates?: Array<{
    certificate_number: string;
    opportunity_title: string;
    hours: number;
    issued_at: string;
  }>;
  courses?: Array<{
    course_code: string;
    course_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location?: string;
    semester: string;
  }>;
  exams?: Array<{
    course_name: string;
    course_code: string;
    exam_type: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    location?: string;
    semester: string;
  }>;
}

// Professional color palette - Dean of Student Affairs Theme
const colors = {
  primary: [25, 130, 160],
  secondary: [59, 160, 190],
  info: [59, 130, 246],
  danger: [239, 68, 68],
  dark: [30, 41, 59],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
};

async function getLogoBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = logoImage;
  });
}

// Helper function to wrap text within a specified width
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [''];
}

// Helper function to truncate text with ellipsis
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  
  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

export async function generateVolunteerPDF(data: VolunteerData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header with gradient effect
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 45, pageWidth, 3, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 8, 22, 22);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('VOLUNTEER PROFILE', 40, 16);
  
  doc.setFontSize(16);
  const fullName = `${data.volunteer.first_name} ${data.volunteer.father_name} ${data.volunteer.family_name}`;
  doc.text(truncateText(doc, fullName, pageWidth - 60), 40, 26);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`ID: ${data.volunteer.university_id}`, 40, 35);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, 40, { align: 'right' });

  yPos = 55;

  // Personal Information Section
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PERSONAL INFORMATION', margin, yPos);
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 2, margin + 45, yPos + 2);
  yPos += 10;

  doc.setFontSize(9);
  const labelWidth = 40;
  const valueWidth = pageWidth - margin * 2 - labelWidth - 5;

  const personalInfo = [
    ['Full Name:', `${data.volunteer.first_name} ${data.volunteer.father_name} ${data.volunteer.grandfather_name} ${data.volunteer.family_name}`],
    ['University Email:', data.volunteer.university_email],
    ['Phone Number:', data.volunteer.phone_number],
    ['University ID:', data.volunteer.university_id],
    ['Academic Year:', data.volunteer.academic_year],
    ['Faculty:', data.volunteer.faculty_name],
    ['Major:', data.volunteer.major_name],
    ['Status:', data.volunteer.is_active ? 'Active' : 'Inactive'],
    ['Joined:', new Date(data.volunteer.created_at).toLocaleDateString()],
  ];

  personalInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    const truncatedValue = truncateText(doc, value || 'N/A', valueWidth);
    doc.text(truncatedValue, margin + labelWidth, yPos);
    yPos += 5;
  });

  yPos += 8;

  // Statistics Section with styled cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text('VOLUNTEER STATISTICS', margin, yPos);
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.line(margin, yPos + 2, margin + 42, yPos + 2);
  yPos += 10;

  const statsBoxWidth = (pageWidth - margin * 2 - 10) / 3;
  const stats = [
    { label: 'Total Hours', value: data.volunteer.total_hours?.toString() || '0' },
    { label: 'Opportunities', value: data.volunteer.opportunities_completed?.toString() || '0' },
    { label: 'Rating', value: data.volunteer.rating ? `${data.volunteer.rating.toFixed(1)}/5` : 'N/A' },
  ];

  stats.forEach((stat, index) => {
    const x = margin + (statsBoxWidth + 5) * index;
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, statsBoxWidth, 18, 2, 2, 'F');
    
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(x, yPos, statsBoxWidth, 3, 2, 2, 'F');
    doc.rect(x, yPos + 2, statsBoxWidth, 1, 'F');
    
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(stat.value, x + statsBoxWidth / 2, yPos + 10, { align: 'center' });
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFontSize(7);
    doc.text(stat.label, x + statsBoxWidth / 2, yPos + 15, { align: 'center' });
  });

  yPos += 25;

  // Skills & Interests Section
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SKILLS & INTERESTS', margin, yPos);
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.line(margin, yPos + 2, margin + 38, yPos + 2);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  const skillsText = 'Skills: ' + (data.volunteer.skills?.join(', ') || 'None specified');
  const skillLines = wrapText(doc, skillsText, pageWidth - margin * 2);
  skillLines.slice(0, 2).forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });
  
  const interestsText = 'Interests: ' + (data.volunteer.interests?.join(', ') || 'None specified');
  const interestLines = wrapText(doc, interestsText, pageWidth - margin * 2);
  interestLines.slice(0, 2).forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  yPos += 5;

  // Emergency Contact Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EMERGENCY CONTACT', margin, yPos);
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.line(margin, yPos + 2, margin + 40, yPos + 2);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${data.volunteer.emergency_contact_name}`, margin, yPos);
  yPos += 5;
  doc.text(`Phone: ${data.volunteer.emergency_contact_phone}`, margin, yPos);
  yPos += 8;

  // Attendance History Section
  if (data.attendance && data.attendance.length > 0 && yPos < pageHeight - 60) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text('ATTENDANCE HISTORY', margin, yPos);
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.line(margin, yPos + 2, margin + 40, yPos + 2);
    yPos += 6;

    // Table header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(8);
    doc.text('Opportunity', margin + 3, yPos + 5);
    doc.text('Date', pageWidth - margin - 45, yPos + 5);
    doc.text('Check-in', pageWidth - margin - 5, yPos + 5, { align: 'right' });
    yPos += 7;

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    const maxOppWidth = pageWidth - margin * 2 - 60;
    data.attendance.slice(0, 6).forEach((att, index) => {
      if (yPos > pageHeight - 35) return;
      const bg = index % 2 === 0 ? colors.light : colors.white;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 5, 'F');
      doc.setFontSize(7);
      doc.text(truncateText(doc, att.opportunity_title, maxOppWidth), margin + 3, yPos + 3.5);
      doc.text(att.date, pageWidth - margin - 45, yPos + 3.5);
      doc.text(new Date(att.check_in_time).toLocaleTimeString(), pageWidth - margin - 5, yPos + 3.5, { align: 'right' });
      yPos += 5;
    });
    yPos += 4;
  }

  // Certificates Section
  if (data.certificates && data.certificates.length > 0 && yPos < pageHeight - 50) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text('CERTIFICATES ISSUED', margin, yPos);
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.line(margin, yPos + 2, margin + 40, yPos + 2);
    yPos += 6;

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(8);
    doc.text('Certificate #', margin + 3, yPos + 5);
    doc.text('Opportunity', margin + 40, yPos + 5);
    doc.text('Hours', pageWidth - margin - 25, yPos + 5);
    doc.text('Issued', pageWidth - margin - 5, yPos + 5, { align: 'right' });
    yPos += 7;

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    const maxCertOppWidth = pageWidth - margin * 2 - 85;
    data.certificates.slice(0, 4).forEach((cert, index) => {
      if (yPos > pageHeight - 25) return;
      const bg = index % 2 === 0 ? colors.light : colors.white;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 5, 'F');
      doc.setFontSize(7);
      doc.text(cert.certificate_number.substring(0, 15), margin + 3, yPos + 3.5);
      doc.text(truncateText(doc, cert.opportunity_title, maxCertOppWidth), margin + 40, yPos + 3.5);
      doc.text(`${cert.hours} hrs`, pageWidth - margin - 25, yPos + 3.5);
      doc.text(new Date(cert.issued_at).toLocaleDateString(), pageWidth - margin - 5, yPos + 3.5, { align: 'right' });
      yPos += 5;
    });
  }

  // Academic Schedule Section (Courses)
  if (data.courses && data.courses.length > 0) {
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = margin + 10;
    } else {
      yPos += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text('ACADEMIC SCHEDULE - COURSES', margin, yPos);
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.line(margin, yPos + 2, margin + 56, yPos + 2);
    yPos += 6;

    // Display semester info if available
    if (data.courses[0]?.semester) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.text(`Semester: ${data.courses[0].semester}`, margin, yPos);
      yPos += 6;
    }

    // Table header
    doc.setFillColor(colors.info[0], colors.info[1], colors.info[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7.5);
    doc.text('Code', margin + 3, yPos + 5);
    doc.text('Course Name', margin + 20, yPos + 5);
    doc.text('Day', margin + 80, yPos + 5);
    doc.text('Time', margin + 105, yPos + 5);
    doc.text('Location', pageWidth - margin - 5, yPos + 5, { align: 'right' });
    yPos += 7;

    // Sort courses by day
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sortedCourses = [...data.courses].sort((a, b) => 
      dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
    );

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    sortedCourses.forEach((course, index) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin + 10;
        
        // Repeat header on new page
        doc.setFillColor(colors.info[0], colors.info[1], colors.info[2]);
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setFontSize(7.5);
        doc.text('Code', margin + 3, yPos + 5);
        doc.text('Course Name', margin + 20, yPos + 5);
        doc.text('Day', margin + 80, yPos + 5);
        doc.text('Time', margin + 105, yPos + 5);
        doc.text('Location', pageWidth - margin - 5, yPos + 5, { align: 'right' });
        yPos += 7;
        doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      }

      const bg = index % 2 === 0 ? colors.light : colors.white;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
      
      doc.setFontSize(7);
      doc.text(course.course_code, margin + 3, yPos + 4);
      doc.text(truncateText(doc, course.course_name, 55), margin + 20, yPos + 4);
      doc.text(course.day_of_week.substring(0, 3), margin + 80, yPos + 4);
      doc.text(`${course.start_time}-${course.end_time}`, margin + 105, yPos + 4);
      doc.text(truncateText(doc, course.location || 'N/A', 35), pageWidth - margin - 5, yPos + 4, { align: 'right' });
      yPos += 6;
    });
  }

  // Exam Schedule Section
  if (data.exams && data.exams.length > 0) {
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = margin + 10;
    } else {
      yPos += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text('EXAM SCHEDULE', margin, yPos);
    doc.setDrawColor(colors.danger[0], colors.danger[1], colors.danger[2]);
    doc.line(margin, yPos + 2, margin + 30, yPos + 2);
    yPos += 6;

    // Display semester info if available
    if (data.exams[0]?.semester) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.text(`Semester: ${data.exams[0].semester}`, margin, yPos);
      yPos += 6;
    }

    // Table header
    doc.setFillColor(colors.danger[0], colors.danger[1], colors.danger[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7.5);
    doc.text('Course', margin + 3, yPos + 5);
    doc.text('Type', margin + 55, yPos + 5);
    doc.text('Date', margin + 75, yPos + 5);
    doc.text('Time', margin + 100, yPos + 5);
    doc.text('Location', pageWidth - margin - 5, yPos + 5, { align: 'right' });
    yPos += 7;

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    data.exams.forEach((exam, index) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin + 10;
        
        // Repeat header
        doc.setFillColor(colors.danger[0], colors.danger[1], colors.danger[2]);
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setFontSize(7.5);
        doc.text('Course', margin + 3, yPos + 5);
        doc.text('Type', margin + 55, yPos + 5);
        doc.text('Date', margin + 75, yPos + 5);
        doc.text('Time', margin + 100, yPos + 5);
        doc.text('Location', pageWidth - margin - 5, yPos + 5, { align: 'right' });
        yPos += 7;
        doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      }

      const bg = index % 2 === 0 ? colors.light : colors.white;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');
      
      doc.setFontSize(7);
      const courseLabel = `${exam.course_code} - ${exam.course_name}`;
      doc.text(truncateText(doc, courseLabel, 48), margin + 3, yPos + 4);
      doc.text(exam.exam_type, margin + 55, yPos + 4);
      doc.text(new Date(exam.exam_date).toLocaleDateString(), margin + 75, yPos + 4);
      doc.text(`${exam.start_time}-${exam.end_time}`, margin + 100, yPos + 4);
      doc.text(truncateText(doc, exam.location || 'N/A', 30), pageWidth - margin - 5, yPos + 4, { align: 'right' });
      yPos += 6;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Dean of Student Affairs - University of Jordan', pageWidth / 2, pageHeight - 5, { align: 'center' });
    if (totalPages > 1) {
      doc.setFontSize(6);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }

  doc.save(`volunteer-${data.volunteer.university_id}-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateAttendanceReportPDF(data: {
  opportunity: {
    title: string;
    date: string;
    location: string;
    start_time: string;
    end_time: string;
  };
  attendees: Array<{
    name: string;
    university_id: string;
    check_in_time: string;
  }>;
  registered: number;
  attended: number;
}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 42, pageWidth, 3, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 8, 20, 20);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ATTENDANCE REPORT', 38, 14);
  doc.setFontSize(12);
  doc.text(truncateText(doc, data.opportunity.title, pageWidth - 55), 38, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${data.opportunity.date} | ${truncateText(doc, data.opportunity.location, 80)}`, 38, 34);

  yPos = 52;

  // Summary Stats
  const boxWidth = (pageWidth - margin * 2 - 10) / 3;
  const summaryStats = [
    { label: 'Registered', value: data.registered.toString() },
    { label: 'Attended', value: data.attended.toString() },
    { label: 'Attendance Rate', value: `${Math.round((data.attended / Math.max(data.registered, 1)) * 100)}%` },
  ];

  summaryStats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, boxWidth, 20, 2, 2, 'F');
    
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(x, yPos, boxWidth, 3, 2, 2, 'F');
    doc.rect(x, yPos + 2, boxWidth, 1, 'F');
    
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(stat.value, x + boxWidth / 2, yPos + 12, { align: 'center' });
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFontSize(7);
    doc.text(stat.label, x + boxWidth / 2, yPos + 17, { align: 'center' });
  });

  yPos += 28;

  // Attendees Table
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ATTENDEES LIST', margin, yPos);
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 2, margin + 32, yPos + 2);
  yPos += 6;

  // Table Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 2, 2, 'F');
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(8);
  doc.text('#', margin + 5, yPos + 5.5);
  doc.text('Volunteer Name', margin + 15, yPos + 5.5);
  doc.text('University ID', pageWidth / 2 + 5, yPos + 5.5);
  doc.text('Check-in Time', pageWidth - margin - 5, yPos + 5.5, { align: 'right' });
  yPos += 8;

  // Table Rows
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  const maxNameWidth = pageWidth / 2 - 25;
  
  data.attendees.forEach((attendee, index) => {
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = margin;
      
      // Repeat header
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 2, 2, 'F');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(8);
      doc.text('#', margin + 5, yPos + 5.5);
      doc.text('Volunteer Name', margin + 15, yPos + 5.5);
      doc.text('University ID', pageWidth / 2 + 5, yPos + 5.5);
      doc.text('Check-in Time', pageWidth - margin - 5, yPos + 5.5, { align: 'right' });
      yPos += 8;
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    }

    const bg = index % 2 === 0 ? colors.light : colors.white;
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');

    doc.setFontSize(8);
    doc.text((index + 1).toString(), margin + 5, yPos + 4);
    doc.text(truncateText(doc, attendee.name, maxNameWidth), margin + 15, yPos + 4);
    doc.text(attendee.university_id, pageWidth / 2 + 5, yPos + 4);
    doc.text(new Date(attendee.check_in_time).toLocaleTimeString(), pageWidth - margin - 5, yPos + 4, { align: 'right' });
    yPos += 6;
  });

  // Footer on all pages
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Dean of Student Affairs - University of Jordan', margin, pageHeight - 5);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`attendance-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}-${data.opportunity.date}.pdf`);
}

export async function generateAllVolunteersPDF(volunteers: Array<{
  name: string;
  university_id: string;
  faculty: string;
  total_hours: number;
  opportunities_completed: number;
  is_active: boolean;
}>): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let yPos = margin;

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 32, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 32, pageWidth, 2, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 10, 6, 18, 18);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ALL VOLUNTEERS REPORT', 34, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total: ${volunteers.length} volunteers | Generated: ${new Date().toLocaleDateString()}`, 34, 24);

  yPos = 40;

  // Define column widths with proper spacing
  const colWidths = { num: 10, name: 75, id: 35, faculty: 70, hours: 25, opps: 35, status: 25 };
  const colX = {
    num: margin + 3,
    name: margin + 13,
    id: margin + 88,
    faculty: margin + 123,
    hours: margin + 193,
    opps: margin + 218,
    status: margin + 253
  };

  // Table Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 2, 2, 'F');
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(8);
  doc.text('#', colX.num, yPos + 5.5);
  doc.text('Volunteer Name', colX.name, yPos + 5.5);
  doc.text('University ID', colX.id, yPos + 5.5);
  doc.text('Faculty', colX.faculty, yPos + 5.5);
  doc.text('Hours', colX.hours, yPos + 5.5);
  doc.text('Opportunities', colX.opps, yPos + 5.5);
  doc.text('Status', colX.status, yPos + 5.5);
  yPos += 8;

  // Table Rows
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  volunteers.forEach((vol, index) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = margin;
      
      // Repeat header on new page
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 2, 2, 'F');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(8);
      doc.text('#', colX.num, yPos + 5.5);
      doc.text('Volunteer Name', colX.name, yPos + 5.5);
      doc.text('University ID', colX.id, yPos + 5.5);
      doc.text('Faculty', colX.faculty, yPos + 5.5);
      doc.text('Hours', colX.hours, yPos + 5.5);
      doc.text('Opportunities', colX.opps, yPos + 5.5);
      doc.text('Status', colX.status, yPos + 5.5);
      yPos += 8;
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    }

    const bg = index % 2 === 0 ? colors.light : colors.white;
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text((index + 1).toString(), colX.num, yPos + 4);
    doc.text(truncateText(doc, vol.name, colWidths.name - 5), colX.name, yPos + 4);
    doc.text(vol.university_id, colX.id, yPos + 4);
    doc.text(truncateText(doc, vol.faculty || 'N/A', colWidths.faculty - 5), colX.faculty, yPos + 4);
    doc.text(vol.total_hours.toString(), colX.hours, yPos + 4);
    doc.text(vol.opportunities_completed.toString(), colX.opps, yPos + 4);
    
    doc.setTextColor(vol.is_active ? colors.secondary[0] : colors.muted[0], vol.is_active ? colors.secondary[1] : colors.muted[1], vol.is_active ? colors.secondary[2] : colors.muted[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(vol.is_active ? 'Active' : 'Inactive', colX.status, yPos + 4);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'normal');
    yPos += 6;
  });

  // Footer on all pages
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Dean of Student Affairs - University of Jordan', margin, pageHeight - 4);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`all-volunteers-${new Date().toISOString().split('T')[0]}.pdf`);
}
