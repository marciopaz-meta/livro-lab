import React, { useState } from 'react';
import { Loader2, Check, X, Wand2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { rewriteParagraphWithAI } from '../../services/aiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  prevText: string;
  nextText: string;
  languages: string[];
  onAccept: (newText: string) => void;
}

export const AIRewriteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  originalText,
  prevText,
  nextText,
  languages,
  onAccept,
}) => {
  const [rewritten, setRewritten] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRewrite = async () => {
    setLoading(true);
    setError('');
    setRewritten('');
    try {
      const result = await rewriteParagraphWithAI(originalText, prevText, nextText, languages);
      // Remove aspas iniciais/finais que o modelo às vezes adiciona
      setRewritten(result.replace(/^[""]|[""]$/g, '').trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRewritten('');
    setError('');
    onClose();
  };

  const handleAccept = () => {
    if (rewritten) {
      onAccept(rewritten);
      handleClose();
    }
  };

  // Solicita automaticamente ao abrir
  React.useEffect(() => {
    if (isOpen && originalText) {
      handleRewrite();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reescrever parágrafo com IA" width="max-w-2xl">
      <div className="space-y-4">
        {/* Original */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Original
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed max-h-36 overflow-y-auto">
            {originalText}
          </div>
        </div>

        {/* Sugestão IA */}
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Wand2 size={13} /> Sugestão da IA
          </p>

          {loading && (
            <div className="flex items-center gap-2 py-6 justify-center text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Reescrevendo...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {rewritten && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-gray-800 leading-relaxed max-h-36 overflow-y-auto">
              {rewritten}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-1">
          {rewritten && !loading && (
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              <Check size={15} /> Aceitar sugestão
            </button>
          )}
          <button
            onClick={handleRewrite}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            Nova sugestão
          </button>
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
