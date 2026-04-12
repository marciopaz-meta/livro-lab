import { PAGE_FORMATS } from '../types';
import type { PrintSettings } from '../types';

export function getPageDimensions(settings: PrintSettings) {
  const fmt = PAGE_FORMATS[settings.format];
  const { widthPx, heightPx } = fmt;
  const { margins } = settings;
  const headerH = settings.header.enabled ? 40 : 0;
  const footerH = settings.footer.enabled ? 40 : 0;
  const contentWidth = widthPx - margins.left - margins.right;
  const contentHeight = heightPx - margins.top - margins.bottom - headerH - footerH;
  return { pageWidth: widthPx, pageHeight: heightPx, contentWidth, contentHeight, headerH, footerH };
}

export function mmToPx(mm: number): number {
  return Math.round((mm / 25.4) * 96);
}

export function pxToMm(px: number): number {
  return Math.round((px / 96) * 25.4);
}
