import React from 'react';
import { PAGE_FORMATS } from '../../types';
import type { Book } from '../../types';
import type { PageData } from './usePagination';
import { parseTemplate } from '../../utils/templateParser';

interface Props {
  page: PageData;
  book: Book;
  totalPages: number;
  zoom?: number;
  isPrintView?: boolean;
}

export const PageSheet: React.FC<Props> = ({ page, book, totalPages, zoom = 100, isPrintView = false }) => {
  const { printSettings } = book;
  const fmt = PAGE_FORMATS[printSettings.format];
  const { margins, header, footer } = printSettings;

  const scale = zoom / 100;
  const width = fmt.widthPx;
  const height = fmt.heightPx;

  const headerText = {
    left: parseTemplate(header.left, book, page.chapter, page.pageNumber, totalPages),
    center: parseTemplate(header.center, book, page.chapter, page.pageNumber, totalPages),
    right: parseTemplate(header.right, book, page.chapter, page.pageNumber, totalPages),
  };
  const footerText = {
    left: parseTemplate(footer.left, book, page.chapter, page.pageNumber, totalPages),
    center: parseTemplate(footer.center, book, page.chapter, page.pageNumber, totalPages),
    right: parseTemplate(footer.right, book, page.chapter, page.pageNumber, totalPages),
  };

  const headerFooterStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 10,
    color: '#666',
    height: 36,
    flexShrink: 0,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    fontFamily: `${printSettings.fontFamily}, Georgia, serif`,
    fontSize: printSettings.fontSize,
    lineHeight: printSettings.lineHeight,
    color: '#1a140e',
    textAlign: printSettings.firstLineIndent ? 'justify' : 'left',
    columnCount: printSettings.columnCount,
    columnGap: printSettings.columnCount > 1 ? 24 : undefined,
  };

  const sheetStyle: React.CSSProperties = {
    width,
    height,
    background: 'white',
    boxSizing: 'border-box',
    paddingTop: margins.top,
    paddingBottom: margins.bottom,
    paddingLeft: margins.left,
    paddingRight: margins.right,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flexShrink: 0,
  };

  if (!isPrintView) {
    sheetStyle.transform = `scale(${scale})`;
    sheetStyle.transformOrigin = 'top center';
    sheetStyle.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    sheetStyle.borderRadius = 4;
  }

  return (
    <div style={sheetStyle} className="page-sheet">
      {/* Header */}
      {header.enabled && (
        <div style={{
          ...headerFooterStyle,
          fontStyle: header.fontStyle,
          fontSize: header.fontSize,
          borderBottom: '1px solid #ddd',
          marginBottom: 8,
          paddingBottom: 4,
        }}>
          <span>{headerText.left}</span>
          <span>{headerText.center}</span>
          <span>{headerText.right}</span>
        </div>
      )}

      {/* Content */}
      <div
        style={contentStyle}
        className={`print-content ${printSettings.firstLineIndent ? 'first-line-indent' : ''} ${printSettings.dropCap ? 'drop-cap' : ''}`}
        dangerouslySetInnerHTML={{ __html: page.htmlSlice }}
      />

      {/* Footer */}
      {footer.enabled && (
        <div style={{
          ...headerFooterStyle,
          fontStyle: footer.fontStyle,
          fontSize: footer.fontSize,
          borderTop: '1px solid #ddd',
          marginTop: 8,
          paddingTop: 4,
        }}>
          <span>{footerText.left}</span>
          <span>{footerText.center}</span>
          <span>{footerText.right}</span>
        </div>
      )}
    </div>
  );
};
