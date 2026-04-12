import { useState, useEffect } from 'react';
import type { Book, Chapter } from '../../types';
import { getPageDimensions } from '../../utils/pageCalculator';

export interface PageData {
  pageNumber: number;
  chapter: Chapter;
  htmlSlice: string;
}

/**
 * Splits book chapters into pages using real DOM measurement.
 * A hidden div with the actual print styles is used to measure element heights,
 * so tables, images, and complex blocks produce correct page splits.
 */
export function usePagination(book: Book): PageData[] {
  const [pages, setPages] = useState<PageData[]>([]);

  useEffect(() => {
    const { contentHeight, contentWidth } = getPageDimensions(book.printSettings);
    const ps = book.printSettings;

    const measurer = document.createElement('div');
    // Add ProseMirror class so editor.css table/list styles apply during measurement
    measurer.className = 'ProseMirror';
    measurer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${contentWidth}px;
      font-family: ${ps.fontFamily}, Georgia, serif;
      font-size: ${ps.fontSize}pt;
      line-height: ${ps.lineHeight};
      visibility: hidden;
      pointer-events: none;
    `;
    document.body.appendChild(measurer);

    const result: PageData[] = [];
    let pageNumber = ps.startPageNumber;

    const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);

    for (const chapter of sortedChapters) {
      measurer.innerHTML = chapter.content;

      if (measurer.children.length === 0) {
        result.push({ pageNumber, chapter, htmlSlice: chapter.content });
        pageNumber++;
        continue;
      }

      let currentPageHtml = '';
      let currentH = 0;

      for (const child of Array.from(measurer.children)) {
        const el = child as HTMLElement;

        // Explicit page break node
        if (el.getAttribute('data-type') === 'page-break') {
          if (currentPageHtml) {
            result.push({ pageNumber, chapter, htmlSlice: currentPageHtml });
            pageNumber++;
          }
          currentPageHtml = '';
          currentH = 0;
          continue;
        }

        const h = el.getBoundingClientRect().height || 20;

        if (currentH + h > contentHeight && currentPageHtml) {
          result.push({ pageNumber, chapter, htmlSlice: currentPageHtml });
          pageNumber++;
          currentPageHtml = el.outerHTML;
          currentH = h;
        } else {
          currentPageHtml += el.outerHTML;
          currentH += h;
        }
      }

      if (currentPageHtml) {
        result.push({ pageNumber, chapter, htmlSlice: currentPageHtml });
        pageNumber++;
      }
    }

    document.body.removeChild(measurer);
    setPages(result);
  }, [book]);

  return pages;
}
