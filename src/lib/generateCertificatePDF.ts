import jsPDF from 'jspdf';

interface CertificateData {
  volunteerName: string;
  opportunityTitle: string;
  hours: number;
  certificateNumber: string;
  issuedAt: string;
  opportunityDate: string;
  location: string;
}

export function generateCertificatePDF(data: CertificateData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background gradient effect (using rectangles)
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Border
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  // Inner border
  doc.setDrawColor(147, 197, 253);
  doc.setLineWidth(1);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

  // Decorative corners
  const cornerSize = 20;
  doc.setFillColor(59, 130, 246);
  
  // Top left corner
  doc.triangle(10, 10, 10 + cornerSize, 10, 10, 10 + cornerSize, 'F');
  // Top right corner
  doc.triangle(pageWidth - 10, 10, pageWidth - 10 - cornerSize, 10, pageWidth - 10, 10 + cornerSize, 'F');
  // Bottom left corner
  doc.triangle(10, pageHeight - 10, 10 + cornerSize, pageHeight - 10, 10, pageHeight - 10 - cornerSize, 'F');
  // Bottom right corner
  doc.triangle(pageWidth - 10, pageHeight - 10, pageWidth - 10 - cornerSize, pageHeight - 10, pageWidth - 10, pageHeight - 10 - cornerSize, 'F');

  // Header - Certificate of Volunteering
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFICATE', pageWidth / 2, 35, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(30, 41, 59);
  doc.text('OF VOLUNTEERING', pageWidth / 2, 50, { align: 'center' });

  // Decorative line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 60, 58, pageWidth / 2 + 60, 58);

  // "This is to certify that"
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('This is to certify that', pageWidth / 2, 75, { align: 'center' });

  // Volunteer name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(59, 130, 246);
  doc.text(data.volunteerName, pageWidth / 2, 90, { align: 'center' });

  // Underline for name
  const nameWidth = doc.getTextWidth(data.volunteerName);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - nameWidth / 2, 94, pageWidth / 2 + nameWidth / 2, 94);

  // "has successfully completed"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('has successfully completed volunteer service for', pageWidth / 2, 108, { align: 'center' });

  // Opportunity title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(data.opportunityTitle, pageWidth / 2, 122, { align: 'center' });

  // Hours and date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text(`Contributing ${data.hours} hours of volunteer service`, pageWidth / 2, 138, { align: 'center' });
  doc.text(`on ${data.opportunityDate} at ${data.location}`, pageWidth / 2, 148, { align: 'center' });

  // Certificate number and issue date
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Certificate No: ${data.certificateNumber}`, 25, pageHeight - 25);
  doc.text(`Issued: ${data.issuedAt}`, pageWidth - 25, pageHeight - 25, { align: 'right' });

  // Signature line
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 40, pageHeight - 35, pageWidth / 2 + 40, pageHeight - 35);
  doc.setFontSize(10);
  doc.text('Authorized Signature', pageWidth / 2, pageHeight - 28, { align: 'center' });

  // Save the PDF
  doc.save(`certificate-${data.certificateNumber}.pdf`);
}
