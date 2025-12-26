import jsPDF from 'jspdf';
import logoImage from '@/assets/logo.png';

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

interface VolunteerDetail {
  name: string;
  university_id: string;
  phone: string;
  email: string;
  faculty: string;
  major: string;
  academic_year: string;
  emergency_contact: string;
  emergency_phone: string;
}

// Professional color palette
const colors = {
  primary: [16, 78, 58],
  secondary: [34, 197, 94],
  accent: [234, 179, 8],
  dark: [30, 41, 59],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
};

export async function generateOpportunityVolunteersPDF(data: {
  opportunity: {
    title: string;
    date: string;
    location: string;
  };
  volunteers: VolunteerDetail[];
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

  // Header with gradient effect
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Accent stripe
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
  doc.setFontSize(16);
  doc.text('VOLUNTEERS DETAILS REPORT', 40, 16);
  
  doc.setFontSize(12);
  doc.text(data.opportunity.title.substring(0, 40), 40, 24);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`📅 ${data.opportunity.date}  |  📍 ${data.opportunity.location}`, 40, 32);
  doc.text(`Total Volunteers: ${data.volunteers.length}`, 40, 38);

  yPos = 58;

  // Volunteer Details
  data.volunteers.forEach((vol, index) => {
    if (yPos > pageHeight - 65) {
      doc.addPage();
      yPos = margin;
    }

    // Volunteer Card with shadow effect
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 55, 3, 3, 'F');
    
    // Left accent bar
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, yPos, 4, 55, 'F');

    // Number badge
    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.circle(margin + 14, yPos + 10, 6, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text((index + 1).toString(), margin + 14, yPos + 12, { align: 'center' });

    // Name
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(vol.name, margin + 25, yPos + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);

    const col1X = margin + 10;
    const col2X = pageWidth / 2 + 5;

    // Row 1
    doc.text(`University ID: ${vol.university_id}`, col1X, yPos + 22);
    doc.text(`Phone: ${vol.phone}`, col2X, yPos + 22);

    // Row 2
    doc.text(`Email: ${vol.email}`, col1X, yPos + 29);
    doc.text(`Faculty: ${vol.faculty}`, col2X, yPos + 29);

    // Row 3
    doc.text(`Major: ${vol.major}`, col1X, yPos + 36);
    doc.text(`Academic Year: ${vol.academic_year}`, col2X, yPos + 36);

    // Row 4 - Emergency info with highlight
    doc.setFillColor(255, 243, 224);
    doc.roundedRect(col1X - 2, yPos + 41, pageWidth - margin * 2 - 16, 10, 1, 1, 'F');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(`⚠️ Emergency: ${vol.emergency_contact} - ${vol.emergency_phone}`, col1X, yPos + 48);

    yPos += 60;
  });

  // Footer on each page
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Community Service & Development Center - University of Jordan', margin, pageHeight - 6);
    doc.text(`Page ${pageNum} of ${totalPages}  |  Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`volunteers-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}-${data.opportunity.date}.pdf`);
}

export async function generateOpportunityListPDF(data: {
  opportunity: {
    title: string;
    date: string;
  };
  listType: 'approved' | 'rejected' | 'waitlisted' | 'withdrawn';
  volunteers: Array<{
    name: string;
    university_id: string;
    reason?: string;
  }>;
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

  const listConfig: Record<string, { title: string; color: number[]; icon: string }> = {
    approved: { title: 'APPROVED VOLUNTEERS', color: [34, 197, 94], icon: '✓' },
    rejected: { title: 'REJECTED APPLICATIONS', color: [239, 68, 68], icon: '✗' },
    waitlisted: { title: 'WAITLISTED VOLUNTEERS', color: [234, 179, 8], icon: '⏳' },
    withdrawn: { title: 'WITHDRAWN VOLUNTEERS', color: [156, 163, 175], icon: '↩' },
  };

  const config = listConfig[data.listType];

  // Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Status accent stripe
  doc.setFillColor(config.color[0], config.color[1], config.color[2]);
  doc.rect(0, 40, pageWidth, 4, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 8, 20, 20);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(config.title, 38, 16);
  
  doc.setFontSize(11);
  doc.text(data.opportunity.title.substring(0, 45), 38, 24);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${data.opportunity.date}  |  Total: ${data.volunteers.length}`, 38, 32);

  yPos = 52;

  // Check if list is empty
  if (data.volunteers.length === 0) {
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.text('No volunteers in this list', pageWidth / 2, yPos + 20, { align: 'center' });
    
    // Add footer
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(7);
    doc.text('Community Service & Development Center', margin, pageHeight - 6);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    
    doc.save(`${data.listType}-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}-${data.opportunity.date}.pdf`);
    return;
  }

  // Table Header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('#', margin + 8, yPos + 7);
  doc.text('Volunteer Name', margin + 20, yPos + 7);
  doc.text('University ID', margin + 100, yPos + 7);
  if (data.listType === 'withdrawn') {
    doc.text('Reason', margin + 140, yPos + 7);
  }
  yPos += 12;

  // Table Rows
  data.volunteers.forEach((vol, index) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;

      // Repeat header on new page
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F');
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('#', margin + 8, yPos + 7);
      doc.text('Volunteer Name', margin + 20, yPos + 7);
      doc.text('University ID', margin + 100, yPos + 7);
      if (data.listType === 'withdrawn') {
        doc.text('Reason', margin + 140, yPos + 7);
      }
      yPos += 12;
    }

    // Alternating row colors
    const bg = index % 2 === 0 ? colors.light : colors.white;
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');

    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Status icon
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(config.color[0], config.color[1], config.color[2]);
    doc.text((index + 1).toString(), margin + 8, yPos + 5.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(vol.name.substring(0, 35), margin + 20, yPos + 5.5);
    doc.text(vol.university_id || 'N/A', margin + 100, yPos + 5.5);
    
    if (data.listType === 'withdrawn' && vol.reason) {
      doc.setFontSize(7);
      doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      doc.text(vol.reason.substring(0, 25), margin + 140, yPos + 5.5);
    }
    yPos += 8;
  });

  // Summary box
  yPos += 5;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 15, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(config.color[0], config.color[1], config.color[2]);
  doc.text(`Total ${data.listType}: ${data.volunteers.length}`, pageWidth / 2, yPos + 10, { align: 'center' });

  // Footer
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(7);
  doc.text('Community Service & Development Center - University of Jordan', margin, pageHeight - 6);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 6, { align: 'right' });

  doc.save(`${data.listType}-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}-${data.opportunity.date}.pdf`);
}

export async function generateOpportunityReportPDF(data: {
  opportunity: {
    title: string;
    description: string;
    date: string;
    location: string;
    start_time: string;
    end_time: string;
    status: string;
  };
  stats: {
    total_registrations: number;
    approved: number;
    rejected: number;
    waitlisted: number;
    attended: number;
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

  // Header with gradient effect
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Decorative accent
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.rect(0, 50, pageWidth, 4, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 10, 25, 25);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('OPPORTUNITY REPORT', 45, 18);
  
  doc.setFontSize(13);
  doc.text(data.opportunity.title.substring(0, 35), 45, 28);
  
  // Status badge
  const statusColors: Record<string, number[]> = {
    draft: [156, 163, 175],
    published: [34, 197, 94],
    completed: [59, 130, 246],
  };
  const statusColor = statusColors[data.opportunity.status] || colors.muted;
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(45, 32, 25, 8, 2, 2, 'F');
  doc.setFontSize(7);
  doc.text(data.opportunity.status.toUpperCase(), 57.5, 37.5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 42, { align: 'right' });

  yPos = 65;

  // Opportunity Details Section
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OPPORTUNITY DETAILS', margin, yPos);
  
  doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setLineWidth(2);
  doc.line(margin, yPos + 3, margin + 55, yPos + 3);
  yPos += 15;

  // Details grid
  const detailsBox = [
    ['📅 Date', data.opportunity.date],
    ['⏰ Time', `${data.opportunity.start_time} - ${data.opportunity.end_time}`],
    ['📍 Location', data.opportunity.location],
  ];

  doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 35, 3, 3, 'F');

  detailsBox.forEach(([label, value], index) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(label, margin + 8, yPos + index * 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(value, margin + 50, yPos + index * 10);
  });

  yPos += 40;

  // Description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text('Description', margin, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  const descLines = doc.splitTextToSize(data.opportunity.description, pageWidth - margin * 2);
  doc.text(descLines.slice(0, 4), margin, yPos);
  yPos += Math.min(descLines.length, 4) * 5 + 15;

  // Statistics Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text('STATISTICS OVERVIEW', margin, yPos);
  
  doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setLineWidth(2);
  doc.line(margin, yPos + 3, margin + 50, yPos + 3);
  yPos += 15;

  // Stats cards
  const statsData = [
    { label: 'Total Registrations', value: data.stats.total_registrations, color: colors.primary },
    { label: 'Approved', value: data.stats.approved, color: [34, 197, 94] },
    { label: 'Attended', value: data.stats.attended, color: [59, 130, 246] },
    { label: 'Waitlisted', value: data.stats.waitlisted, color: [234, 179, 8] },
  ];

  const cardWidth = (pageWidth - margin * 2 - 15) / 4;
  statsData.forEach((stat, index) => {
    const x = margin + (cardWidth + 5) * index;
    
    // Card background
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.roundedRect(x, yPos, cardWidth, 30, 3, 3, 'F');
    
    // Top accent
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(x, yPos, cardWidth, 5, 3, 3, 'F');
    doc.rect(x, yPos + 3, cardWidth, 2, 'F');
    
    // Value
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(stat.value.toString(), x + cardWidth / 2, yPos + 18, { align: 'center' });
    
    // Label
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(stat.label, x + cardWidth / 2, yPos + 26, { align: 'center' });
  });

  yPos += 45;

  // Attendance Rate Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  doc.text('ATTENDANCE RATE', margin, yPos);
  
  doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setLineWidth(2);
  doc.line(margin, yPos + 3, margin + 45, yPos + 3);
  yPos += 15;

  const attendanceRate = data.stats.approved > 0 
    ? Math.round((data.stats.attended / data.stats.approved) * 100) 
    : 0;

  // Progress bar background
  const barWidth = pageWidth - margin * 2;
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(margin, yPos, barWidth, 15, 4, 4, 'F');
  
  // Progress bar fill
  doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  const fillWidth = Math.max((barWidth * attendanceRate) / 100, attendanceRate > 0 ? 10 : 0);
  doc.roundedRect(margin, yPos, fillWidth, 15, 4, 4, 'F');

  // Percentage text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (attendanceRate > 15) {
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.text(`${attendanceRate}%`, margin + 8, yPos + 10);
  } else {
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.text(`${attendanceRate}%`, margin + fillWidth + 8, yPos + 10);
  }

  // Right side text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
  doc.text(`${data.stats.attended} of ${data.stats.approved} approved volunteers attended`, pageWidth - margin, yPos + 10, { align: 'right' });

  // Footer
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');
  doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Community Service & Development Center', pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('University of Jordan', pageWidth / 2, pageHeight - 5, { align: 'center' });

  doc.save(`report-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}-${data.opportunity.date}.pdf`);
}