export type PageFormat = '14x21' | '16x23' | '17x24' | '21x28' | 'A4';
export type PaperType = 'offset' | 'polen' | 'natural';

export interface PageFormatSpec {
  label: string;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
}

export const PAGE_FORMATS: Record<PageFormat, PageFormatSpec> = {
  '14x21':  { label: '14×21 cm', widthMm: 140, heightMm: 210, widthPx: 529,  heightPx: 794  },
  '16x23':  { label: '16×23 cm', widthMm: 160, heightMm: 230, widthPx: 605,  heightPx: 870  },
  '17x24':  { label: '17×24 cm', widthMm: 170, heightMm: 240, widthPx: 643,  heightPx: 907  },
  '21x28':  { label: '21×28 cm', widthMm: 210, heightMm: 280, widthPx: 794,  heightPx: 1058 },
  'A4':     { label: 'A4 (21×29.7)', widthMm: 210, heightMm: 297, widthPx: 794, heightPx: 1123 },
};

export const PAPER_COLORS: Record<PaperType, { bg: string; label: string }> = {
  offset:  { bg: '#ffffff', label: 'Couchê/Offset (branco)' },
  polen:   { bg: '#f7f2e8', label: 'Pólen Soft (creme)' },
  natural: { bg: '#f2ead8', label: 'Natural (amarelado)' },
};

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface HeaderFooterConfig {
  left: string;
  center: string;
  right: string;
  enabled: boolean;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
}

export interface PrintSettings {
  format: PageFormat;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  /** Margens espelhadas: left/right viram interno/externo alternados por página */
  mirrorMargins: boolean;
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig;
  /** Cabeçalho/Rodapé diferente para páginas pares */
  headerEven: HeaderFooterConfig;
  footerEven: HeaderFooterConfig;
  useEvenOddHeaders: boolean;
  showPageNumbers: boolean;
  startPageNumber: number;
  autoPageBreak: boolean;
  /** Cada capítulo começa numa página ímpar (direita); insere página em branco se necessário */
  chapterStartsOnOddPage: boolean;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  firstLineIndent: boolean;
  dropCap: boolean;
  columnCount: 1 | 2;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  charCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AgeRating = 'Livre' | '10+' | '12+' | '14+' | '16+' | '18+';

export interface BookPromotion {
  id: string;
  startDate: string;
  endDate: string;
  price: number;
}

export interface BookMetadata {
  edition?: string;
  isbn?: string;
  listPrice?: number;
  publicationDate?: string;
  keywords?: string[];
  ageRating?: AgeRating;
  salesChannels?: string[];
  promotions?: BookPromotion[];
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  genre?: string;
  description?: string;
  coverColor: string;
  coverEmoji: string;
  paperType: PaperType;
  /** Idiomas do livro — usados para revisão IA. Ex: ['Português', 'Inglês'] */
  languages: string[];
  chapters: Chapter[];
  printSettings: PrintSettings;
  status: 'draft' | 'review' | 'published';
  metadata?: BookMetadata;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_HF: HeaderFooterConfig = {
  left: '', center: '', right: '', enabled: false, fontSize: 10, fontStyle: 'normal',
};

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  format: 'A4',
  orientation: 'portrait',
  margins: { top: 72, bottom: 72, left: 90, right: 72 },
  mirrorMargins: false,
  header: { left: '{{author}}', center: '', right: '{{bookTitle}}', enabled: true, fontSize: 10, fontStyle: 'italic' },
  footer: { left: '', center: '{{page}}', right: '', enabled: true, fontSize: 10, fontStyle: 'normal' },
  headerEven: { ...DEFAULT_HF, enabled: true, left: '{{bookTitle}}', right: '{{author}}', fontStyle: 'italic', fontSize: 10 },
  footerEven: { ...DEFAULT_HF, enabled: true, center: '{{page}}', fontSize: 10 },
  useEvenOddHeaders: false,
  showPageNumbers: true,
  startPageNumber: 1,
  autoPageBreak: true,
  chapterStartsOnOddPage: false,
  fontFamily: 'Lora',
  fontSize: 12,
  lineHeight: 1.8,
  paragraphSpacing: 0.8,
  firstLineIndent: true,
  dropCap: false,
  columnCount: 1,
};
