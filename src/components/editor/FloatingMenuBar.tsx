import React, { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { Type, Heading1, Heading2, Heading3, Quote, Code, List, ListOrdered, CheckSquare, Table, Minus } from 'lucide-react';

interface Props { editor: Editor; onInsertTable: () => void }

export const FloatingMenuBar: React.FC<Props> = ({ editor, onInsertTable }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const update = () => {
      const { from, empty } = editor.state.selection;
      if (!empty) { setVisible(false); return; }
      const node = editor.state.doc.nodeAt(from);
      const isEmptyPara = node === null && editor.state.doc.resolve(from).parent.textContent === '';
      if (!isEmptyPara) { setVisible(false); return; }
      const coords = editor.view.coordsAtPos(from);
      setPos({ top: coords.top - 2, left: coords.left - 36 });
      setVisible(true);
    };
    editor.on('selectionUpdate', update);
    editor.on('update', update);
    return () => { editor.off('selectionUpdate', update); editor.off('update', update); };
  }, [editor]);

  if (!visible) return null;

  const items = [
    { icon: <Type size={13} />, title: 'Parágrafo', action: () => editor.chain().focus().setParagraph().run() },
    { icon: <Heading1 size={13} />, title: 'Título 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: <Heading2 size={13} />, title: 'Título 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: <Heading3 size={13} />, title: 'Título 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: <Quote size={13} />, title: 'Citação', action: () => editor.chain().focus().toggleBlockquote().run() },
    { icon: <Code size={13} />, title: 'Código', action: () => editor.chain().focus().toggleCodeBlock().run() },
    { icon: <List size={13} />, title: 'Lista', action: () => editor.chain().focus().toggleBulletList().run() },
    { icon: <ListOrdered size={13} />, title: 'Lista numerada', action: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: <CheckSquare size={13} />, title: 'Lista de tarefas', action: () => editor.chain().focus().toggleTaskList().run() },
    { icon: <Table size={13} />, title: 'Tabela', action: onInsertTable },
    { icon: <Minus size={13} />, title: 'Linha horizontal', action: () => editor.chain().focus().setHorizontalRule().run() },
  ];

  return (
    <div
      className="floating-menu fixed z-40 flex items-center gap-0.5 bg-gray-900 border border-gray-700 rounded-lg px-1 py-1 shadow-xl"
      style={{ top: pos.top, left: pos.left, transform: 'translateY(-50%)' }}
      onMouseDown={e => e.preventDefault()}
    >
      {items.map((item, i) => (
        <button key={i} onClick={item.action}
          className="p-1 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          title={item.title} aria-label={item.title}>
          {item.icon}
        </button>
      ))}
    </div>
  );
};
