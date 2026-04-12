import React, { useState, useEffect } from 'react';
import { KeyRound, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { getAIConfig, saveAIConfig, isEnvKeyConfigured } from '../../config/aiConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const envConfigured = isEnvKeyConfigured();

  useEffect(() => {
    if (isOpen) {
      const cfg = getAIConfig();
      setApiKey(envConfigured ? '' : cfg.openaiApiKey);
      setModel(cfg.model);
      setSaved(false);
    }
  }, [isOpen, envConfigured]);

  const handleSave = () => {
    saveAIConfig({ openaiApiKey: apiKey.trim(), model: model.trim() || 'gpt-4o-mini' });
    setSaved(true);
    setTimeout(onClose, 800);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações da IA" width="max-w-md">
      <div className="space-y-4">

        {/* Chave configurada via .env */}
        {envConfigured ? (
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-800 mb-0.5">
                Chave configurada via variável de ambiente
              </p>
              <p className="text-xs text-green-700 leading-relaxed">
                A chave da API está definida em <code className="bg-green-100 px-1 rounded">.env</code> (VITE_OPENAI_API_KEY).
                Nenhuma ação necessária.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <KeyRound size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Insira sua chave de API da OpenAI. Ela é armazenada apenas no seu navegador
              e nunca enviada a nenhum servidor além da própria OpenAI.
            </p>
          </div>
        )}

        {/* Campos — só editáveis quando não há .env */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Chave de API (OpenAI)
          </label>
          {envConfigured ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-500">
              <span>sk-••••••••••••••••••••••••</span>
              <span className="ml-auto text-[10px] text-green-600 font-medium bg-green-100 px-1.5 py-0.5 rounded">via .env</span>
            </div>
          ) : (
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          )}
          {!envConfigured && (
            <p className="text-[11px] text-gray-400 mt-1">
              Obtenha em: platform.openai.com → API keys
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            disabled={envConfigured}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Padrão: <code className="bg-gray-100 px-1 rounded">gpt-4o-mini</code>.
            {envConfigured
              ? <> Para trocar, altere <code className="bg-gray-100 px-1 rounded">VITE_OPENAI_MODEL</code> no <code className="bg-gray-100 px-1 rounded">.env</code>.</>
              : <> Atualize para <code className="bg-gray-100 px-1 rounded">gpt-5-mini</code> quando disponível.</>
            }
          </p>
        </div>

        {!envConfigured && (
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            <Save size={15} />
            {saved ? 'Salvo!' : 'Salvar configurações'}
          </button>
        )}

        {envConfigured && (
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        )}
      </div>
    </Modal>
  );
};
