import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_FORMATS } from '../../types';
import type { Book } from '../../types';
import { usePagination } from './usePagination';
import { PageSheet } from './PageSheet';

interface Props {
  book: Book;
  onClose: () => void;
  onPrint: () => void;
}

export const PrintPreview: React.FC<Props> = ({ book, onClose, onPrint }) => {
  const [zoom, setZoom] = useState(75);
  const [currentPage, setCurrentPage] = useState(0);
  const pages = usePagination(book);
  const loading = pages.length === 0;
  const fmt = PAGE_FORMATS[book.printSettings.format];

  const scaledHeight = Math.round(fmt.heightPx * zoom / 100) + 32;
  const scaledWidth = Math.round(fmt.widthPx * zoom / 100) + 64;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-white font-semibold text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>
            Pré-visualização — {book.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(z => Math.max(30, z - 10))}
              className="p-1.5 rounded text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-gray-300 w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(150, z + 10))}
              className="p-1.5 rounded text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span>{currentPage + 1} / {pages.length}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
              disabled={currentPage >= pages.length - 1}
              className="p-1 rounded hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
          >
            <Printer size={15} />
            Imprimir
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-gray-700 flex items-start justify-center py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-sm">Calculando páginas…</span>
          </div>
        ) : (
          <div
            style={{
              width: scaledWidth,
              height: scaledHeight,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            {pages[currentPage] && (
              <PageSheet
                page={pages[currentPage]}
                book={book}
                totalPages={pages.length}
                zoom={zoom}
              />
            )}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 px-4 py-3 bg-gray-800 border-t border-gray-700 overflow-x-auto flex-shrink-0">
        {pages.map((page, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`flex-shrink-0 border-2 rounded transition-colors ${i === currentPage ? 'border-amber-500' : 'border-gray-600 hover:border-gray-400'}`}
            style={{ width: 60, height: 84, background: 'white', overflow: 'hidden', position: 'relative' }}
          >
            <div style={{ transform: 'scale(0.075)', transformOrigin: 'top left', width: '1333%', height: '1333%', pointerEvents: 'none' }}>
              <PageSheet page={page} book={book} totalPages={pages.length} zoom={100} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5">
              {page.pageNumber}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
