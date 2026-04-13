import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Mark as PMMark } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { BulletList } from '@tiptap/extension-list';
import { wrappingInputRule } from '@tiptap/core';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { ResizableImage } from './extensions/ResizableImage';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Typography } from '@tiptap/extension-typography';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Focus } from '@tiptap/extension-focus';

import { PageBreak } from './extensions/PageBreak';
import { StickyNote } from './extensions/StickyNote';
import { FontSize } from './extensions/FontSize';
import { LineHeight } from './extensions/LineHeight';
import { FontInheritance } from './extensions/FontInheritance';
import {
  AICorrectionMark,
  extractDocParagraphs,
  applyAICorrections,
  removeAllAICorrections,
  removeAICorrectionById,
} from './extensions/AICorrection';
import { Toolbar } from './Toolbar';
import { BubbleMenuBar } from './BubbleMenuBar';
import { FloatingMenuBar } from './FloatingMenuBar';
import { WordCounter } from './WordCounter';
import { AICorrectionPopover } from '../ai/AICorrectionPopover';
import { AIRewriteModal } from '../ai/AIRewriteModal';
import { AIExpandModal } from '../ai/AIExpandModal';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useAIStore } from '../../store/useAIStore';
import { checkTextWithAI } from '../../services/aiService';
import { hasAPIKey } from '../../config/aiConfig';
import { PAPER_COLORS, PAGE_FORMATS } from '../../types';
import type { Book, Chapter } from '../../types';

// BulletList customizado: só ativa com `* ` (asterisco), não com `- ` ou `+ `
const CustomBulletList = BulletList.extend({
  addInputRules() {
    return [
      wrappingInputRule({ find: /^\s*\*\s$/, type: this.type }),
    ];
  },
});

interface Props {
  book: Book;
  chapter: Chapter;
  onSave: (html: string) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  onExportPdf: () => void;
  onPublishUmLivro?: () => void;
  onPublishEpub?: () => void;
}

export const RichEditor: React.FC<Props> = ({
  book,
  chapter,
  onSave,
  zoom,
  onZoomChange,
  onExportPdf,
  onPublishUmLivro,
  onPublishEpub,
}) => {
  const {
    corrections,
    isAnalyzing,
    analyzeProgress,
    activePopover,
    setCorrections,
    removeCorrection,
    clearCorrections,
    setAnalyzing,
    setProgress,
    setActivePopover,
  } = useAIStore();

  const [rewriteState, setRewriteState] = useState<{
    original: string;
    prev: string;
    next: string;
    from: number;
    to: number;
  } | null>(null);

  const [expandState, setExpandState] = useState<{
    selected: string;
    prev: string;
    next: string;
    insertPos: number;
  } | null>(null);

  const [, setShowAISettings] = useState(false);

  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const analyzingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: false, // substituído por CustomBulletList abaixo
      }),
      CustomBulletList,
      FontInheritance,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Comece a escrever seu capítulo...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Typography,
      CharacterCount,
      Subscript,
      Superscript,
      Focus.configure({ className: 'has-focus', mode: 'all' }),
      PageBreak,
      StickyNote,
      AICorrectionMark,
    ],
    content: chapter.content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
        spellcheck: 'true',
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return true;
            const reader = new FileReader();
            reader.onload = e => {
              const src = e.target?.result as string;
              if (src) {
                const node = view.state.schema.nodes['image']?.create({ src });
                if (node) view.dispatch(view.state.tr.replaceSelectionWith(node));
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync content e limpa correções ao trocar de capítulo
  useEffect(() => {
    if (editor && chapter.content !== editor.getHTML()) {
      editor.commands.setContent(chapter.content || '<p></p>');
    }
    clearCorrections();
  }, [chapter.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback((html: string) => {
    onSave(html);
  }, [onSave]);

  const currentHtml = editor?.getHTML() ?? '';
  const { status: saveStatus, forceSave } = useAutoSave(currentHtml, handleSave, 800);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [forceSave]);

  const handleInsertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  // ─── IA Nível 1: Análise ortográfica/gramatical ───────────────────────────

  const handleAnalyzeWithAI = useCallback(async () => {
    if (!editor || analyzingRef.current) return;
    if (!hasAPIKey()) return;

    analyzingRef.current = true;
    clearCorrections();
    removeAllAICorrections(editor.view);
    setAnalyzing(true);

    try {
      const paragraphs = extractDocParagraphs(editor.state.doc);
      const result = await checkTextWithAI(
        paragraphs,
        book.languages ?? ['Português'],
        (done, total) => setProgress(done, total),
      );
      setCorrections(result);
      if (result.length > 0) {
        const freshParagraphs = extractDocParagraphs(editor.state.doc);
        applyAICorrections(editor.view, freshParagraphs, result);
      }
    } catch (err) {
      console.error('[IA] Erro na análise:', err);
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }, [editor, book.languages, clearCorrections, setAnalyzing, setCorrections, setProgress]);

  // ─── Clique nas marcas de correção ────────────────────────────────────────

  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const mark = target.closest('[data-ai-correction="true"]') as HTMLElement | null;
    if (!mark) {
      setActivePopover(null);
      return;
    }
    const rect = mark.getBoundingClientRect();
    setActivePopover({
      correctionId: mark.getAttribute('data-ai-id') ?? '',
      suggestion: mark.getAttribute('data-ai-suggestion') ?? '',
      type: mark.getAttribute('data-ai-type') ?? 'spelling',
      explanation: mark.getAttribute('data-ai-explanation') ?? '',
      anchorRect: { top: rect.top, left: rect.left, width: rect.width },
    });
  }, [setActivePopover]);

  // ─── Aceitar correção ─────────────────────────────────────────────────────

  const handleAcceptCorrection = useCallback((correctionId: string, suggestion: string) => {
    if (!editor) return;
    const { state, dispatch } = editor.view;
    const doc = state.doc;
    const markType = state.schema.marks['aiCorrection'];
    if (!markType) return;

    let markFrom = -1;
    let markTo = -1;
    let inheritedMarks: PMMark[] = [];

    doc.nodesBetween(0, doc.content.size, (node, pos) => {
      if (!node.isText) return true;
      const hasMark = node.marks.find(
        m => m.type === markType && (m.attrs as { id: string }).id === correctionId,
      );
      if (hasMark) {
        if (markFrom === -1) {
          markFrom = pos;
          // Coleta marks do primeiro text node, excluindo a marca de IA
          inheritedMarks = node.marks.filter(m => m.type !== markType);
        }
        markTo = pos + node.nodeSize;
      }
      return true;
    });

    if (markFrom !== -1 && markTo !== -1) {
      const newText = state.schema.text(suggestion, inheritedMarks.length ? inheritedMarks : undefined);
      dispatch(state.tr.replaceWith(markFrom, markTo, newText));
    }
    removeCorrection(correctionId);
    setActivePopover(null);
  }, [editor, removeCorrection, setActivePopover]);

  // ─── Ignorar correção ─────────────────────────────────────────────────────

  const handleIgnoreCorrection = useCallback((correctionId: string) => {
    if (!editor) return;
    removeAICorrectionById(editor.view, correctionId);
    removeCorrection(correctionId);
    setActivePopover(null);
  }, [editor, removeCorrection, setActivePopover]);

  // ─── IA Nível 2: Reescrita de parágrafo ───────────────────────────────────

  const handleRewriteParagraph = useCallback(() => {
    if (!editor) return;
    if (!hasAPIKey()) { setShowAISettings(true); return; }

    const { state } = editor;
    const { selection, doc } = state;

    const topLevelNodes: { text: string; from: number; to: number }[] = [];
    doc.forEach((node, offset) => {
      topLevelNodes.push({
        text: node.textContent,
        from: offset + 1,
        to: offset + node.nodeSize - 1,
      });
    });

    // Encontra qual bloco contém o cursor
    const cursorPos = selection.from;
    const currentIdx = topLevelNodes.findIndex(
      n => cursorPos >= n.from - 1 && cursorPos <= n.to + 1,
    );
    if (currentIdx === -1) return;

    const current = topLevelNodes[currentIdx];
    if (!current.text.trim()) return;

    setRewriteState({
      original: current.text,
      prev: topLevelNodes[currentIdx - 1]?.text ?? '',
      next: topLevelNodes[currentIdx + 1]?.text ?? '',
      from: current.from - 1,
      to: current.to + 1,
    });
  }, [editor]);

  const handleAcceptRewrite = useCallback((newText: string) => {
    if (!editor || !rewriteState) return;
    const { from, to } = rewriteState;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, `<p>${newText}</p>`).run();
    setRewriteState(null);
  }, [editor, rewriteState]);

  // ─── IA Nível 3: Super Completar ──────────────────────────────────────────

  const handleSuperComplete = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { selection, doc } = state;
    const selectedText = state.doc.textBetween(selection.from, selection.to, '\n').trim();
    if (!selectedText) return;

    const topLevelNodes: { text: string; from: number; to: number }[] = [];
    doc.forEach((node, offset) => {
      topLevelNodes.push({
        text: node.textContent,
        from: offset + 1,
        to: offset + node.nodeSize - 1,
      });
    });

    // Finds the block containing the end of the selection for context
    const cursorPos = selection.to;
    const currentIdx = topLevelNodes.findIndex(
      n => cursorPos >= n.from - 1 && cursorPos <= n.to + 1,
    );

    setExpandState({
      selected: selectedText,
      prev: currentIdx > 0 ? (topLevelNodes[currentIdx - 1]?.text ?? '') : '',
      next: topLevelNodes[currentIdx + 1]?.text ?? '',
      insertPos: selection.to,
    });
  }, [editor]);

  const handleAcceptExpand = useCallback((newText: string) => {
    if (!editor || !expandState) return;
    const paragraphs = newText
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p}</p>`)
      .join('');
    editor.chain().focus().insertContentAt(expandState.insertPos, paragraphs).run();
    setExpandState(null);
  }, [editor, expandState]);

  // ─── Layout ───────────────────────────────────────────────────────────────

  const { fontFamily, fontSize, lineHeight } = book.printSettings;
  const fmt = PAGE_FORMATS[book.printSettings.format];
  const paperBg = PAPER_COLORS[book.paperType ?? 'offset'].bg;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <Toolbar
        editor={editor}
        zoom={zoom}
        onZoomChange={onZoomChange}
        onExportPdf={onExportPdf}
        onPublishUmLivro={onPublishUmLivro}
        onPublishEpub={onPublishEpub}
        onSave={forceSave}
        saveStatus={saveStatus}
        onAnalyzeWithAI={handleAnalyzeWithAI}
        onRewriteParagraph={handleRewriteParagraph}
        isAnalyzing={isAnalyzing}
        analyzeProgress={analyzeProgress}
        correctionCount={corrections.length}
        onClearCorrections={() => {
          if (editor) removeAllAICorrections(editor.view);
          clearCorrections();
        }}
      />

      {/* Barra de progresso da análise IA */}
      {isAnalyzing && (
        <div className="h-1 bg-gray-700 flex-shrink-0">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{
              width: analyzeProgress.total > 0
                ? `${Math.round((analyzeProgress.done / analyzeProgress.total) * 100)}%`
                : '5%',
            }}
          />
        </div>
      )}

      {editor && <BubbleMenuBar editor={editor} onRewriteParagraph={handleRewriteParagraph} onSuperComplete={handleSuperComplete} />}
      <div
        ref={editorWrapperRef}
        className="flex-1 overflow-auto editor-canvas"
        onClick={handleEditorClick}
      >
        <div className="flex justify-center py-8 px-4 min-h-full">
          <div
            className="editor-page shadow-2xl rounded"
            style={{
              zoom: zoom / 100,
              width: fmt.widthPx,
              minHeight: fmt.heightPx,
              padding: '72px',
              fontFamily: `${fontFamily}, Georgia, serif`,
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              color: '#1a140e',
              background: paperBg,
              transition: 'background 0.3s ease',
            }}
          >
            {editor && <FloatingMenuBar editor={editor} onInsertTable={handleInsertTable} />}
            <EditorContent editor={editor} className="editor-content" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700">
        <WordCounter
          words={chapter.wordCount}
          chars={chapter.charCount}
          saveStatus={saveStatus}
        />
        <div className="text-xs text-gray-500 flex items-center gap-3">
          <span>{fontFamily} · {fontSize}pt · Zoom {zoom}%</span>
          {corrections.length > 0 && (
            <span className="text-amber-400">{corrections.length} sugestão(ões) IA</span>
          )}
        </div>
      </div>

      {/* Popover de correção */}
      {activePopover && (
        <AICorrectionPopover
          popover={activePopover}
          onAccept={handleAcceptCorrection}
          onIgnore={handleIgnoreCorrection}
          onClose={() => setActivePopover(null)}
        />
      )}

      {/* Modal reescrita — Nível 2 */}
      {rewriteState && (
        <AIRewriteModal
          isOpen={true}
          onClose={() => setRewriteState(null)}
          originalText={rewriteState.original}
          prevText={rewriteState.prev}
          nextText={rewriteState.next}
          languages={book.languages ?? ['Português']}
          onAccept={handleAcceptRewrite}
        />
      )}

      {/* Modal Super Completar — Nível 3 */}
      {expandState && (
        <AIExpandModal
          isOpen={true}
          onClose={() => setExpandState(null)}
          selectedText={expandState.selected}
          prevText={expandState.prev}
          nextText={expandState.next}
          bookTitle={book.title}
          chapterTitle={chapter.title}
          author={book.author}
          genre={book.genre ?? ''}
          languages={book.languages ?? ['Português']}
          onAccept={handleAcceptExpand}
        />
      )}

    </div>
  );
};
