import React from 'react';
import { CheckCircle, Loader, CloudOff } from 'lucide-react';

interface Props {
  words: number;
  chars: number;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
}

export const WordCounter: React.FC<Props> = ({ words, chars, saveStatus }) => {
  const statusIcon = {
    saved: <CheckCircle size={12} className="text-green-400" />,
    saving: <Loader size={12} className="text-amber-400 animate-spin" />,
    unsaved: <Loader size={12} className="text-gray-400" />,
    error: <CloudOff size={12} className="text-red-400" />,
  };
  const statusText = {
    saved: 'Salvo',
    saving: 'Salvando...',
    unsaved: 'Não salvo',
    error: 'Erro ao salvar',
  };
  return (
    <div className="flex items-center gap-4 text-xs text-gray-400 select-none">
      <span>{words} palavras · {chars} caracteres</span>
      <span className="flex items-center gap-1">
        {statusIcon[saveStatus]}
        {statusText[saveStatus]}
      </span>
    </div>
  );
};
