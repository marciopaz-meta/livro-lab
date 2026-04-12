import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookStore } from '../store/useBookStore';
import { useEditorSettingsStore } from '../store/useEditorSettingsStore';
import { RichEditor } from '../components/editor/RichEditor';
import { ChapterPanel } from '../components/chapters/ChapterPanel';
import { useToast } from '../components/ui/Toast';
import { usePdfExport } from '../hooks/usePdfExport';
import type { Chapter } from '../types';

export const EditorPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books, updateChapterContent, createChapter } = useBookStore();
  const {
    zoom, setZoom,
    activeChapterId, setActiveChapter,
  } = useEditorSettingsStore();
  const { showToast } = useToast();
  const { exportPdf } = usePdfExport();

  const book = books.find(b => b.id === bookId);

  useEffect(() => {
    if (!book) { navigate('/books'); return; }
    if (!activeChapterId && book.chapters.length > 0) {
      setActiveChapter(book.chapters[0].id);
    }
  }, [book?.id]);

  const chapter: Chapter | undefined = book?.chapters.find(c => c.id === activeChapterId)
    ?? book?.chapters[0];

  const handleSave = useCallback((html: string) => {
    if (!book || !chapter) return;
    updateChapterContent(book.id, chapter.id, html);
  }, [book?.id, chapter?.id]);

  const handleExportPdf = async () => {
    if (!book) return;
    try {
      await exportPdf(book);
      showToast('PDF exportado com sucesso!', 'success');
    } catch {
      showToast('Erro ao exportar PDF.', 'error');
    }
  };

  const handlePublishUmLivro = () => {
    showToast('Publicação na UmLivro em breve!', 'success');
  };

  const handlePublishEpub = () => {
    showToast('Publicação EPub em breve!', 'success');
  };

  // Screen size guard (hooks must be called before early returns for rules-of-hooks)
  const [tooSmall, setTooSmall] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setTooSmall(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  if (!book) return null;

  if (tooSmall) return (
    <div className="flex-1 flex items-center justify-center p-8 text-center" style={{ background: 'var(--bg)' }}>
      <div>
        <p className="text-2xl mb-2">📱</p>
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Tela muito pequena</h2>
        <p className="text-gray-600 text-sm">O editor requer uma tela de pelo menos 1024px de largura.</p>
      </div>
    </div>
  );

  if (!chapter) return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <p className="mb-4">Nenhum capítulo encontrado.</p>
        <button
          onClick={() => createChapter(book.id, 'Capítulo 1')}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
        >
          Criar capítulo
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Chapter Panel */}
      <ChapterPanel
        book={book}
        activeChapterId={chapter.id}
        onSelectChapter={setActiveChapter}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <RichEditor
          book={book}
          chapter={chapter}
          onSave={handleSave}
          zoom={zoom}
          onZoomChange={setZoom}
          onExportPdf={handleExportPdf}
          onPublishUmLivro={handlePublishUmLivro}
          onPublishEpub={handlePublishEpub}
        />
      </div>
    </div>
  );
};
