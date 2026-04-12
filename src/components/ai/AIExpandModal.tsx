import React, { useState } from 'react';
import { Loader2, Check, X, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { superCompleteWithAI } from '../../services/aiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  prevText: string;
  nextText: string;
  bookTitle: string;
  chapterTitle: string;
  author: string;
  genre: string;
  languages: string[];
  onAccept: (newText: string) => void;
}

export const AIExpandModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedText,
  prevText,
  nextText,
  bookTitle,
  chapterTitle,
  author,
  genre,
  languages,
  onAccept,
}) => {
  const [paragraphCount, setParagraphCount] = useState(3);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult('');
    try {
      const text = await superCompleteWithAI(
        selectedText,
        prevText,
        nextText,
        bookTitle,
        chapterTitle,
        author,
        genre,
        languages,
        paragraphCount,
      );
      setResult(text.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult('');
    setError('');
    onClose();
  };

  const handleAccept = () => {
    if (result) {
      onAccept(result);
      handleClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Super Completar com IA" width="max-w-2xl">
      <div className="space-y-4">
        {/* Trecho selecionado */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Trecho selecionado
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed max-h-28 overflow-y-auto">
            {selectedText}
          </div>
        </div>

        {/* Controle de quantidade */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
            Parágrafos a gerar:
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setParagraphCount(c => Math.max(1, c - 1))}
              disabled={loading || paragraphCount <= 1}
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm disabled:opacity-40"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-semibold text-gray-800">
              {paragraphCount}
            </span>
            <button
              onClick={() => setParagraphCount(c => Math.min(10, c + 1))}
              disabled={loading || paragraphCount >= 10}
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm disabled:opacity-40"
            >
              +
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading
              ? <Loader2 size={15} className="animate-spin" />
              : <Sparkles size={15} />}
            {result ? 'Gerar novamente' : 'Gerar'}
          </button>
        </div>

        {/* Resultado */}
        {loading && (
          <div className="flex items-center gap-2 py-6 justify-center text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Gerando conteúdo...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && !loading && (
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Sparkles size={13} /> Conteúdo gerado
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-gray-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
              {result}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-1">
          {result && !loading && (
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Check size={15} /> Inserir no texto
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <X size={15} /> Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};
