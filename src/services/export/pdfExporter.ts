import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { saveAs } from 'file-saver';

export class PdfExporter {
  public static async exportElementToPdf(
    elementOrId: HTMLElement | string,
    filename: string,
    format: 'letter' | 'a4' = 'letter'
  ): Promise<Blob> {
    const element =
      typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;

    if (!element) {
      throw new Error(`Element not found for PDF export: ${elementOrId}`);
    }

    // Capture element as high-res PNG image
    const imgData = await htmlToImage.toPng(element, {
      pixelRatio: 2.5,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: format === 'letter' ? [8.5, 11] : 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    const pdfBlob = pdf.output('blob');

    saveAs(pdfBlob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return pdfBlob;
  }

  public static async generatePdfBlob(
    elementOrId: HTMLElement | string,
    format: 'letter' | 'a4' = 'letter'
  ): Promise<Blob> {
    const element =
      typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;

    if (!element) {
      throw new Error(`Element not found for PDF generation: ${elementOrId}`);
    }

    const imgData = await htmlToImage.toPng(element, {
      pixelRatio: 2.5,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: format === 'letter' ? [8.5, 11] : 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    return pdf.output('blob');
  }
}
