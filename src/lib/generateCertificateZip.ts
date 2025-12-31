import jsPDF from 'jspdf';
import JSZip from 'jszip';
import logoImage from '@/assets/logo.png';
import JsBarcode from 'jsbarcode';

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

// Generate Barcode as base64
function generateBarcodeBase64(certificateNumber: string): string {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, certificateNumber, {
    format: 'CODE128',
    width: 2,
    height: 40,
    displayValue: false,
    margin: 5,
  });
  return canvas.toDataURL('image/png');
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
    const cardMargin = 18;
    const cardWidth = pageWidth - cardMargin * 2;
    const cardHeight = pageHeight - cardMargin * 2 - 14;
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardMargin, cardMargin, cardWidth, cardHeight, 8, 8, 'F');

    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(2);
    doc.roundedRect(cardMargin + 5, cardMargin + 5, cardWidth - 10, cardHeight - 10, 6, 6, 'S');

    // Corner decorations
    const cornerSize = 20;
    const corners = [
      { x: cardMargin + 10, y: cardMargin + 10 },
      { x: pageWidth - cardMargin - 10, y: cardMargin + 10 },
      { x: cardMargin + 10, y: cardMargin + cardHeight - 10 },
      { x: pageWidth - cardMargin - 10, y: cardMargin + cardHeight - 10 },
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
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 12, 24, 24, 24);
    } catch (error) {
      console.error('Could not load logo:', error);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.text('COMMUNITY SERVICE & DEVELOPMENT CENTER', pageWidth / 2, 53, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text('University of Jordan', pageWidth / 2, 59, { align: 'center' });

    doc.setFillColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.roundedRect(pageWidth / 2 - 60, 64, 120, 14, 3, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(white[0], white[1], white[2]);
    doc.text('CERTIFICATE OF APPRECIATION', pageWidth / 2, 73, { align: 'center' });

    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - 70, 82, pageWidth / 2 + 70, 82);
    
    doc.setFillColor(gold[0], gold[1], gold[2]);
    [pageWidth / 2 - 70, pageWidth / 2, pageWidth / 2 + 70].forEach(x => {
      doc.circle(x, 82, 1.5, 'F');
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text('This certificate is proudly presented to', pageWidth / 2, 91, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.text(data.volunteerName, pageWidth / 2, 102, { align: 'center' });
    
    const nameWidth = doc.getTextWidth(data.volunteerName);
    doc.setDrawColor(brightGreen[0], brightGreen[1], brightGreen[2]);
    doc.setLineWidth(1.2);
    doc.line(pageWidth / 2 - nameWidth / 2, 105, pageWidth / 2 + nameWidth / 2, 105);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text('for outstanding dedication and exceptional volunteer service in', pageWidth / 2, 114, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.text(data.opportunityTitle, pageWidth / 2, 123, { align: 'center' });

    // Details grid
    const detailsY = 132;
    const cardSpacing = 55;
    const detailCards = [
      { label: 'Service Date', value: data.opportunityDate },
      { label: 'Location', value: data.location },
      { label: 'Hours', value: `${data.hours} Hours` },
      { label: 'Issued', value: data.issuedAt },
    ];

    const startX = pageWidth / 2 - (cardSpacing * 1.5);
    detailCards.forEach((card, index) => {
      const x = startX + (index * cardSpacing);
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x - 22, detailsY - 4, 44, 16, 2, 2, 'F');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text(card.label, x, detailsY, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(deepGreen[0], deepGreen[1], deepGreen[2]);
      doc.text(card.value, x, detailsY + 7, { align: 'center' });
    });

    // Appreciation message
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text('In recognition of your dedication, commitment, and outstanding service to the community.', pageWidth / 2, 156, { align: 'center' });

    // Barcode
    try {
      const barcodeBase64 = generateBarcodeBase64(data.certificateNumber);
      doc.addImage(barcodeBase64, 'PNG', pageWidth / 2 - 30, cardMargin + cardHeight - 22, 60, 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(slate[0], slate[1], slate[2]);
      doc.text('Scan barcode to verify authenticity', pageWidth / 2, cardMargin + cardHeight - 5, { align: 'center' });
    } catch (error) {
      console.error('Could not generate barcode:', error);
    }

    // Footer
    doc.setFillColor(deepGreen[0], deepGreen[1], deepGreen[2]);
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(white[0], white[1], white[2]);
    doc.text(`Certificate No: ${data.certificateNumber}`, 15, pageHeight - 5);
    doc.text(`Issued: ${data.issuedAt}`, pageWidth - 15, pageHeight - 5, { align: 'right' });
    doc.text('This certificate validates genuine volunteer service', pageWidth / 2, pageHeight - 5, { align: 'center' });

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
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 15, 22, 30, 30);
    } catch (error) {
      console.error('Could not load logo:', error);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.text('COMMUNITY SERVICE & DEVELOPMENT CENTER', pageWidth / 2, 58, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('University of Jordan', pageWidth / 2, 64, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('CERTIFICATE', pageWidth / 2, 80, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.text('OF VOLUNTEER SERVICE', pageWidth / 2, 89, { align: 'center' });

    doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 70, 93, pageWidth / 2 + 70, 93);

    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('This is to certify that', pageWidth / 2, 103, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(accentRed[0], accentRed[1], accentRed[2]);
    doc.text(data.volunteerName, pageWidth / 2, 115, { align: 'center' });

    const nameWidth = doc.getTextWidth(data.volunteerName);
    doc.setDrawColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - nameWidth / 2 - 5, 118, pageWidth / 2 + nameWidth / 2 + 5, 118);

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('has successfully completed volunteer service for', pageWidth / 2, 128, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(data.opportunityTitle, pageWidth / 2, 137, { align: 'center' });

    // Details section
    const leftCol = 60;
    const rightCol = pageWidth - 60;
    const detailsY = 148;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    doc.text('Service Date:', leftCol, detailsY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(` ${data.opportunityDate}`, leftCol + 2, detailsY);

    doc.setFont('helvetica', 'normal');
    doc.text('Location:', leftCol, detailsY + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(` ${data.location}`, leftCol + 2, detailsY + 6);

    doc.setFont('helvetica', 'normal');
    doc.text('Hours Completed:', rightCol - 40, detailsY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.text(` ${data.hours} Hours`, rightCol - 38, detailsY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Issue Date:', rightCol - 40, detailsY + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(` ${data.issuedAt}`, rightCol - 38, detailsY + 6);

    // Appreciation message
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('In recognition of dedication, commitment, and outstanding service to the community.', pageWidth / 2, 165, { align: 'center' });

    // Barcode
    try {
      const barcodeBase64 = generateBarcodeBase64(data.certificateNumber);
      doc.addImage(barcodeBase64, 'PNG', pageWidth / 2 - 35, pageHeight - 45, 70, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('Scan barcode to verify authenticity', pageWidth / 2, pageHeight - 26, { align: 'center' });
    } catch (error) {
      console.error('Could not generate barcode:', error);
    }

    // Footer
    doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`Certificate No: ${data.certificateNumber}`, 15, pageHeight - 5);
    doc.text(`Issued: ${data.issuedAt}`, pageWidth - 15, pageHeight - 5, { align: 'right' });
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
