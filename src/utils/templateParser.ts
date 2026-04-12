import type { Book, Chapter } from '../types';

export function parseTemplate(
  template: string,
  book: Book,
  chapter: Chapter,
  page: number,
  totalPages: number
): string {
  const now = new Date();
  return template
    .replace(/\{\{bookTitle\}\}/g, book.title)
    .replace(/\{\{bookSubtitle\}\}/g, book.subtitle || '')
    .replace(/\{\{author\}\}/g, book.author)
    .replace(/\{\{chapter\}\}/g, chapter.title)
    .replace(/\{\{page\}\}/g, String(page))
    .replace(/\{\{totalPages\}\}/g, String(totalPages))
    .replace(/\{\{date\}\}/g, now.toLocaleDateString('pt-BR'))
    .replace(/\{\{year\}\}/g, String(now.getFullYear()));
}
