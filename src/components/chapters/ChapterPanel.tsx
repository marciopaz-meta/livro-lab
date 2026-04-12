import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, BookOpen, Settings, X, ChevronDown, ChevronRight } from 'lucide-react';
import { PAGE_FORMATS, PAPER_COLORS, DEFAULT_PRINT_SETTINGS } from '../../types';
import type { Book, PageFormat, PaperType, PrintSettings, HeaderFooterConfig } from '../../types';
import { ChapterItem } from './ChapterItem';
import { useBookStore } from '../../store/useBookStore';
import { useToast } from '../ui/Toast';

const FORMAT_OPTIONS = Object.entries(PAGE_FORMATS).map(([k, v]) => ({ value: k, label: v.label }));
const PAPER_OPTIONS = Object.entries(PAPER_COLORS).map(([k, v]) => ({ value: k, label: v.label }));

// ── helpers ────────────────────────────────────────────────────────────────
const sel = "w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400";
const inp = "w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400";

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-2 mb-2">
      <button
        className="w-full flex items-center justify-between py-1.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
        onClick={() => setOpen(o => !o)}
      >
        {title}
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-gray-500 w-20 flex-shrink-0">{label}</span>
    <div className="flex-1">{children}</div>
  </div>
);

const HFEditor: React.FC<{
  label: string;
  value: HeaderFooterConfig;
  onChange: (v: HeaderFooterConfig) => void;
}> = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer">
      <input type="checkbox" checked={value.enabled} onChange={e => onChange({ ...value, enabled: e.target.checked })}
        className="rounded border-gray-300 text-amber-600 focus:ring-amber-400 w-3 h-3" />
      Exibir {label}
    </label>
    {value.enabled && (
      <div className="pl-3 border-l-2 border-amber-200 space-y-1.5">
        <div className="grid grid-cols-3 gap-1">
          {(['left','center','right'] as const).map(side => (
            <input key={side} placeholder={side === 'left' ? 'Esq.' : side === 'center' ? 'Centro' : 'Dir.'}
              value={value[side]} onChange={e => onChange({ ...value, [side]: e.target.value })}
              className={inp} />
          ))}
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Variáveis: <code className="bg-gray-100 px-0.5 rounded">{'{{bookTitle}}'}</code>{' '}
          <code className="bg-gray-100 px-0.5 rounded">{'{{author}}'}</code>{' '}
          <code className="bg-gray-100 px-0.5 rounded">{'{{chapter}}'}</code>{' '}
          <code className="bg-gray-100 px-0.5 rounded">{'{{page}}'}</code>{' '}
          <code className="bg-gray-100 px-0.5 rounded">{'{{date}}'}</code>
        </p>
        <Row label="Tamanho (pt)">
          <input type="number" min={6} max={14} value={value.fontSize}
            onChange={e => onChange({ ...value, fontSize: Number(e.target.value) })} className={inp} />
        </Row>
        <Row label="Estilo">
          <select value={value.fontStyle} onChange={e => onChange({ ...value, fontStyle: e.target.value as 'normal' | 'italic' })} className={sel}>
            <option value="normal">Normal</option>
            <option value="italic">Itálico</option>
          </select>
        </Row>
      </div>
    )}
  </div>
);

const LANGUAGE_OPTIONS = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano'];

const BookSettingsModal: React.FC<{ book: Book; onClose: () => void }> = ({ book, onClose }) => {
  const { updateBook, updatePrintSettings } = useBookStore();
  const ps = book.printSettings;
  const upd = (partial: Partial<PrintSettings>) => updatePrintSettings(book.id, partial);

  const primaryLang = book.languages[0] ?? 'Português';
  const secondaryLang = book.languages[1] ?? '';

  const handlePrimaryLang = (lang: string) => {
    const langs = secondaryLang ? [lang, secondaryLang] : [lang];
    updateBook(book.id, { languages: langs });
  };
  const handleSecondaryLang = (lang: string) => {
    updateBook(book.id, { languages: lang ? [primaryLang, lang] : [primaryLang] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-96 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">Configurações do livro</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        {/* scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-0 text-sm">

          <Section title="Idiomas do livro">
            <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
              Usados pela IA para revisão e geração de texto. Defina o idioma principal e, se o livro misturar idiomas, adicione um secundário.
            </p>
            <Row label="Principal">
              <select value={primaryLang} onChange={e => handlePrimaryLang(e.target.value)} className={sel}>
                {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Row>
            <Row label="Secundário">
              <select value={secondaryLang} onChange={e => handleSecondaryLang(e.target.value)} className={sel}>
                <option value="">Nenhum</option>
                {LANGUAGE_OPTIONS.filter(l => l !== primaryLang).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Row>
          </Section>

          <Section title="Página">
            <Row label="Formato">
              <select value={ps.format} onChange={e => upd({ format: e.target.value as PageFormat })} className={sel}>
                {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Row>
            <Row label="Papel">
              <div className="flex items-center gap-2">
                <select value={book.paperType ?? 'offset'} onChange={e => updateBook(book.id, { paperType: e.target.value as PaperType })} className={sel}>
                  {PAPER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
                  style={{ background: PAPER_COLORS[book.paperType ?? 'offset'].bg }} />
              </div>
            </Row>
          </Section>

          <Section title="Paginação">
            <label className="flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer">
              <input type="checkbox" checked={ps.chapterStartsOnOddPage ?? false}
                onChange={e => upd({ chapterStartsOnOddPage: e.target.checked })}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-400 w-3 h-3" />
              Capítulo inicia em página ímpar
            </label>
          </Section>

          <Section title="Margens (px)">
            <label className="flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer mb-1">
              <input type="checkbox" checked={ps.mirrorMargins} onChange={e => upd({ mirrorMargins: e.target.checked })}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-400 w-3 h-3" />
              Margens espelhadas (pares/ímpares)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['top',    'Superior'],
                ['bottom', 'Inferior'],
                ['left',   ps.mirrorMargins ? 'Interno' : 'Esquerda'],
                ['right',  ps.mirrorMargins ? 'Externo'  : 'Direita'],
              ] as [keyof typeof ps.margins, string][]).map(([side, lbl]) => (
                <div key={side}>
                  <label className="text-[10px] text-gray-400 block mb-0.5">{lbl}</label>
                  <input type="number" min={0} max={300} value={ps.margins[side]}
                    onChange={e => upd({ margins: { ...ps.margins, [side]: Number(e.target.value) } })}
                    className={inp} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Cabeçalho">
            <label className="flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer mb-2">
              <input type="checkbox" checked={ps.useEvenOddHeaders} onChange={e => upd({ useEvenOddHeaders: e.target.checked })}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-400 w-3 h-3" />
              Diferente em páginas pares/ímpares
            </label>
            <p className="text-[11px] font-medium text-gray-500 mb-1">
              {ps.useEvenOddHeaders ? 'Páginas ímpares' : 'Cabeçalho'}
            </p>
            <HFEditor label="cabeçalho" value={ps.header} onChange={v => upd({ header: v })} />
            {ps.useEvenOddHeaders && (
              <>
                <p className="text-[11px] font-medium text-gray-500 mt-2 mb-1">Páginas pares</p>
                <HFEditor label="cabeçalho par" value={ps.headerEven ?? DEFAULT_PRINT_SETTINGS.headerEven} onChange={v => upd({ headerEven: v })} />
              </>
            )}
          </Section>

          <Section title="Rodapé">
            <p className="text-[11px] font-medium text-gray-500 mb-1">
              {ps.useEvenOddHeaders ? 'Páginas ímpares' : 'Rodapé'}
            </p>
            <HFEditor label="rodapé" value={ps.footer} onChange={v => upd({ footer: v })} />
            {ps.useEvenOddHeaders && (
              <>
                <p className="text-[11px] font-medium text-gray-500 mt-2 mb-1">Páginas pares</p>
                <HFEditor label="rodapé par" value={ps.footerEven ?? DEFAULT_PRINT_SETTINGS.footerEven} onChange={v => upd({ footerEven: v })} />
              </>
            )}
          </Section>

        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

interface Props {
  book: Book;
  activeChapterId: string | null;
  onSelectChapter: (id: string) => void;
}

export const ChapterPanel: React.FC<Props> = ({ book, activeChapterId, onSelectChapter }) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { createChapter, deleteChapter, updateChapter, reorderChapters } = useBookStore();
  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedChapters.findIndex(c => c.id === active.id);
    const newIndex = sortedChapters.findIndex(c => c.id === over.id);
    const newOrder = [...sortedChapters];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    reorderChapters(book.id, newOrder.map(c => c.id));
  };

  const handleAddChapter = () => {
    const title = newTitle.trim() || `Capítulo ${book.chapters.length + 1}`;
    const chapter = createChapter(book.id, title);
    onSelectChapter(chapter.id);
    setNewTitle('');
    setIsAdding(false);
    showToast(`Capítulo "${title}" criado`, 'success');
  };

  const handleDelete = (chapterId: string, title: string) => {
    if (book.chapters.length <= 1) {
      showToast('O livro precisa ter ao menos um capítulo', 'error');
      return;
    }
    deleteChapter(book.id, chapterId);
    showToast(`Capítulo "${title}" excluído`, 'info');
    if (activeChapterId === chapterId) {
      const remaining = book.chapters.filter(c => c.id !== chapterId);
      if (remaining.length > 0) onSelectChapter(remaining[0].id);
    }
  };

  const totalWords = book.chapters.reduce((sum, c) => sum + c.wordCount, 0);

  return (
    <div className="flex flex-col h-full">
      {showSettings && <BookSettingsModal book={book} onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Capítulos</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 rounded text-gray-500 hover:text-amber-400 hover:bg-gray-700 transition-colors"
            title="Configurações do livro (formato, papel)"
          >
            <Settings size={13} />
          </button>
        </div>
        <p className="text-[10px] text-gray-500">{book.chapters.length} capítulos · {totalWords} palavras</p>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedChapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {sortedChapters.map(chapter => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                isActive={chapter.id === activeChapterId}
                onClick={() => onSelectChapter(chapter.id)}
                onDelete={() => handleDelete(chapter.id, chapter.title)}
                onRename={(title) => updateChapter(book.id, chapter.id, { title })}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add chapter */}
      <div className="px-3 py-3 border-t border-gray-700">
        {isAdding ? (
          <div className="flex gap-1.5">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddChapter();
                if (e.key === 'Escape') { setIsAdding(false); setNewTitle(''); }
              }}
              placeholder="Título do capítulo..."
              className="flex-1 bg-gray-700 text-gray-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder-gray-500"
            />
            <button
              onClick={handleAddChapter}
              className="px-2.5 py-1.5 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors border border-dashed border-gray-600 hover:border-gray-500"
          >
            <Plus size={13} />
            Novo capítulo
          </button>
        )}
      </div>
    </div>
  );
};
