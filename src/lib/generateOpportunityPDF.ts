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

  const primaryGreen = [0, 100, 60];
  const darkSlate = [30, 41, 59];

  // Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 6, 18, 18);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('VOLUNTEERS DETAILS REPORT', 38, 14);
  doc.setFontSize(12);
  doc.text(data.opportunity.title.substring(0, 45), 38, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${data.opportunity.date} | ${data.opportunity.location}`, 38, 30);
  doc.text(`Total: ${data.volunteers.length} volunteers`, pageWidth - margin, 30, { align: 'right' });

  yPos = 50;

  // Volunteer Details
  data.volunteers.forEach((vol, index) => {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // Volunteer Card
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 50, 2, 2, 'F');

    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${index + 1}. ${vol.name}`, margin + 5, yPos + 8);

    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const col1X = margin + 5;
    const col2X = pageWidth / 2;

    doc.text(`University ID: ${vol.university_id}`, col1X, yPos + 16);
    doc.text(`Phone: ${vol.phone}`, col2X, yPos + 16);

    doc.text(`Email: ${vol.email}`, col1X, yPos + 22);
    doc.text(`Faculty: ${vol.faculty}`, col2X, yPos + 22);

    doc.text(`Major: ${vol.major}`, col1X, yPos + 28);
    doc.text(`Academic Year: ${vol.academic_year}`, col2X, yPos + 28);

    doc.text(`Emergency Contact: ${vol.emergency_contact}`, col1X, yPos + 34);
    doc.text(`Emergency Phone: ${vol.emergency_phone}`, col2X, yPos + 34);

    yPos += 55;
  });

  // Footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('Community Service & Development Center', margin, pageHeight - 5);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
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

  const primaryGreen = [0, 100, 60];
  const darkSlate = [30, 41, 59];

  const listTitles: Record<string, string> = {
    approved: 'APPROVED VOLUNTEERS',
    rejected: 'REJECTED APPLICATIONS',
    waitlisted: 'WAITLISTED VOLUNTEERS',
    withdrawn: 'WITHDRAWN VOLUNTEERS',
  };

  // Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 6, 16, 16);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(listTitles[data.listType], 35, 14);
  doc.setFontSize(10);
  doc.text(data.opportunity.title.substring(0, 50), 35, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${data.opportunity.date} | Total: ${data.volunteers.length}`, 35, 28);

  yPos = 45;

  // Table Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('#', margin + 5, yPos + 5.5);
  doc.text('Volunteer Name', margin + 15, yPos + 5.5);
  doc.text('University ID', margin + 100, yPos + 5.5);
  if (data.listType === 'withdrawn') {
    doc.text('Reason', margin + 135, yPos + 5.5);
  }
  yPos += 8;

  // Table Rows
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  data.volunteers.forEach((vol, index) => {
    if (yPos > pageHeight - 25) {
      doc.addPage();
      yPos = margin;

      // Repeat header
      doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('#', margin + 5, yPos + 5.5);
      doc.text('Volunteer Name', margin + 15, yPos + 5.5);
      doc.text('University ID', margin + 100, yPos + 5.5);
      if (data.listType === 'withdrawn') {
        doc.text('Reason', margin + 135, yPos + 5.5);
      }
      yPos += 8;
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    }

    const bg = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F');

    doc.setFontSize(9);
    doc.text((index + 1).toString(), margin + 5, yPos + 4);
    doc.text(vol.name.substring(0, 40), margin + 15, yPos + 4);
    doc.text(vol.university_id, margin + 100, yPos + 4);
    if (data.listType === 'withdrawn' && vol.reason) {
      doc.setFontSize(7);
      doc.text(vol.reason.substring(0, 30), margin + 135, yPos + 4);
    }
    yPos += 6;
  });

  // Footer
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('Community Service & Development Center', margin, pageHeight - 5);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });

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

  const primaryGreen = [0, 100, 60];
  const darkSlate = [30, 41, 59];

  // Header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  try {
    const logoBase64 = await getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 12, 8, 20, 20);
  } catch (error) {
    console.error('Could not load logo:', error);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('OPPORTUNITY REPORT', 40, 16);
  doc.setFontSize(14);
  doc.text(data.opportunity.title.substring(0, 40), 40, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Status: ${data.opportunity.status.toUpperCase()}`, 40, 36);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 36, { align: 'right' });

  yPos = 55;

  // Opportunity Details
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OPPORTUNITY DETAILS', margin, yPos);
  doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setLineWidth(1);
  doc.line(margin, yPos + 2, margin + 50, yPos + 2);
  yPos += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const details = [
    ['Date:', data.opportunity.date],
    ['Time:', `${data.opportunity.start_time} - ${data.opportunity.end_time}`],
    ['Location:', data.opportunity.location],
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 30, yPos);
    yPos += 7;
  });

  yPos += 5;

  // Description
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const descLines = doc.splitTextToSize(data.opportunity.description, pageWidth - margin * 2);
  doc.text(descLines.slice(0, 5), margin, yPos);
  yPos += descLines.slice(0, 5).length * 5 + 10;

  // Statistics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('STATISTICS', margin, yPos);
  doc.line(margin, yPos + 2, margin + 30, yPos + 2);
  yPos += 15;

  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const stats = [
    { label: 'Total', value: data.stats.total_registrations.toString() },
    { label: 'Approved', value: data.stats.approved.toString() },
    { label: 'Attended', value: data.stats.attended.toString() },
    { label: 'Waitlisted', value: data.stats.waitlisted.toString() },
  ];

  stats.forEach((stat, index) => {
    const x = margin + (boxWidth + 5) * index;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, yPos, boxWidth, 25, 2, 2, 'F');
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(stat.value, x + boxWidth / 2, yPos + 12, { align: 'center' });
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(stat.label, x + boxWidth / 2, yPos + 20, { align: 'center' });
  });

  yPos += 35;

  // Attendance Rate
  const attendanceRate = data.stats.approved > 0 
    ? Math.round((data.stats.attended / data.stats.approved) * 100) 
    : 0;

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ATTENDANCE RATE', margin, yPos);
  doc.line(margin, yPos + 2, margin + 45, yPos + 2);
  yPos += 15;

  // Progress bar
  const barWidth = pageWidth - margin * 2;
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(margin, yPos, barWidth, 10, 2, 2, 'F');
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.roundedRect(margin, yPos, barWidth * (attendanceRate / 100), 10, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (attendanceRate > 10) {
    doc.text(`${attendanceRate}%`, margin + 5, yPos + 7);
  }

  // Footer
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Community Service & Development Center - University of Jordan', pageWidth / 2, pageHeight - 7, { align: 'center' });

  doc.save(`report-${data.opportunity.title.replace(/\s+/g, '-').substring(0, 20)}-${data.opportunity.date}.pdf`);
}
