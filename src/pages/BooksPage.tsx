import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, BookOpen, Trash2, Copy, PenLine,
  MoreHorizontal, FileText, BarChart2, TrendingUp, Layers, Upload, ChevronDown, Settings,
} from 'lucide-react';
import { useBookStore } from '../store/useBookStore';
import { PAGE_FORMATS, PAPER_COLORS, DEFAULT_PRINT_SETTINGS } from '../types';
import type { Book, PageFormat, PaperType } from '../types';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ContextMenu } from '../components/ui/ContextMenu';
import { useToast } from '../components/ui/Toast';
import { MetadataModal } from '../components/books/MetadataModal';
import { ImportBookModal } from '../components/books/ImportBookModal';
import { BookSettingsModal } from '../components/chapters/ChapterPanel';

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', dot: 'bg-gray-400' },
  review: { label: 'Revisão', dot: 'bg-amber-400' },
  published: { label: 'Publicado', dot: 'bg-green-400' },
};

const COVER_EMOJIS = ['📖', '📚', '✍️', '🌌', '🍳', '🌿', '🔬', '🎭', '🗺️', '💡', '🌊', '🦋'];
const COVER_COLORS = [
  '#1a3a5c', '#5c2d0a', '#1a5c2d', '#5c1a3a', '#2d1a5c', '#5c4a1a',
  '#1a4a5c', '#3a5c1a', '#5c1a1a', '#1a5c5c', '#4a1a5c', '#5c3a1a',
];

interface NewBookForm {
  title: string;
  author: string;
  subtitle: string;
  genre: string;
  description: string;
  coverColor: string;
  coverEmoji: string;
  format: PageFormat;
  paperType: PaperType;
}

// ─── Dropdown menu para cada card ──────────────────────────────────────────
interface CardMenuProps {
  onWrite: () => void;
  onMetadata: () => void;
  onSettings: () => void;
  onImport: () => void;
  onClone: () => void;
  onDelete: () => void;
}

const CardMenu: React.FC<CardMenuProps> = ({ onWrite, onMetadata, onSettings, onImport, onClone, onDelete }) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideBtn = btnRef.current?.contains(t) ?? false;
      const insideDropdown = dropdownRef.current?.contains(t) ?? false;
      if (!insideBtn && !insideDropdown) setPos(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pos]);

  // Fecha ao rolar a página
  useEffect(() => {
    if (!pos) return;
    const handler = () => setPos(null);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [pos]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    const rect = btnRef.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right - 192 }); // 192 = w-48
  };

  const item = (label: string, icon: React.ReactNode, action: () => void, danger = false) => (
    <button
      key={label}
      onClick={e => { e.stopPropagation(); action(); setPos(null); }}
      className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </button>
  );

  return (
    <div onClick={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Ações"
      >
        <MoreHorizontal size={15} />
      </button>
      {pos && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: pos.top, left: Math.max(8, pos.left) }}
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-48"
        >
          {item('Escrever Livro', <PenLine size={14} />, onWrite)}
          {item('Editar Metadados', <FileText size={14} />, onMetadata)}
          {item('Configurações', <Settings size={14} />, onSettings)}
          {item('Importar Conteúdo', <Upload size={14} />, onImport)}
          <div className="my-1 border-t border-gray-100" />
          {item('Clonar', <Copy size={14} />, onClone)}
          {item('Excluir', <Trash2 size={14} />, onDelete, true)}
        </div>,
        document.body,
      )}
    </div>
  );
};

// ─── Página principal ───────────────────────────────────────────────────────
export const BooksPage: React.FC = () => {
  const { books, createBook, deleteBook, duplicateBook, updateBook } = useBookStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'review' | 'published'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const newDropdownRef = useRef<HTMLDivElement>(null);
  const [metadataBook, setMetadataBook] = useState<Book | null>(null);
  const [settingsBook, setSettingsBook] = useState<Book | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; book: Book } | null>(null);
  const [form, setForm] = useState<NewBookForm>({
    title: '',
    author: '',
    subtitle: '',
    genre: '',
    description: '',
    coverColor: COVER_COLORS[0],
    coverEmoji: '📖',
    format: 'A4',
    paperType: 'offset',
  });
  const [formErrors, setFormErrors] = useState<Partial<NewBookForm>>({});

  useEffect(() => {
    if (!showNewDropdown) return;
    const handler = (e: MouseEvent) => {
      if (newDropdownRef.current && !newDropdownRef.current.contains(e.target as Node))
        setShowNewDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewDropdown]);

  const { totalWords, totalChapters, inReview, published, wordsByBookId } = useMemo(() => {
    let tw = 0, tc = 0, rev = 0, pub = 0;
    const wMap = new Map<string, number>();
    for (const b of books) {
      const bw = b.chapters.reduce((s, c) => s + c.wordCount, 0);
      tw += bw;
      tc += b.chapters.length;
      if (b.status === 'review') rev++;
      if (b.status === 'published') pub++;
      wMap.set(b.id, bw);
    }
    return { totalWords: tw, totalChapters: tc, inReview: rev, published: pub, wordsByBookId: wMap };
  }, [books]);

  const stats = useMemo(() => [
    { icon: BookOpen, label: 'Livros', value: books.length, color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Layers, label: 'Capítulos', value: totalChapters, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: BarChart2, label: 'Palavras', value: totalWords.toLocaleString('pt-BR'), color: 'text-green-500', bg: 'bg-green-50' },
    { icon: TrendingUp, label: 'Publicados', value: published, color: 'text-purple-500', bg: 'bg-purple-50' },
  ], [books.length, totalChapters, totalWords, published]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return books.filter(b => {
      const matchSearch = b.title.toLowerCase().includes(q)
        || b.author.toLowerCase().includes(q)
        || (b.metadata?.isbn ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [books, search, statusFilter]);

  const handleCreate = () => {
    const errors: Partial<NewBookForm> = {};
    if (!form.title.trim()) errors.title = 'Título é obrigatório';
    if (!form.author.trim()) errors.author = 'Autor é obrigatório';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    const book = createBook(form.title.trim(), form.author.trim(), {
      subtitle: form.subtitle,
      genre: form.genre,
      description: form.description,
      coverColor: form.coverColor,
      coverEmoji: form.coverEmoji,
      paperType: form.paperType,
      printSettings: { ...DEFAULT_PRINT_SETTINGS, format: form.format },
    });
    setShowNewModal(false);
    setForm({ title: '', author: '', subtitle: '', genre: '', description: '', coverColor: COVER_COLORS[0], coverEmoji: '📖', format: 'A4', paperType: 'offset' });
    setFormErrors({});
    showToast(`Livro "${book.title}" criado com sucesso`, 'success');
    navigate(`/editor/${book.id}`);
  };

  const handleDelete = (book: Book) => {
    deleteBook(book.id);
    showToast(`"${book.title}" excluído`, 'info');
  };

  const handleDuplicate = (book: Book) => {
    const copy = duplicateBook(book.id);
    showToast(`"${copy.title}" criado`, 'success');
  };

  const handleContextMenu = (e: React.MouseEvent, book: Book) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, book });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>Biblioteca</h1>
          <p className="text-sm text-gray-500 mt-0.5">{books.length} {books.length === 1 ? 'livro' : 'livros'} · {inReview} em revisão</p>
        </div>
        <div ref={newDropdownRef} className="relative">
          <div className="flex">
            <Button
              onClick={() => setShowNewModal(true)}
              className="rounded-r-none border-r border-amber-700/30"
            >
              <Plus size={16} />
              Novo Livro
            </Button>
            <Button
              onClick={() => setShowNewDropdown(o => !o)}
              className="rounded-l-none px-2"
              title="Mais opções"
            >
              <ChevronDown size={14} />
            </Button>
          </div>
          {showNewDropdown && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-48">
              <button
                onClick={() => { setShowNewDropdown(false); setShowNewModal(true); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <Plus size={14} /> Criar do zero
              </button>
              <button
                onClick={() => { setShowNewDropdown(false); setShowImportModal(true); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <Upload size={14} /> Importar arquivo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar livros..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'draft', 'review', 'published'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Books grid */}
      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium mb-1">
              {search ? 'Nenhum livro encontrado' : 'Nenhum livro na biblioteca'}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {search ? 'Tente outra busca' : 'Comece criando seu primeiro livro'}
            </p>
            {!search && (
              <div className="flex gap-2">
                <Button onClick={() => setShowNewModal(true)}>
                  <Plus size={15} />
                  Criar Livro
                </Button>
                <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                  <Upload size={15} />
                  Importar
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(book => {
              const status = STATUS_CONFIG[book.status];
              const words = wordsByBookId.get(book.id) ?? 0;
              return (
                <div
                  key={book.id}
                  onContextMenu={e => handleContextMenu(e, book)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  onClick={() => navigate(`/editor/${book.id}`)}
                >
                  {/* Cover */}
                  <div
                    className="h-36 flex items-center justify-center text-5xl relative"
                    style={{ background: book.coverColor }}
                  >
                    {book.coverEmoji}
                  </div>

                  <div className="p-3">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 flex-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {book.title}
                      </h3>
                      {/* "..." menu — sempre visível */}
                      <CardMenu
                        onWrite={() => navigate(`/editor/${book.id}`)}
                        onMetadata={() => setMetadataBook(book)}
                        onSettings={() => setSettingsBook(book)}
                        onImport={() => setShowImportModal(true)}
                        onClone={() => handleDuplicate(book)}
                        onDelete={() => handleDelete(book)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 truncate">{book.author}</p>
                    {book.metadata?.isbn && (
                      <p className="text-[10px] text-gray-400 font-mono truncate mb-1" title={`ISBN: ${book.metadata.isbn}`}>
                        {book.metadata.isbn}
                      </p>
                    )}
                    {!book.metadata?.isbn && <div className="mb-2" />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span className="text-[10px] text-gray-500">{status.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{words.toLocaleString('pt-BR')} pal.</span>
                    </div>
                    {book.genre && (
                      <span className="mt-1.5 inline-block text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        {book.genre}
                      </span>
                    )}
                    {book.metadata?.listPrice != null && (
                      <span className="mt-1 block text-[10px] text-amber-700 font-medium">
                        R$ {book.metadata.listPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context menu (botão direito) */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: 'Escrever Livro',
              icon: <PenLine size={14} />,
              onClick: () => navigate(`/editor/${contextMenu.book.id}`),
            },
            {
              label: 'Editar Metadados',
              icon: <FileText size={14} />,
              onClick: () => setMetadataBook(contextMenu.book),
            },
            {
              label: 'Configurações',
              icon: <Settings size={14} />,
              onClick: () => setSettingsBook(contextMenu.book),
            },
            {
              label: 'Importar Conteúdo',
              icon: <Upload size={14} />,
              onClick: () => setShowImportModal(true),
            },
            {
              label: 'Clonar',
              icon: <Copy size={14} />,
              onClick: () => handleDuplicate(contextMenu.book),
            },
            {
              label: 'Alterar status',
              icon: <BookOpen size={14} />,
              onClick: () => {
                const statuses: Array<'draft' | 'review' | 'published'> = ['draft', 'review', 'published'];
                const next = statuses[(statuses.indexOf(contextMenu.book.status) + 1) % statuses.length];
                updateBook(contextMenu.book.id, { status: next });
                showToast(`Status alterado para "${STATUS_CONFIG[next].label}"`, 'info');
              },
            },
            { label: '', onClick: () => {}, separator: true },
            {
              label: 'Excluir',
              icon: <Trash2 size={14} />,
              onClick: () => handleDelete(contextMenu.book),
              danger: true,
            },
          ]}
        />
      )}

      {/* Modal: Novo Livro */}
      <Modal isOpen={showNewModal} onClose={() => { setShowNewModal(false); setFormErrors({}); }} title="Novo Livro">
        <div className="space-y-4">
          {/* Cover preview */}
          <div className="flex gap-4 items-start">
            <div
              className="w-20 h-28 rounded-lg flex items-center justify-center text-4xl flex-shrink-0 shadow-sm"
              style={{ background: form.coverColor }}
            >
              {form.coverEmoji}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Emoji da capa</p>
                <div className="flex flex-wrap gap-1.5">
                  {COVER_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setForm(f => ({ ...f, coverEmoji: e }))}
                      className={`w-8 h-8 rounded text-lg flex items-center justify-center transition-all ${
                        form.coverEmoji === e ? 'bg-amber-100 ring-2 ring-amber-400' : 'hover:bg-gray-100'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Cor da capa</p>
                <div className="flex flex-wrap gap-1.5">
                  {COVER_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, coverColor: c }))}
                      className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                      style={{ background: c, borderColor: form.coverColor === c ? '#C9903F' : 'transparent' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Input
            label="Título *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            error={formErrors.title}
            placeholder="O título do seu livro"
            autoFocus
          />
          <Input
            label="Autor *"
            value={form.author}
            onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            error={formErrors.author}
            placeholder="Nome do autor"
          />
          <Input
            label="Subtítulo"
            value={form.subtitle}
            onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
            placeholder="Opcional"
          />
          <Input
            label="Gênero"
            value={form.genre}
            onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
            placeholder="Ex.: Ficção Científica, Romance..."
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Uma breve sinopse..."
              rows={3}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Formato do livro</label>
              <select
                value={form.format}
                onChange={e => setForm(f => ({ ...f, format: e.target.value as PageFormat }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                {Object.entries(PAGE_FORMATS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Tipo de papel</label>
              <select
                value={form.paperType}
                onChange={e => setForm(f => ({ ...f, paperType: e.target.value as PaperType }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                {Object.entries(PAPER_COLORS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="flex-1">
              Criar Livro
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Metadados */}
      <MetadataModal
        book={metadataBook}
        onClose={() => setMetadataBook(null)}
      />

      {/* Modal: Configurações */}
      {settingsBook && (
        <BookSettingsModal
          book={settingsBook}
          onClose={() => setSettingsBook(null)}
        />
      )}

      {/* Modal: Importar */}
      <ImportBookModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};
