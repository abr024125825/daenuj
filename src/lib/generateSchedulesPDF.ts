import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.png';
import { format } from 'date-fns';

// Professional color palette - consistent with other reports
const colors = {
  primary: [16, 78, 58],
  secondary: [34, 197, 94],
  accent: [234, 179, 8],
  dark: [30, 41, 59],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
  info: [59, 130, 246],
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

interface CourseData {
  course_code: string;
  course_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location?: string | null;
}

interface VolunteerScheduleData {
  volunteerName: string;
  universityId: string;
  faculty: string;
  major: string;
  submittedAt: string | null;
  courses: CourseData[];
}

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export async function generateAllSchedulesPDF(data: {
  semester: {
    name: string;
    academicYear: string;
  };
  volunteers: VolunteerScheduleData[];
  stats: {
    total: number;
    submitted: number;
    pending: number;
    totalCourses: number;
  };
}): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 40, pageWidth, 3, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 8, 20, 20);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VOLUNTEER SCHEDULES REPORT', 38, 15);
  
  doc.setFontSize(11);
  doc.text(`${data.semester.name} - ${data.semester.academicYear}`, 38, 24);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 38, 32);

  yPos = 50;

  // Stats row
  const statsData = [
    { label: 'Total Volunteers', value: data.stats.total, color: colors.primary },
    { label: 'Submitted', value: data.stats.submitted, color: colors.secondary },
    { label: 'Pending', value: data.stats.pending, color: colors.accent },
    { label: 'Total Courses', value: data.stats.totalCourses, color: colors.info },
  ];

  const statWidth = (pageWidth - margin * 2) / statsData.length - 5;
  statsData.forEach((stat, index) => {
    const x = margin + (statWidth + 5) * index;
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, statWidth, 20, 2, 2, 'F');
    
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(stat.value.toString(), x + statWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(stat.label, x + statWidth / 2, yPos + 16, { align: 'center' });
  });

  yPos += 28;

  // Volunteers schedules
  const submittedVolunteers = data.volunteers.filter(v => v.courses.length > 0);
  
  for (let vIndex = 0; vIndex < submittedVolunteers.length; vIndex++) {
    const volunteer = submittedVolunteers[vIndex];
    
    // Check if we need a new page
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    // Volunteer header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    const volName = truncateText(doc, volunteer.volunteerName, 80);
    doc.text(`${vIndex + 1}. ${volName}`, margin + 5, yPos + 7);
    doc.text(`ID: ${volunteer.universityId}`, margin + 100, yPos + 7);
    doc.text(truncateText(doc, volunteer.faculty, 50), margin + 150, yPos + 7);
    doc.text(`Courses: ${volunteer.courses.length}`, pageWidth - margin - 30, yPos + 7);
    
    yPos += 12;

    // Courses table header
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.rect(margin + 5, yPos, pageWidth - margin * 2 - 10, 7, 'F');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    const colPositions = {
      day: margin + 8,
      code: margin + 40,
      name: margin + 75,
      time: margin + 170,
      location: margin + 210,
    };
    
    doc.text('Day', colPositions.day, yPos + 5);
    doc.text('Code', colPositions.code, yPos + 5);
    doc.text('Course Name', colPositions.name, yPos + 5);
    doc.text('Time', colPositions.time, yPos + 5);
    doc.text('Location', colPositions.location, yPos + 5);
    
    yPos += 7;

    // Sort courses by day
    const sortedCourses = [...volunteer.courses].sort((a, b) => {
      return DAYS_ORDER.indexOf(a.day_of_week) - DAYS_ORDER.indexOf(b.day_of_week);
    });

    // Course rows
    sortedCourses.forEach((course, cIndex) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
        
        // Repeat volunteer name on new page
        doc.setFillColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 7, 1, 1, 'F');
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setFontSize(8);
        doc.text(`Continued: ${volunteer.volunteerName}`, margin + 5, yPos + 5);
        yPos += 9;
      }

      const bg = cIndex % 2 === 0 ? colors.white : colors.light;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin + 5, yPos, pageWidth - margin * 2 - 10, 6, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      
      doc.text(course.day_of_week, colPositions.day, yPos + 4);
      doc.text(truncateText(doc, course.course_code, 30), colPositions.code, yPos + 4);
      doc.text(truncateText(doc, course.course_name, 90), colPositions.name, yPos + 4);
      doc.text(`${course.start_time} - ${course.end_time}`, colPositions.time, yPos + 4);
      doc.text(truncateText(doc, course.location || '-', 40), colPositions.location, yPos + 4);
      
      yPos += 6;
    });

    yPos += 8;
  }

  // Add summary for volunteers with no courses
  const noCoursesVolunteers = data.volunteers.filter(v => v.courses.length === 0);
  if (noCoursesVolunteers.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PENDING SUBMISSIONS', margin, yPos);
    doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos + 2, margin + 45, yPos + 2);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    
    noCoursesVolunteers.slice(0, 20).forEach((v, i) => {
      if (yPos > pageHeight - 20) return;
      doc.text(`${i + 1}. ${truncateText(doc, v.volunteerName, 60)} (${v.universityId})`, margin, yPos);
      yPos += 5;
    });

    if (noCoursesVolunteers.length > 20) {
      doc.text(`... and ${noCoursesVolunteers.length - 20} more pending`, margin, yPos);
    }
  }

  // Footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Community Service & Development Center - University of Jordan', margin, pageHeight - 5);
    doc.text(`Page ${pageNum} of ${totalPages}  |  Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`volunteer-schedules-${data.semester.name.replace(/\s+/g, '-')}-${data.semester.academicYear}.pdf`);
}
