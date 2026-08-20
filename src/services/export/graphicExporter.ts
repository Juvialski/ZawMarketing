import * as htmlToImage from 'html-to-image';
import { saveAs } from 'file-saver';

export class GraphicExporter {
  public static async exportToPng(
    elementOrId: HTMLElement | string,
    filename: string,
    pixelRatio = 2
  ): Promise<Blob> {
    const element =
      typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;

    if (!element) {
      throw new Error(`Element not found for export: ${elementOrId}`);
    }

    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio,
      cacheBust: true,
      skipAutoScale: true,
      backgroundColor: '#ffffff',
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    saveAs(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
    return blob;
  }

  public static async exportToBlob(
    elementOrId: HTMLElement | string,
    pixelRatio = 2
  ): Promise<Blob> {
    const element =
      typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;

    if (!element) {
      throw new Error(`Element not found for export: ${elementOrId}`);
    }

    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio,
      cacheBust: true,
      skipAutoScale: true,
      backgroundColor: '#ffffff',
    });

    const res = await fetch(dataUrl);
    return res.blob();
  }
}
