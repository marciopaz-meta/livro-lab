import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, Check, X, FileText } from 'lucide-react';
import type { Chapter } from '../../types';

interface Props {
  chapter: Chapter;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export const ChapterItem: React.FC<Props> = ({ chapter, isActive, onClick, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleConfirmRename = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    } else {
      setEditTitle(chapter.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmRename();
    if (e.key === 'Escape') { setEditTitle(chapter.title); setIsEditing(false); }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-amber-500/20 text-white border border-amber-500/30'
          : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-transparent'
      }`}
      onClick={() => { if (!isEditing) onClick(); }}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing flex-shrink-0 p-0.5 text-gray-500"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </button>

      <FileText size={13} className="flex-shrink-0 opacity-60" />

      {/* Title or edit input */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-gray-600 text-gray-100 text-xs px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button onClick={handleConfirmRename} className="text-green-400 hover:text-green-300 p-0.5">
            <Check size={12} />
          </button>
          <button onClick={() => { setEditTitle(chapter.title); setIsEditing(false); }} className="text-red-400 hover:text-red-300 p-0.5">
            <X size={12} />
          </button>
        </div>
      ) : (
        <span className="flex-1 text-xs truncate">{chapter.title}</span>
      )}

      {/* Word count */}
      {!isEditing && (
        <span className="text-[10px] text-gray-600 group-hover:text-gray-500 flex-shrink-0">
          {chapter.wordCount}p
        </span>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setIsEditing(true); }}
            className="p-0.5 text-gray-500 hover:text-gray-200 transition-colors"
            title="Renomear"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-0.5 text-gray-500 hover:text-red-400 transition-colors"
            title="Excluir capítulo"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
};
