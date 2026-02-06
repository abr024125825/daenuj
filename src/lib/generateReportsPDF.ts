import jsPDF from 'jspdf';
import logoImage from '@/assets/logo-transparent.png';
import { format } from 'date-fns';

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

// Professional color palette - Dean of Student Affairs Theme
const colors = {
  primary: [25, 130, 160],
  secondary: [59, 160, 190],
  accent: [234, 179, 8],
  dark: [30, 41, 59],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
  danger: [239, 68, 68],
  warning: [234, 179, 8],
  info: [59, 130, 246],
};

interface BadgeTransaction {
  volunteerName: string;
  universityId: string;
  phone: string;
  status: string;
  checkoutCode: string;
  checkoutTime: string | null;
  checkoutCondition: string | null;
  returnTime: string | null;
  returnCondition: string | null;
  notes: string | null;
}

export async function generateBadgeTransactionsPDF(data: {
  opportunity: {
    title: string;
    date: string;
    location: string;
  };
  transactions: BadgeTransaction[];
  stats: {
    total: number;
    pending: number;
    checkedOut: number;
    returned: number;
    lost: number;
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
  doc.text('BADGE/VEST TRANSACTIONS REPORT', 38, 15);
  
  doc.setFontSize(11);
  doc.text(data.opportunity.title.substring(0, 50), 38, 24);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${data.opportunity.date}  |  Location: ${data.opportunity.location}`, 38, 32);

  yPos = 50;

  // Stats row
  const statsData = [
    { label: 'Total', value: data.stats.total, color: colors.primary },
    { label: 'Pending', value: data.stats.pending, color: colors.muted },
    { label: 'Checked Out', value: data.stats.checkedOut, color: colors.info },
    { label: 'Returned', value: data.stats.returned, color: colors.secondary },
    { label: 'Lost', value: data.stats.lost, color: colors.danger },
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

  // Table Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  
  const colWidths = [8, 50, 25, 25, 22, 25, 30, 30, 45];
  const colX = [margin + 3];
  for (let i = 1; i < colWidths.length; i++) {
    colX.push(colX[i - 1] + colWidths[i - 1]);
  }
  
  doc.text('#', colX[0], yPos + 7);
  doc.text('Volunteer Name', colX[1], yPos + 7);
  doc.text('University ID', colX[2], yPos + 7);
  doc.text('Phone', colX[3], yPos + 7);
  doc.text('Status', colX[4], yPos + 7);
  doc.text('Code', colX[5], yPos + 7);
  doc.text('Checkout', colX[6], yPos + 7);
  doc.text('Return', colX[7], yPos + 7);
  doc.text('Notes', colX[8], yPos + 7);
  
  yPos += 12;

  // Table rows
  data.transactions.forEach((t, index) => {
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = margin;
      
      // Repeat header
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('#', colX[0], yPos + 7);
      doc.text('Volunteer Name', colX[1], yPos + 7);
      doc.text('University ID', colX[2], yPos + 7);
      doc.text('Phone', colX[3], yPos + 7);
      doc.text('Status', colX[4], yPos + 7);
      doc.text('Code', colX[5], yPos + 7);
      doc.text('Checkout', colX[6], yPos + 7);
      doc.text('Return', colX[7], yPos + 7);
      doc.text('Notes', colX[8], yPos + 7);
      yPos += 12;
    }

    const bg = index % 2 === 0 ? colors.light : colors.white;
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    
    doc.text((index + 1).toString(), colX[0], yPos + 5.5);
    doc.text(t.volunteerName.substring(0, 25), colX[1], yPos + 5.5);
    doc.text(t.universityId || '', colX[2], yPos + 5.5);
    doc.text(t.phone || '', colX[3], yPos + 5.5);
    
    // Status with color
    const statusColors: Record<string, number[]> = {
      pending: colors.muted,
      checked_out: colors.info,
      returned: colors.secondary,
      lost: colors.danger,
    };
    const statusColor = statusColors[t.status] || colors.muted;
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(t.status.replace('_', ' '), colX[4], yPos + 5.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(t.checkoutCode || '', colX[5], yPos + 5.5);
    doc.text(t.checkoutTime ? `${t.checkoutTime} (${t.checkoutCondition || ''})` : '-', colX[6], yPos + 5.5);
    doc.text(t.returnTime ? `${t.returnTime} (${t.returnCondition || ''})` : '-', colX[7], yPos + 5.5);
    doc.text((t.notes || '-').substring(0, 20), colX[8], yPos + 5.5);
    
    yPos += 8;
  });

  // Footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Dean of Student Affairs - University of Jordan', margin, pageHeight - 5);
    doc.text(`Page ${pageNum} of ${totalPages}  |  Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`badge-transactions-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}-${data.opportunity.date}.pdf`);
}

interface ScheduleSubmission {
  volunteerName: string;
  universityId: string;
  faculty: string;
  major: string;
  submittedAt: string | null;
  courseCount: number;
  status: 'submitted' | 'pending';
}

export async function generateScheduleSubmissionsPDF(data: {
  semester: {
    name: string;
    academicYear: string;
  };
  submissions: ScheduleSubmission[];
  stats: {
    total: number;
    submitted: number;
    pending: number;
    submissionRate: number;
  };
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
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 45, pageWidth, 3, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 10, 22, 22);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SCHEDULE SUBMISSIONS REPORT', 40, 18);
  
  doc.setFontSize(12);
  doc.text(`${data.semester.name} - ${data.semester.academicYear}`, 40, 28);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 40, 38);

  yPos = 55;

  // Stats cards
  const statsData = [
    { label: 'Total Volunteers', value: data.stats.total, color: colors.primary },
    { label: 'Submitted', value: data.stats.submitted, color: colors.secondary },
    { label: 'Pending', value: data.stats.pending, color: colors.warning },
    { label: 'Submission Rate', value: `${Math.round(data.stats.submissionRate)}%`, color: colors.info },
  ];

  const cardWidth = (pageWidth - margin * 2 - 15) / 4;
  statsData.forEach((stat, index) => {
    const x = margin + (cardWidth + 5) * index;
    
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, cardWidth, 25, 3, 3, 'F');
    
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, yPos, cardWidth, 4, 3, 3, 'F');
    doc.rect(x, yPos + 2, cardWidth, 2, 'F');
    
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(stat.value.toString(), x + cardWidth / 2, yPos + 15, { align: 'center' });
    
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(stat.label, x + cardWidth / 2, yPos + 21, { align: 'center' });
  });

  yPos += 35;

  // Table Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('#', margin + 5, yPos + 7);
  doc.text('Volunteer Name', margin + 15, yPos + 7);
  doc.text('University ID', margin + 70, yPos + 7);
  doc.text('Faculty', margin + 100, yPos + 7);
  doc.text('Courses', margin + 140, yPos + 7);
  doc.text('Status', margin + 160, yPos + 7);
  yPos += 12;

  // Table rows
  data.submissions.forEach((s, index) => {
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = margin;
      
      // Repeat header
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('#', margin + 5, yPos + 7);
      doc.text('Volunteer Name', margin + 15, yPos + 7);
      doc.text('University ID', margin + 70, yPos + 7);
      doc.text('Faculty', margin + 100, yPos + 7);
      doc.text('Courses', margin + 140, yPos + 7);
      doc.text('Status', margin + 160, yPos + 7);
      yPos += 12;
    }

    const bg = index % 2 === 0 ? colors.light : colors.white;
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    
    doc.text((index + 1).toString(), margin + 5, yPos + 5.5);
    doc.text(s.volunteerName.substring(0, 28), margin + 15, yPos + 5.5);
    doc.text(s.universityId || '', margin + 70, yPos + 5.5);
    doc.text(s.faculty.substring(0, 20), margin + 100, yPos + 5.5);
    doc.text(s.courseCount.toString(), margin + 145, yPos + 5.5);
    
    const statusColor = s.status === 'submitted' ? colors.secondary : colors.warning;
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(s.status === 'submitted' ? 'Submitted' : 'Pending', margin + 160, yPos + 5.5);
    
    yPos += 8;
  });

  // Footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Dean of Student Affairs - University of Jordan', margin, pageHeight - 5);
    doc.text(`Page ${pageNum} of ${totalPages}  |  Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`schedule-submissions-${data.semester.name.replace(/\s+/g, '-')}.pdf`);
}

interface AvailabilityData {
  volunteerName: string;
  universityId: string;
  faculty: string;
  interests: string[];
  isAvailable: boolean;
  conflictingCourses: string[];
}

export async function generateAvailabilityListPDF(data: {
  opportunity: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  listType: 'available' | 'unavailable' | 'matching';
  volunteers: AvailabilityData[];
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

  const listConfig: Record<string, { title: string; color: number[] }> = {
    available: { title: 'AVAILABLE VOLUNTEERS', color: colors.secondary },
    unavailable: { title: 'UNAVAILABLE VOLUNTEERS', color: colors.danger },
    matching: { title: 'MATCHING INTEREST VOLUNTEERS', color: colors.info },
  };

  const config = listConfig[data.listType];

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');
  
  doc.setFillColor(config.color[0], config.color[1], config.color[2]);
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
  doc.text(config.title, 38, 14);
  
  doc.setFontSize(11);
  doc.text(data.opportunity.title.substring(0, 45), 38, 23);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${data.opportunity.date}  |  Time: ${data.opportunity.startTime} - ${data.opportunity.endTime}`, 38, 31);
  doc.text(`Location: ${data.opportunity.location}  |  Total: ${data.volunteers.length}`, 38, 38);

  yPos = 52;

  if (data.volunteers.length === 0) {
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.text('No volunteers in this list', pageWidth / 2, yPos + 20, { align: 'center' });
  } else {
    // Table Header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('#', margin + 5, yPos + 7);
    doc.text('Volunteer Name', margin + 15, yPos + 7);
    doc.text('University ID', margin + 70, yPos + 7);
    doc.text('Faculty', margin + 100, yPos + 7);
    if (data.listType === 'matching') {
      doc.text('Interests', margin + 140, yPos + 7);
    }
    yPos += 12;

    data.volunteers.forEach((v, index) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
        
        // Repeat header
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('#', margin + 5, yPos + 7);
        doc.text('Volunteer Name', margin + 15, yPos + 7);
        doc.text('University ID', margin + 70, yPos + 7);
        doc.text('Faculty', margin + 100, yPos + 7);
        if (data.listType === 'matching') {
          doc.text('Interests', margin + 140, yPos + 7);
        }
        yPos += 12;
      }

      const bg = index % 2 === 0 ? colors.light : colors.white;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(config.color[0], config.color[1], config.color[2]);
      doc.text((index + 1).toString(), margin + 5, yPos + 5.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.text(v.volunteerName.substring(0, 28), margin + 15, yPos + 5.5);
      doc.text(v.universityId || '', margin + 70, yPos + 5.5);
      doc.text(v.faculty.substring(0, 20), margin + 100, yPos + 5.5);
      
      if (data.listType === 'matching') {
        doc.setFontSize(7);
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.text(v.interests.slice(0, 2).join(', ').substring(0, 25), margin + 140, yPos + 5.5);
      }
      
      yPos += 8;
    });
  }

  // Summary
  yPos += 5;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(config.color[0], config.color[1], config.color[2]);
  doc.text(`Total ${data.listType}: ${data.volunteers.length}`, pageWidth / 2, yPos + 8, { align: 'center' });

  // Footer
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('Dean of Student Affairs - University of Jordan', margin, pageHeight - 5);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });

  doc.save(`${data.listType}-volunteers-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}.pdf`);
}
