/**
 * Configuração da IA — prioridade:
 *  1. Variável de ambiente VITE_OPENAI_API_KEY (definida no arquivo .env do projeto)
 *  2. localStorage (fallback para configuração manual via modal)
 */

const STORAGE_KEY = 'livro-lab-ai-config';

export interface AIConfig {
  openaiApiKey: string;
  /** Modelo. Padrão: gpt-4o-mini. Atualize para gpt-5-mini quando disponível. */
  model: string;
}

/** Chave injetada em tempo de build (arquivo .env na raiz do projeto) */
const ENV_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const ENV_MODEL   = import.meta.env.VITE_OPENAI_MODEL   as string | undefined;

const DEFAULT_CONFIG: AIConfig = {
  openaiApiKey: '',
  model: 'gpt-4o-mini',
};

export function getAIConfig(): AIConfig {
  // Variável de ambiente tem prioridade absoluta
  if (ENV_API_KEY?.trim()) {
    return {
      openaiApiKey: ENV_API_KEY.trim(),
      model: ENV_MODEL?.trim() || DEFAULT_CONFIG.model,
    };
  }

  // Fallback: localStorage (configuração manual pelo usuário)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

/** Salva no localStorage (só usado quando a chave NÃO vem do .env) */
export function saveAIConfig(partial: Partial<AIConfig>): void {
  if (ENV_API_KEY?.trim()) return; // .env tem prioridade, não sobrescreve
  const current = getAIConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...partial }));
}

export function hasAPIKey(): boolean {
  return !!getAIConfig().openaiApiKey.trim();
}

/** True quando a chave vem do arquivo .env (projeto), false quando é manual */
export function isEnvKeyConfigured(): boolean {
  return !!ENV_API_KEY?.trim();
}
