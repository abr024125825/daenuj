import jsPDF from 'jspdf';

interface CertificateData {
  volunteerName: string;
  opportunityTitle: string;
  hours: number;
  certificateNumber: string;
  issuedAt: string;
  opportunityDate: string;
  location: string;
  logoBase64?: string;
}

export function generateCertificatePDF(data: CertificateData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors based on the logo (Green, Red, Black theme)
  const primaryGreen = [0, 128, 0];
  const accentRed = [200, 40, 40];
  const goldAccent = [218, 165, 32];
  const darkSlate = [30, 41, 59];

  // Gradient-like background with multiple layers
  doc.setFillColor(252, 252, 253);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top decorative band
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 12, 'F');
  
  // Bottom decorative band
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

  // Main border frame
  doc.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.setLineWidth(3);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

  // Inner decorative border
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(1);
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40, 'S');

  // Corner decorations - Top Left
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.triangle(15, 15, 40, 15, 15, 40, 'F');
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.triangle(15, 15, 30, 15, 15, 30, 'F');

  // Corner decorations - Top Right
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.triangle(pageWidth - 15, 15, pageWidth - 40, 15, pageWidth - 15, 40, 'F');
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.triangle(pageWidth - 15, 15, pageWidth - 30, 15, pageWidth - 15, 30, 'F');

  // Corner decorations - Bottom Left
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.triangle(15, pageHeight - 15, 40, pageHeight - 15, 15, pageHeight - 40, 'F');
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.triangle(15, pageHeight - 15, 30, pageHeight - 15, 15, pageHeight - 30, 'F');

  // Corner decorations - Bottom Right
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.triangle(pageWidth - 15, pageHeight - 15, pageWidth - 40, pageHeight - 15, pageWidth - 15, pageHeight - 40, 'F');
  doc.setFillColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.triangle(pageWidth - 15, pageHeight - 15, pageWidth - 30, pageHeight - 15, pageWidth - 15, pageHeight - 30, 'F');

  // Organization name with Arabic
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('Volunteer Center', pageWidth / 2, 35, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('مركز التطوع', pageWidth / 2, 43, { align: 'center' });

  // Main title with shadow effect
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(220, 220, 220);
  doc.text('CERTIFICATE', pageWidth / 2 + 1, 62, { align: 'center' });
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('CERTIFICATE', pageWidth / 2, 61, { align: 'center' });

  doc.setFontSize(20);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('OF VOLUNTEERING', pageWidth / 2, 74, { align: 'center' });

  // Decorative line with diamond
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 80, 82, pageWidth / 2 - 8, 82);
  doc.line(pageWidth / 2 + 8, 82, pageWidth / 2 + 80, 82);
  
  // Diamond shape
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  const diamondX = pageWidth / 2;
  const diamondY = 82;
  doc.triangle(diamondX - 6, diamondY, diamondX, diamondY - 4, diamondX, diamondY + 4, 'F');
  doc.triangle(diamondX + 6, diamondY, diamondX, diamondY - 4, diamondX, diamondY + 4, 'F');

  // "This is to certify that"
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('This is to certify that', pageWidth / 2, 96, { align: 'center' });

  // Volunteer name with elegant styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
  doc.text(data.volunteerName, pageWidth / 2, 112, { align: 'center' });

  // Decorative underline for name
  const nameWidth = doc.getTextWidth(data.volunteerName);
  doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - nameWidth / 2 - 10, 117, pageWidth / 2 + nameWidth / 2 + 10, 117);

  // "has successfully completed"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139);
  doc.text('has successfully completed volunteer service for', pageWidth / 2, 130, { align: 'center' });

  // Opportunity title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(data.opportunityTitle, pageWidth / 2, 145, { align: 'center' });

  // Hours badge
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.roundedRect(pageWidth / 2 - 35, 152, 70, 16, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.hours} Hours of Service`, pageWidth / 2, 162, { align: 'center' });

  // Date and location
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${data.opportunityDate}  •  Location: ${data.location}`, pageWidth / 2, 178, { align: 'center' });

  // Signature section
  const sigY = pageHeight - 50;
  
  // Signature line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, sigY, pageWidth / 2 + 50, sigY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signature', pageWidth / 2, sigY + 8, { align: 'center' });

  // Certificate number and issue date
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Certificate No: ${data.certificateNumber}`, 30, pageHeight - 25);
  doc.text(`Issued: ${data.issuedAt}`, pageWidth - 30, pageHeight - 25, { align: 'right' });

  // QR Code placeholder area (for future enhancement)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageWidth - 55, pageHeight - 55, 25, 25, 2, 2, 'S');
  doc.setFontSize(6);
  doc.text('Verify', pageWidth - 42.5, pageHeight - 28, { align: 'center' });

  // Save the PDF
  doc.save(`certificate-${data.certificateNumber}.pdf`);
}
