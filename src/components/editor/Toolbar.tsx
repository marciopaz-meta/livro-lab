import React, { useState, useRef, useEffect } from 'react';
import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote, Code, Minus,
  Heading1, Heading2, Heading3,
  Undo, Redo, Link, Unlink,
  Table, FileDown, ZoomIn, ZoomOut,
  Highlighter, Type, StickyNote, Trash2, Save,
  Sparkles, Wand2, Loader2, XCircle,
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { ColorPicker } from '../ui/ColorPicker';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface Props {
  editor: Editor | null;
  zoom: number;
  onZoomChange: (z: number) => void;
  onExportPdf: () => void;
  onPublishUmLivro?: () => void;
  onPublishEpub?: () => void;
  onSave?: () => void;
  saveStatus?: SaveStatus;
  // IA
  onAnalyzeWithAI?: () => void;
  onRewriteParagraph?: () => void;
  isAnalyzing?: boolean;
  analyzeProgress?: { done: number; total: number };
  correctionCount?: number;
  onClearCorrections?: () => void;
}

export const FONT_FAMILIES = [
  { value: 'Lora', label: 'Lora' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'EB Garamond', label: 'EB Garamond' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Source Serif 4', label: 'Source Serif 4' },
  { value: 'Crimson Text', label: 'Crimson Text' },
  { value: 'Spectral', label: 'Spectral' },
  { value: 'Cardo', label: 'Cardo' },
  { value: 'Libre Caslon Text', label: 'Libre Caslon' },
  { value: 'GFS Didot', label: 'GFS Didot' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Palatino Linotype', label: 'Palatino' },
  { value: 'Garamond', label: 'Garamond' },
  { value: 'Book Antiqua', label: 'Book Antiqua' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'DM Mono', label: 'DM Mono' },
  { value: 'Courier New', label: 'Courier New' },
];

const FONT_SIZES = ['8','9','10','11','12','13','14','16','18','20','24','28','32','36','48','64','72'];
const SEP = () => <div className="w-px h-5 bg-gray-600 mx-0.5 self-center flex-shrink-0" />;

// Table operation icons (LibreOffice-style: miniature table + visual indicator)
const S = { stroke: 'currentColor', fill: 'none' as const };
const IconAddColLeft = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" {...S}>
    {/* existing table: 2 cols on right */}
    <rect x="7" y="2" width="7" height="11" rx="0.5" strokeWidth="1.1"/>
    <line x1="11" y1="2" x2="11" y2="13" strokeWidth="1.1"/>
    <line x1="7" y1="7.5" x2="14" y2="7.5" strokeWidth="1.1"/>
    {/* + on left = new column */}
    <line x1="3.5" y1="5.5" x2="3.5" y2="9.5" strokeWidth="1.5"/>
    <line x1="1.5" y1="7.5" x2="5.5" y2="7.5" strokeWidth="1.5"/>
  </svg>
);
const IconAddColRight = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" {...S}>
    {/* existing table: 2 cols on left */}
    <rect x="1" y="2" width="7" height="11" rx="0.5" strokeWidth="1.1"/>
    <line x1="4.5" y1="2" x2="4.5" y2="13" strokeWidth="1.1"/>
    <line x1="1" y1="7.5" x2="8" y2="7.5" strokeWidth="1.1"/>
    {/* + on right = new column */}
    <line x1="11.5" y1="5.5" x2="11.5" y2="9.5" strokeWidth="1.5"/>
    <line x1="9.5" y1="7.5" x2="13.5" y2="7.5" strokeWidth="1.5"/>
  </svg>
);
const IconDelCol = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" {...S}>
    {/* 3-col table */}
    <rect x="1" y="2" width="13" height="11" rx="0.5" strokeWidth="1.1"/>
    <line x1="5.3" y1="2" x2="5.3" y2="13" strokeWidth="1.1"/>
    <line x1="9.7" y1="2" x2="9.7" y2="13" strokeWidth="1.1"/>
    <line x1="1" y1="7.5" x2="14" y2="7.5" strokeWidth="1.1"/>
    {/* × on middle column */}
    <line x1="6.3" y1="3.5" x2="8.7" y2="11.5" strokeWidth="1.3"/>
    <line x1="8.7" y1="3.5" x2="6.3" y2="11.5" strokeWidth="1.3"/>
  </svg>
);
const IconAddRowAbove = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" {...S}>
    {/* existing table: 2 rows on bottom */}
    <rect x="2" y="7" width="11" height="7" rx="0.5" strokeWidth="1.1"/>
    <line x1="7.5" y1="7" x2="7.5" y2="14" strokeWidth="1.1"/>
    <line x1="2" y1="10.5" x2="13" y2="10.5" strokeWidth="1.1"/>
    {/* + above = new row */}
    <line x1="7.5" y1="1.5" x2="7.5" y2="5.5" strokeWidth="1.5"/>
    <line x1="5.5" y1="3.5" x2="9.5" y2="3.5" strokeWidth="1.5"/>
  </svg>
);
const IconAddRowBelow = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" {...S}>
    {/* existing table: 2 rows on top */}
    <rect x="2" y="1" width="11" height="7" rx="0.5" strokeWidth="1.1"/>
    <line x1="7.5" y1="1" x2="7.5" y2="8" strokeWidth="1.1"/>
    <line x1="2" y1="4.5" x2="13" y2="4.5" strokeWidth="1.1"/>
    {/* + below = new row */}
    <line x1="7.5" y1="9.5" x2="7.5" y2="13.5" strokeWidth="1.5"/>
    <line x1="5.5" y1="11.5" x2="9.5" y2="11.5" strokeWidth="1.5"/>
  </svg>
);
const IconDelRow = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" {...S}>
    {/* 3-row table */}
    <rect x="1" y="2" width="13" height="11" rx="0.5" strokeWidth="1.1"/>
    <line x1="7.5" y1="2" x2="7.5" y2="13" strokeWidth="1.1"/>
    <line x1="1" y1="5.7" x2="14" y2="5.7" strokeWidth="1.1"/>
    <line x1="1" y1="9.3" x2="14" y2="9.3" strokeWidth="1.1"/>
    {/* × on middle row */}
    <line x1="3" y1="6.5" x2="12" y2="8.5" strokeWidth="1.3"/>
    <line x1="12" y1="6.5" x2="3" y2="8.5" strokeWidth="1.3"/>
  </svg>
);

const ToolbarInner: React.FC<Props & { editor: Editor }> = ({
  editor, zoom, onZoomChange, onExportPdf, onPublishUmLivro, onPublishEpub, onSave, saveStatus,
  onAnalyzeWithAI, onRewriteParagraph,
  isAnalyzing, analyzeProgress, correctionCount, onClearCorrections,
}) => {
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlightColor, setShowHighlightColor] = useState(false);
  const [showTableInsert, setShowTableInsert] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeader, setTableHeader] = useState(true);
  const tablePopoverRef = useRef<HTMLDivElement>(null);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tablePopoverRef.current && !tablePopoverRef.current.contains(e.target as Node)) {
        setShowTableInsert(false);
      }
    };
    if (showTableInsert) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTableInsert]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (linkPopoverRef.current && !linkPopoverRef.current.contains(e.target as Node)) {
        setShowLinkPopover(false);
      }
    };
    if (showLinkPopover) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLinkPopover]);

  const openLinkPopover = () => {
    const href = editor.getAttributes('link').href || '';
    setLinkUrl(href);
    setShowLinkPopover(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkPopover(false);
  };

  const s = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isUnderline: ctx.editor.isActive('underline'),
      isStrike: ctx.editor.isActive('strike'),
      isSubscript: ctx.editor.isActive('subscript'),
      isSuperscript: ctx.editor.isActive('superscript'),
      isH1: ctx.editor.isActive('heading', { level: 1 }),
      isH2: ctx.editor.isActive('heading', { level: 2 }),
      isH3: ctx.editor.isActive('heading', { level: 3 }),
      isAlignLeft: ctx.editor.isActive({ textAlign: 'left' }),
      isAlignCenter: ctx.editor.isActive({ textAlign: 'center' }),
      isAlignRight: ctx.editor.isActive({ textAlign: 'right' }),
      isAlignJustify: ctx.editor.isActive({ textAlign: 'justify' }),
      isBulletList: ctx.editor.isActive('bulletList'),
      isOrderedList: ctx.editor.isActive('orderedList'),
      isTaskList: ctx.editor.isActive('taskList'),
      isBlockquote: ctx.editor.isActive('blockquote'),
      isCodeBlock: ctx.editor.isActive('codeBlock'),
      isLink: ctx.editor.isActive('link'),
      isHighlight: ctx.editor.isActive('highlight'),
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
      fontFamily: ctx.editor.getAttributes('textStyle').fontFamily || '',
      fontSize: (ctx.editor.getAttributes('textStyle').fontSize || '12px').replace(/[a-z]+$/i, ''),
      textColor: ctx.editor.getAttributes('textStyle').color || '#ffffff',
      highlightColor: ctx.editor.getAttributes('highlight').color || '#fef08a',
      isInTable: ctx.editor.isActive('tableCell') || ctx.editor.isActive('tableHeader'),
    }),
  });

  const insertStickyNote = (color: string) => {
    editor.chain().focus().insertContent({
      type: 'stickyNote',
      attrs: { color },
      content: [{ type: 'text', text: 'Nota adesiva...' }],
    }).run();
  };

  return (
    <div className="toolbar flex items-center gap-0.5 flex-wrap px-2 py-1.5 bg-gray-800 border-b border-gray-700 select-none" style={{ overflow: 'visible' }}>
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!s.canUndo} title="Desfazer (Ctrl+Z)"><Undo size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!s.canRedo} title="Refazer"><Redo size={15} /></ToolbarButton>
      {onSave && (
        <ToolbarButton
          onClick={onSave}
          title="Salvar (Ctrl+S)"
          className={saveStatus === 'saved' ? 'text-green-400' : saveStatus === 'unsaved' ? 'text-amber-400' : ''}
        >
          <Save size={15} />
        </ToolbarButton>
      )}
      <SEP />

      <select value={s.fontFamily || 'Lora'} onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="bg-gray-700 text-gray-200 text-xs rounded px-1.5 py-1 border border-gray-600 focus:outline-none focus:border-amber-500 max-w-[140px] flex-shrink-0" title="Fonte">
        {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      <select value={s.fontSize || '12'} onChange={e => editor.chain().focus().setFontSize(e.target.value + 'px').run()}
        className="bg-gray-700 text-gray-200 text-xs rounded px-1.5 py-1 border border-gray-600 focus:outline-none focus:border-amber-500 w-14 flex-shrink-0" title="Tamanho">
        {FONT_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
      </select>
      <SEP />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={s.isBold} title="Negrito (Ctrl+B)"><Bold size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={s.isItalic} title="Itálico (Ctrl+I)"><Italic size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={s.isUnderline} title="Sublinhado (Ctrl+U)"><Underline size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={s.isStrike} title="Tachado"><Strikethrough size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={s.isSubscript} title="Subscrito"><Subscript size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={s.isSuperscript} title="Sobrescrito"><Superscript size={15} /></ToolbarButton>
      <SEP />

      {/* Text color */}
      <div className="relative flex-shrink-0">
        <button onMouseDown={e => e.preventDefault()} onClick={() => { setShowTextColor(v => !v); setShowHighlightColor(false); }}
          className="p-1.5 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-0.5" title="Cor do texto">
          <Type size={14} />
          <div className="w-3 h-1 rounded-sm mt-0.5" style={{ background: s.textColor }} />
        </button>
        {showTextColor && (
          <div className="absolute top-8 left-0 z-50">
            <ColorPicker inline value={s.textColor} onChange={c => { editor.chain().focus().setColor(c).run(); setShowTextColor(false); }} />
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative flex-shrink-0">
        <button onMouseDown={e => e.preventDefault()} onClick={() => { setShowHighlightColor(v => !v); setShowTextColor(false); }}
          className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${s.isHighlight ? 'bg-amber-500/30 text-amber-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`} title="Realçar texto">
          <Highlighter size={14} />
          <div className="w-3 h-1 rounded-sm mt-0.5" style={{ background: s.highlightColor }} />
        </button>
        {showHighlightColor && (
          <div className="absolute top-8 left-0 z-50">
            <ColorPicker inline value={s.highlightColor}
              onChange={c => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightColor(false); }}
              colors={['#fef08a','#bbf7d0','#bfdbfe','#fecaca','#e9d5ff','#fed7aa','#ffffff','#e2e8f0']} />
          </div>
        )}
      </div>
      <SEP />

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={s.isH1} title="Título 1"><Heading1 size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={s.isH2} title="Título 2"><Heading2 size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={s.isH3} title="Título 3"><Heading3 size={15} /></ToolbarButton>
      <SEP />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={s.isAlignLeft} title="Esquerda"><AlignLeft size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={s.isAlignCenter} title="Centralizar"><AlignCenter size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={s.isAlignRight} title="Direita"><AlignRight size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={s.isAlignJustify} title="Justificar"><AlignJustify size={15} /></ToolbarButton>
      <SEP />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={s.isBulletList} title="Lista"><List size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={s.isOrderedList} title="Lista numerada"><ListOrdered size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={s.isTaskList} title="Lista de tarefas"><CheckSquare size={15} /></ToolbarButton>
      <SEP />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={s.isBlockquote} title="Citação"><Quote size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={s.isCodeBlock} title="Código"><Code size={15} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal"><Minus size={15} /></ToolbarButton>
      <SEP />

      <div className="relative flex-shrink-0" ref={linkPopoverRef}>
        <ToolbarButton
          onClick={() => { if (s.isLink) { editor.chain().focus().unsetLink().run(); } else { openLinkPopover(); } }}
          active={s.isLink || showLinkPopover} title="Link (Ctrl+K)">
          {s.isLink ? <Unlink size={15} /> : <Link size={15} />}
        </ToolbarButton>
        {showLinkPopover && (
          <div className="absolute top-8 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl w-64">
            <p className="text-[11px] text-gray-300 font-medium mb-2">Inserir link</p>
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } if (e.key === 'Escape') setShowLinkPopover(false); }}
              placeholder="https://..."
              className="w-full bg-gray-700 border border-gray-500 rounded px-2 py-1.5 text-xs text-white placeholder-gray-400 outline-none focus:border-amber-500 mb-2.5"
              autoFocus
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => setShowLinkPopover(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyLink}
                className="px-2.5 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Table insert popover */}
      <div className="relative flex-shrink-0" ref={tablePopoverRef}>
        <ToolbarButton onClick={() => setShowTableInsert(v => !v)} active={showTableInsert} title="Inserir tabela">
          <Table size={15} />
        </ToolbarButton>
        {showTableInsert && (
          <div className="absolute top-8 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl w-44">
            <p className="text-[11px] text-gray-300 font-medium mb-2">Inserir tabela</p>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 block mb-0.5">Linhas</label>
                <input type="number" min={1} max={20} value={tableRows}
                  onChange={e => setTableRows(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-gray-700 text-gray-200 text-xs rounded px-1.5 py-1 border border-gray-600 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 block mb-0.5">Colunas</label>
                <input type="number" min={1} max={20} value={tableCols}
                  onChange={e => setTableCols(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-gray-700 text-gray-200 text-xs rounded px-1.5 py-1 border border-gray-600 focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-300 mb-2.5 cursor-pointer">
              <input type="checkbox" checked={tableHeader} onChange={e => setTableHeader(e.target.checked)}
                className="rounded w-3 h-3 accent-amber-500" />
              Com cabeçalho
            </label>
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: tableHeader }).run();
                setShowTableInsert(false);
              }}
              className="w-full py-1.5 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors">
              Inserir
            </button>
          </div>
        )}
      </div>

      {/* Contextual table edit controls */}
      {s.isInTable && (
        <>
          <SEP />
          <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Inserir coluna à esquerda"><IconAddColLeft /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Inserir coluna à direita"><IconAddColRight /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Excluir coluna"><IconDelCol /></ToolbarButton>
          <SEP />
          <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Inserir linha acima"><IconAddRowAbove /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Inserir linha abaixo"><IconAddRowBelow /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Excluir linha"><IconDelRow /></ToolbarButton>
          <SEP />
          <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Excluir tabela"><Trash2 size={13} /></ToolbarButton>
        </>
      )}

      {/* Sticky note */}
      <div className="relative group flex-shrink-0">
        <ToolbarButton onClick={() => insertStickyNote('yellow')} title="Nota adesiva"><StickyNote size={15} /></ToolbarButton>
        <div className="absolute top-8 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg p-1.5 hidden group-hover:flex gap-1 shadow-xl">
          {(['yellow','green','blue','pink'] as const).map(color => {
            const bg: Record<string,string> = {yellow:'#fef08a',green:'#bbf7d0',blue:'#bfdbfe',pink:'#fecaca'};
            return <button key={color} onClick={() => insertStickyNote(color)} className="w-5 h-5 rounded border border-gray-500" style={{ background: bg[color] }} title={color} />;
          })}
        </div>
      </div>

      {/* Page break */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertContent({ type: 'pageBreak' }).insertContent({ type: 'paragraph' }).run()}
        title="Quebra de página (Ctrl+Enter)">
        <span className="text-[10px] font-mono leading-none">⌘↵</span>
      </ToolbarButton>
      <SEP />

      {/* Zoom */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <ToolbarButton onClick={() => onZoomChange(Math.max(50, zoom - 10))} title="Reduzir zoom"><ZoomOut size={14} /></ToolbarButton>
        <span className="text-xs text-gray-300 w-10 text-center">{zoom}%</span>
        <ToolbarButton onClick={() => onZoomChange(Math.min(200, zoom + 10))} title="Aumentar zoom"><ZoomIn size={14} /></ToolbarButton>
      </div>
      <SEP />

      <ToolbarButton onClick={onExportPdf} title="Exportar PDF"><FileDown size={15} /></ToolbarButton>
      <button
        onClick={onPublishUmLivro}
        title="Publicar na UmLivro"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex-shrink-0
          bg-amber-600/20 text-amber-300 border border-amber-600/40 hover:bg-amber-600/30 whitespace-nowrap"
      >
        Publicar na UmLivro
      </button>
      <button
        onClick={onPublishEpub}
        title="Publicar EPub"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex-shrink-0
          bg-sky-600/20 text-sky-300 border border-sky-600/40 hover:bg-sky-600/30 whitespace-nowrap"
      >
        Publicar EPub
      </button>

      {/* ─── Seção IA ─────────────────────────────────────────────────────── */}
      {onAnalyzeWithAI && (
        <>
          <SEP />
          {/* Botão principal: Avaliar texto com IA */}
          <button
            onClick={onAnalyzeWithAI}
            disabled={isAnalyzing}
            title="Avaliar texto com IA (Nível 1 — ortografia, gramática, clareza)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-60
              bg-amber-600/20 text-amber-300 border border-amber-600/40 hover:bg-amber-600/30"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                {analyzeProgress && analyzeProgress.total > 1
                  ? `${analyzeProgress.done}/${analyzeProgress.total}`
                  : 'Analisando...'}
              </>
            ) : (
              <>
                <Sparkles size={13} />
                Avaliar com IA
              </>
            )}
          </button>

          {/* Reescrever parágrafo */}
          <ToolbarButton
            onClick={() => onRewriteParagraph?.()}
            title="Reescrever parágrafo com IA (Nível 2 — fluidez e clareza)"
          >
            <Wand2 size={14} className="text-purple-400" />
          </ToolbarButton>

          {/* Limpar correções */}
          {(correctionCount ?? 0) > 0 && (
            <ToolbarButton
              onClick={() => onClearCorrections?.()}
              title={`Limpar ${correctionCount} sugestão(ões) IA`}
            >
              <XCircle size={14} className="text-red-400" />
            </ToolbarButton>
          )}

        </>
      )}
    </div>
  );
};

export const Toolbar: React.FC<Props> = (props) => {
  if (!props.editor) return <div className="toolbar flex items-center px-2 py-1.5 bg-gray-800 border-b border-gray-700 h-10 flex-shrink-0" />;
  return <ToolbarInner {...props} editor={props.editor} />;
};
