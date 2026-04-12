import React, { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Link, Unlink, Highlighter, Wand2, Sparkles } from 'lucide-react';

interface Props {
  editor: Editor;
  onRewriteParagraph?: () => void;
  onSuperComplete?: () => void;
}

export const BubbleMenuBar: React.FC<Props> = ({ editor, onRewriteParagraph, onSuperComplete }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const showLinkPopoverRef = useRef(false);

  const setLinkPopover = (val: boolean) => {
    showLinkPopoverRef.current = val;
    setShowLinkPopover(val);
  };

  useEffect(() => {
    const update = () => {
      const { from, to } = editor.state.selection;
      if (from === to) { setVisible(false); setLinkPopover(false); return; }
      const view = editor.view;
      const start = view.coordsAtPos(from);
      setPos({ top: start.top - 50, left: (start.left + view.coordsAtPos(to).left) / 2 });
      setVisible(true);
    };
    editor.on('selectionUpdate', update);
    editor.on('blur', () => { if (!showLinkPopoverRef.current) setVisible(false); });
    return () => { editor.off('selectionUpdate', update); };
  }, [editor]);

  const openLinkPopover = () => {
    const href = editor.getAttributes('link').href || '';
    setLinkUrl(href);
    setLinkPopover(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkPopover(false);
  };

  if (!visible) return null;

  return (
    <div
      className="bubble-menu fixed z-40 flex items-center gap-0.5 bg-gray-900 border border-gray-700 rounded-lg px-1 py-1 shadow-xl"
      style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
      onMouseDown={e => e.preventDefault()}
    >
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
          onClick={() => { if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); } else { openLinkPopover(); } }}
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
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => setLinkPopover(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={applyLink}
                className="px-2.5 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
      <button onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('highlight') ? 'bg-amber-500/30 text-amber-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
        title="Highlight"><Highlighter size={14} /></button>

      {(onRewriteParagraph || onSuperComplete) && (
        <div className="w-px h-4 bg-gray-600 mx-1" />
      )}
      {onRewriteParagraph && (
        <button
          onClick={onRewriteParagraph}
          className="p-1.5 rounded transition-colors text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 flex items-center gap-1"
          title="Reescrever parágrafo com IA"
        >
          <Wand2 size={13} />
          <span className="text-[11px] font-medium">Reescrever</span>
        </button>
      )}
      {onSuperComplete && (
        <button
          onClick={onSuperComplete}
          className="p-1.5 rounded transition-colors text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 flex items-center gap-1"
          title="Super Completar com IA"
        >
          <Sparkles size={13} />
          <span className="text-[11px] font-medium">Super Completar</span>
        </button>
      )}
    </div>
  );
};
