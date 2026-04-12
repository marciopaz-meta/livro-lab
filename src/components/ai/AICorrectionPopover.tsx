import React, { useEffect, useRef } from 'react';
import { Check, X, Info } from 'lucide-react';
import type { PopoverState } from '../../store/useAIStore';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  spelling: { label: 'Ortografia', color: '#ef4444' },
  grammar: { label: 'Gramática', color: '#f97316' },
  punctuation: { label: 'Pontuação', color: '#eab308' },
  agreement: { label: 'Concordância', color: '#8b5cf6' },
  clarity: { label: 'Clareza', color: '#3b82f6' },
};

interface Props {
  popover: PopoverState;
  onAccept: (correctionId: string, suggestion: string) => void;
  onIgnore: (correctionId: string) => void;
  onClose: () => void;
}

export const AICorrectionPopover: React.FC<Props> = ({
  popover,
  onAccept,
  onIgnore,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const meta = TYPE_LABELS[popover.type] ?? { label: popover.type, color: '#94a3b8' };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Pequeno delay para não fechar imediatamente após abrir
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  // Posiciona abaixo do texto marcado, ajustando para não sair da tela
  const top = popover.anchorRect.top + 28;
  let left = popover.anchorRect.left;
  const popoverWidth = 280;
  if (left + popoverWidth > window.innerWidth - 12) {
    left = window.innerWidth - popoverWidth - 12;
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-3.5 w-72"
      style={{ top, left }}
    >
      {/* Tipo de correção */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
          style={{ background: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-[10px] text-gray-400 ml-auto">Sugestão IA</span>
      </div>

      {/* Sugestão */}
      <p className="text-sm font-medium text-gray-800 mb-1 leading-snug">
        {popover.suggestion}
      </p>

      {/* Explicação */}
      {popover.explanation && (
        <div className="flex items-start gap-1 mb-3">
          <Info size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-gray-500 leading-relaxed">{popover.explanation}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(popover.correctionId, popover.suggestion)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700 transition-colors font-medium"
        >
          <Check size={13} /> Aceitar
        </button>
        <button
          onClick={() => onIgnore(popover.correctionId)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <X size={13} /> Ignorar
        </button>
      </div>
    </div>
  );
};
