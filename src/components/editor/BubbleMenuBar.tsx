import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { Link, Unlink, Highlighter, Wand2, Sparkles, GripVertical } from 'lucide-react';

interface Props {
  editor: Editor;
  onRewriteParagraph?: () => void;
  onSuperComplete?: () => void;
}

export const BubbleMenuBar: React.FC<Props> = ({ editor, onRewriteParagraph, onSuperComplete }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const [posReady, setPosReady] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const showLinkPopoverRef = useRef(false);
  // Incrementado a cada selectionUpdate para disparar o useLayoutEffect
  const [selVersion, setSelVersion] = useState(0);
  // Impede reposicionamento automático enquanto o usuário arrasta
  const userDraggedRef = useRef(false);

  const setLinkPopover = (val: boolean) => {
    showLinkPopoverRef.current = val;
    setShowLinkPopover(val);
  };

  // ── Escuta eventos do editor ───────────────────────────────────────────────
  useEffect(() => {
    const onSelection = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setVisible(false);
        setPosReady(false);
        setLinkPopover(false);
        userDraggedRef.current = false;
        return;
      }
      userDraggedRef.current = false; // reset ao fazer nova seleção
      setVisible(true);
      setSelVersion(v => v + 1);
    };
    const onBlur = () => {
      if (!showLinkPopoverRef.current) { setVisible(false); setPosReady(false); }
    };
    editor.on('selectionUpdate', onSelection);
    editor.on('blur', onBlur);
    return () => { editor.off('selectionUpdate', onSelection); editor.off('blur', onBlur); };
  }, [editor]);

  // ── Calcula posição após render (medição real da largura do menu) ──────────
  useLayoutEffect(() => {
    if (!visible || !menuRef.current || userDraggedRef.current) return;

    const menu = menuRef.current;
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const TOOLBAR_H = 60;

    // Y: usa coordsAtPos para a linha da seleção (relativo ao viewport)
    const { from } = editor.state.selection;
    const fromCoords = editor.view.coordsAtPos(from);

    let top: number;
    const topAbove = fromCoords.top - mh - 8;
    if (topAbove >= TOOLBAR_H) {
      top = topAbove;                          // acima da seleção
    } else if (fromCoords.bottom + mh + 8 < window.innerHeight) {
      top = fromCoords.bottom + 8;             // abaixo da seleção
    } else {
      top = TOOLBAR_H + 8;                     // fallback: topo do editor
    }
    // Garante que o menu nunca saia da área visível do viewport
    top = Math.max(TOOLBAR_H, Math.min(window.innerHeight - mh - 8, top));

    // X: centraliza no container do editor (editor-canvas), não no viewport inteiro
    // editor-canvas não tem CSS zoom, então getBoundingClientRect é confiável
    const canvas = editor.view.dom.closest('.editor-canvas') as HTMLElement | null;
    const cr = canvas?.getBoundingClientRect() ?? { left: 0, width: window.innerWidth };
    const left = Math.max(8, Math.min(window.innerWidth - mw - 8, Math.round(cr.left + (cr.width - mw) / 2))) / 2;

    setPos({ top, left });
    setPosReady(true);
  }, [visible, selVersion, editor]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    userDraggedRef.current = true;

    const startX = e.clientX - pos.left;
    const startY = e.clientY - pos.top;

    const onMove = (ev: MouseEvent) => {
      setPos({
        left: Math.max(0, Math.min(window.innerWidth  - (menuRef.current?.offsetWidth  ?? 200), ev.clientX - startX)),
        top:  Math.max(0, Math.min(window.innerHeight - (menuRef.current?.offsetHeight ?? 44),  ev.clientY - startY)),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos]);

  // ── Link ──────────────────────────────────────────────────────────────────
  const openLinkPopover = () => {
    setLinkUrl(editor.getAttributes('link').href || '');
    setLinkPopover(true);
  };
  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) editor.chain().focus().setLink({ href: url }).run();
    else editor.chain().focus().unsetLink().run();
    setLinkPopover(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-40 flex items-center gap-0.5 bg-gray-900 border border-gray-700 rounded-lg px-1 py-1 shadow-xl select-none"
      style={{
        top: pos.top,
        left: pos.left,
        opacity: posReady ? 1 : 0,
        pointerEvents: posReady ? 'auto' : 'none',
        transform: 'none',
      }}
      onMouseDown={e => e.preventDefault()}
    >
      {/* Handle de arrastar */}
      <div
        className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 px-0.5 flex-shrink-0"
        onMouseDown={startDrag}
        title="Mover barra"
      >
        <GripVertical size={14} />
      </div>

      <div className="w-px h-4 bg-gray-700 mx-0.5" />

      <button onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded text-xs font-bold transition-colors ${editor.isActive('bold') ? 'bg-amber-500/30 text-amber-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
        title="Negrito">B</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded text-xs italic transition-colors ${editor.isActive('italic') ? 'bg-amber-500/30 text-amber-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
        title="Itálico">I</button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded text-xs underline transition-colors ${editor.isActive('underline') ? 'bg-amber-500/30 text-amber-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
        title="Sublinhado">U</button>

      <div className="w-px h-4 bg-gray-600 mx-1" />

      <div className="relative flex-shrink-0">
        <button
          onClick={() => { if (editor.isActive('link')) editor.chain().focus().unsetLink().run(); else openLinkPopover(); }}
          className={`p-1.5 rounded transition-colors ${editor.isActive('link') || showLinkPopover ? 'bg-amber-500/30 text-amber-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          title="Link"
        >
          {editor.isActive('link') ? <Unlink size={14} /> : <Link size={14} />}
        </button>
        {showLinkPopover && (
          <div
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl w-64"
            onMouseDown={e => e.stopPropagation()}
          >
            <p className="text-[11px] text-gray-300 font-medium mb-2">Inserir link</p>
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } if (e.key === 'Escape') setLinkPopover(false); }}
              placeholder="https://..."
              className="w-full bg-gray-700 border border-gray-500 rounded px-2 py-1.5 text-xs text-white placeholder-gray-400 outline-none focus:border-amber-500 mb-2.5"
              autoFocus
            />
            <div className="flex gap-1.5 justify-end">
              <button onMouseDown={e => e.stopPropagation()} onClick={() => setLinkPopover(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors">Cancelar</button>
              <button onMouseDown={e => e.stopPropagation()} onClick={applyLink}
                className="px-2.5 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors">Aplicar</button>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('highlight') ? 'bg-amber-500/30 text-amber-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
        title="Highlight"><Highlighter size={14} /></button>

      {(onRewriteParagraph || onSuperComplete) && <div className="w-px h-4 bg-gray-600 mx-1" />}

      {onRewriteParagraph && (
        <button onClick={onRewriteParagraph}
          className="p-1.5 rounded transition-colors text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 flex items-center gap-1"
          title="Reescrever parágrafo com IA">
          <Wand2 size={13} />
          <span className="text-[11px] font-medium">Reescrever</span>
        </button>
      )}
      {onSuperComplete && (
        <button onClick={onSuperComplete}
          className="p-1.5 rounded transition-colors text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 flex items-center gap-1"
          title="Super Completar com IA">
          <Sparkles size={13} />
          <span className="text-[11px] font-medium">Super Completar</span>
        </button>
      )}
    </div>
  );
};
