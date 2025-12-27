import jsPDF from 'jspdf';
import JSZip from 'jszip';
import logoImage from '@/assets/logo.png';

interface CertificateData {
  volunteerName: string;
  opportunityTitle: string;
  hours: number;
  certificateNumber: string;
  issuedAt: string;
  opportunityDate: string;
  location: string;
}

// Convert image to base64
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

// Generate PDF as ArrayBuffer (for ZIP)
async function generateCertificatePDFBuffer(data: CertificateData, design: 'classic' | 'modern'): Promise<ArrayBuffer> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (design === 'modern') {
    // Modern design
    const deepGreen = [16, 78, 58];
    const brightGreen = [34, 197, 94];
    const gold = [234, 179, 8];
    const slate = [51, 65, 85];
    const white = [255, 255, 255];

    // Gradient background
    for (let i = 0; i < pageHeight; i += 2) {
      const ratio = i / pageHeight;
      const r = Math.floor(deepGreen[0] + (255 - deepGreen[0]) * ratio * 0.3);
      const g = Math.floor(deepGreen[1] + (255 - deepGreen[1]) * ratio * 0.3);
      const b = Math.floor(deepGreen[2] + (255 - deepGreen[2]) * ratio * 0.3);
      doc.setFillColor(r, g, b);
      doc.rect(0, i, pageWidth, 2, 'F');
    }

    // Main card
    const cardMargin = 20;
    const cardWidth = pageWidth - cardMargin * 2;
    const cardHeight = pageHeight - cardMargin * 2;
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardMargin, cardMargin, cardWidth, cardHeight, 8, 8, 'F');

    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(2);
    doc.roundedRect(cardMargin + 5, cardMargin + 5, cardWidth - 10, cardHeight - 10, 6, 6, 'S');

    // Corner decorations
    const cornerSize = 25;
    const corners = [
      { x: cardMargin + 10, y: cardMargin + 10 },
      { x: pageWidth - cardMargin - 10, y: cardMargin + 10 },
      { x: cardMargin + 10, y: pageHeight - cardMargin - 10 },
      { x: pageWidth - cardMargin - 10, y: pageHeight - cardMargin - 10 },
    ];

    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(1.5);
    
    doc.line(corners[0].x, corners[0].y, corners[0].x + cornerSize, corners[0].y);
    doc.line(corners[0].x, corners[0].y, corners[0].x, corners[0].y + cornerSize);
    doc.line(corners[1].x, corners[1].y, corners[1].x - cornerSize, corners[1].y);
    doc.line(corners[1].x, corners[1].y, corners[1].x, corners[1].y + cornerSize);
    doc.line(corners[2].x, corners[2].y, corners[2].x + cornerSize, corners[2].y);
    doc.line(corners[2].x, corners[2].y, corners[2].x, corners[2].y - cornerSize);
    doc.line(corners[3].x, corners[3].y, corners[3].x - cornerSize, corners[3].y);
    doc.line(corners[3].x, corners[3].y, corners[3].x, corners[3].y - cornerSize);

    try {
      const logoBase64 = await getLogoBase64();
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 16, 29, 32, 32);
    } catch (error) {
      console.error('Could not load logo:', error);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.text('COMMUNITY SERVICE & DEVELOPMENT CENTER', pageWidth / 2, 68, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text('University of Jordan', pageWidth / 2, 74, { align: 'center' });

    doc.setFillColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.roundedRect(pageWidth / 2 - 70, 82, 140, 22, 3, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(white[0], white[1], white[2]);
    doc.text('CERTIFICATE OF APPRECIATION', pageWidth / 2, 96, { align: 'center' });

    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - 80, 108, pageWidth / 2 + 80, 108);
    
    doc.setFillColor(gold[0], gold[1], gold[2]);
    [pageWidth / 2 - 80, pageWidth / 2, pageWidth / 2 + 80].forEach(x => {
      doc.circle(x, 108, 2, 'F');
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text('This certificate is proudly presented to', pageWidth / 2, 118, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.text(data.volunteerName, pageWidth / 2, 132, { align: 'center' });
    
    const nameWidth = doc.getTextWidth(data.volunteerName);
    doc.setDrawColor(brightGreen[0], brightGreen[1], brightGreen[2]);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 2 - nameWidth / 2, 135, pageWidth / 2 + nameWidth / 2, 135);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text('for outstanding dedication and exceptional volunteer service in', pageWidth / 2, 146, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.text(data.opportunityTitle, pageWidth / 2, 156, { align: 'center' });

    doc.setFillColor(brightGreen[0], brightGreen[1], brightGreen[2]);
    doc.roundedRect(pageWidth / 2 - 32, 161, 64, 12, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(white[0], white[1], white[2]);
    doc.text(`${data.hours} VOLUNTEER HOURS`, pageWidth / 2, 169, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(`Date: ${data.opportunityDate}  |  Location: ${data.location}`, pageWidth / 2, 180, { align: 'center' });

    const sigY = pageHeight - 42;
    
    doc.setDrawColor(slate[0], slate[1], slate[2]);
    doc.setLineWidth(0.5);
    doc.line(50, sigY, 115, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text('Director Signature', 82.5, sigY + 5, { align: 'center' });

    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(2);
    doc.circle(pageWidth / 2, sigY - 5, 14, 'S');
    doc.setDrawColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.setLineWidth(1);
    doc.circle(pageWidth / 2, sigY - 5, 10, 'S');
    doc.setFillColor(gold[0], gold[1], gold[2]);
    doc.circle(pageWidth / 2, sigY - 5, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.text('VERIFIED', pageWidth / 2, sigY + 3, { align: 'center' });

    doc.setDrawColor(slate[0], slate[1], slate[2]);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 115, sigY, pageWidth - 50, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Official Stamp', pageWidth - 82.5, sigY + 5, { align: 'center' });

    doc.setFillColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.roundedRect(cardMargin + 10, pageHeight - 30, cardWidth - 20, 12, 2, 2, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(white[0], white[1], white[2]);
    doc.text(`Certificate No: ${data.certificateNumber}`, cardMargin + 20, pageHeight - 22);
    doc.text(`Issued: ${data.issuedAt}`, pageWidth - cardMargin - 20, pageHeight - 22, { align: 'right' });
    doc.text('This certificate validates genuine volunteer service', pageWidth / 2, pageHeight - 22, { align: 'center' });

  } else {
    // Classic design
    const primaryGreen = [0, 100, 60];
    const accentRed = [180, 40, 40];
    const goldAccent = [180, 140, 60];
    const darkSlate = [30, 41, 59];

    doc.setFillColor(253, 251, 245);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.setLineWidth(4);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');

    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(1);
    doc.rect(14, 14, pageWidth - 28, pageHeight - 28, 'S');

    doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.setLineWidth(0.5);
    doc.rect(18, 18, pageWidth - 36, pageHeight - 36, 'S');

    try {
      const logoBase64 = await getLogoBase64();
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 15, 25, 30, 30);
    } catch (error) {
      console.error('Could not load logo:', error);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.text('COMMUNITY SERVICE & DEVELOPMENT CENTER', pageWidth / 2, 62, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('University of Jordan', pageWidth / 2, 68, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(38);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('CERTIFICATE', pageWidth / 2, 85, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.text('OF VOLUNTEER SERVICE', pageWidth / 2, 95, { align: 'center' });

    doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 70, 100, pageWidth / 2 + 70, 100);

    doc.setFont('times', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('This is to certify that', pageWidth / 2, 115, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
    doc.text(data.volunteerName, pageWidth / 2, 130, { align: 'center' });

    const nameWidth = doc.getTextWidth(data.volunteerName);
    doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - nameWidth / 2 - 5, 134, pageWidth / 2 + nameWidth / 2 + 5, 134);

    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('has successfully completed volunteer service for', pageWidth / 2, 148, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(data.opportunityTitle, pageWidth / 2, 160, { align: 'center' });

    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.roundedRect(pageWidth / 2 - 30, 166, 60, 12, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${data.hours} VOLUNTEER HOURS`, pageWidth / 2, 174, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${data.opportunityDate}  |  Location: ${data.location}`, pageWidth / 2, 188, { align: 'center' });

    const sigY = pageHeight - 42;
    
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(50, sigY, 110, sigY);
    doc.setFontSize(9);
    doc.text('Director Signature', 80, sigY + 6, { align: 'center' });

    doc.line(pageWidth - 110, sigY, pageWidth - 50, sigY);
    doc.text('Center Stamp', pageWidth - 80, sigY + 6, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`Certificate No: ${data.certificateNumber}`, 25, pageHeight - 20);
    doc.text(`Issued: ${data.issuedAt}`, pageWidth - 25, pageHeight - 20, { align: 'right' });

    doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.setLineWidth(1);
    doc.circle(pageWidth - 80, sigY - 8, 12, 'S');
    doc.setFontSize(6);
    doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.text('OFFICIAL', pageWidth - 80, sigY - 8, { align: 'center' });
  }

  return doc.output('arraybuffer');
}

export async function generateCertificatesZip(
  certificates: CertificateData[],
  design: 'classic' | 'modern',
  opportunityTitle: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const total = certificates.length;

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];
    const pdfBuffer = await generateCertificatePDFBuffer(cert, design);
    const safeName = cert.volunteerName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').trim();
    zip.file(`${safeName}-${cert.certificateNumber}.pdf`, pdfBuffer);
    
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const safeTitle = opportunityTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').trim();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certificates-${safeTitle}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
