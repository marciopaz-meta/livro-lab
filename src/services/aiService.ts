import { getAIConfig } from '../config/aiConfig';

export type CorrectionType = 'spelling' | 'grammar' | 'punctuation' | 'agreement' | 'clarity';

export interface AICorrection {
  id: string;
  paragraphIndex: number;
  textToCorrect: string;
  suggestion: string;
  type: CorrectionType;
  explanation: string;
}

export interface ParagraphData {
  index: number;
  text: string;
}

/** Máximo de parágrafos por requisição (≈ chunk de tokens seguro) */
const CHUNK_SIZE = 80;

// JSON Schema para retorno das correções (N1)
const CORRECTIONS_SCHEMA = {
  type: 'object',
  properties: {
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          paragraphIndex: { type: 'number' },
          textToCorrect:  { type: 'string' },
          suggestion:     { type: 'string' },
          type: {
            type: 'string',
            enum: ['spelling', 'grammar', 'punctuation', 'agreement', 'clarity'],
          },
          explanation: { type: 'string' },
        },
        required: ['paragraphIndex', 'textToCorrect', 'suggestion', 'type', 'explanation'],
        additionalProperties: false,
      },
    },
  },
  required: ['corrections'],
  additionalProperties: false,
};

type TextFormat =
  | { type: 'text' }
  | { type: 'json_schema'; name: string; strict: boolean; schema: object };

async function callOpenAIResponses(
  instructions: string,
  userText: string,
  maxTokens: number,
  format: TextFormat,
): Promise<string> {
  const config = getAIConfig();
  if (!config.openaiApiKey.trim()) throw new Error('Chave de API não configurada.');

  const payload = {
    model: config.model,
    reasoning: { effort: 'minimal' },
    max_output_tokens: maxTokens,
    instructions,
    text: {
      verbosity: 'low',
      format,
    },
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: userText }],
      },
    ],
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMsg = `Erro ${response.status}`;
    try {
      const body = await response.json();
      errMsg = body?.error?.message ?? errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const data = await response.json();

  // Responses API: percorre output[] buscando o item type="message"
  // (modelos de reasoning podem ter itens de reasoning antes da mensagem)
  const msgItem = Array.isArray(data.output)
    ? data.output.find((o: { type: string }) => o.type === 'message')
    : undefined;
  return msgItem?.content?.[0]?.text ?? '';
}

// ─── Nível 1: Revisão ortográfica/gramatical ────────────────────────────────

const REVIEW_SYSTEM = (primaryLang: string, additionalLangs: string[]) => {
  const allLangs = [primaryLang, ...additionalLangs];
  const langsNote = additionalLangs.length > 0
    ? `O texto pode conter trechos em mais de um idioma: ${allLangs.join(', ')}. \
Verifique ortografia, gramática e pontuação em CADA idioma conforme suas próprias regras — \
NÃO trate palavras de um idioma como erros de outro.`
    : `O texto está em ${primaryLang}.`;
  return `\
Você é um editor literário profissional especializado em revisão multilíngue. ${langsNote}

Analise o texto e identifique problemas de: ortografia, gramática, pontuação, \
concordância nominal/verbal e clareza (apenas melhorias substanciais).

REGRAS OBRIGATÓRIAS:
1. "textToCorrect" deve ser o TRECHO EXATO como aparece no texto (incluindo maiúsculas e espaços).
2. "suggestion" deve substituir diretamente o "textToCorrect" no texto.
3. Marque apenas erros reais ou melhorias que tornam o texto visivelmente melhor.
4. Para "clarity", seja conservador — apenas quando melhora substancialmente a leitura.
5. Se não houver problemas, retorne corrections como array vazio.`;
};

export async function checkTextWithAI(
  paragraphs: ParagraphData[],
  languages: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<AICorrection[]> {
  const primaryLang = languages[0] ?? 'Português';
  const additionalLangs = languages.slice(1);
  const systemMsg = REVIEW_SYSTEM(primaryLang, additionalLangs);

  // Filtra parágrafos vazios antes de dividir em chunks
  const nonEmpty = paragraphs.filter(p => p.text.trim().length > 2);

  const chunks: ParagraphData[][] = [];
  for (let i = 0; i < nonEmpty.length; i += CHUNK_SIZE) {
    chunks.push(nonEmpty.slice(i, i + CHUNK_SIZE));
  }

  const all: AICorrection[] = [];
  let counter = 0;

  for (let ci = 0; ci < chunks.length; ci++) {
    onProgress?.(ci, chunks.length);
    const chunk = chunks[ci];
    const body = chunk.map(p => `[Parágrafo ${p.index}]: ${p.text}`).join('\n\n');

    try {
      const raw = await callOpenAIResponses(
        systemMsg,
        body,
        4000,
        { type: 'json_schema', name: 'livraria_correcoes', strict: true, schema: CORRECTIONS_SCHEMA },
      );
      const parsed = (JSON.parse(raw) as { corrections: Omit<AICorrection, 'id'>[] }).corrections;
      parsed.forEach(c => {
        all.push({ ...c, id: `ai-${Date.now()}-${++counter}` });
      });
    } catch (err) {
      console.error(`[AIService] Erro no chunk ${ci}:`, err);
    }
  }

  onProgress?.(chunks.length, chunks.length);
  return all;
}

// ─── Nível 2: Reescrita leve de parágrafo ───────────────────────────────────

const REWRITE_SYSTEM = (primaryLang: string, additionalLangs: string[]) => {
  const allLangs = [primaryLang, ...additionalLangs].join(', ');
  return `\
Você é um editor literário especializado em melhorar fluidez e clareza de textos literários.

Idiomas configurados no livro: ${allLangs}.
IMPORTANTE: Detecte o idioma predominante do parágrafo a reescrever e reescreva-o NESSE MESMO idioma — \
nunca traduza nem mude o idioma do parágrafo.

Sua tarefa: Reescrever levemente o parágrafo indicado para melhorar sua fluidez e clareza, \
mantendo o mesmo significado, a voz do autor e a extensão similar ao original. \
Considere o contexto dos parágrafos adjacentes para garantir coerência.

Retorne SOMENTE o parágrafo reescrito, sem aspas, sem explicações, sem formatação extra.`;
};

export async function rewriteParagraphWithAI(
  paragraph: string,
  prevParagraph: string,
  nextParagraph: string,
  languages: string[],
): Promise<string> {
  const primaryLang = languages[0] ?? 'Português';
  const additionalLangs = languages.slice(1);

  const parts: string[] = [];
  if (prevParagraph.trim()) {
    parts.push(`Parágrafo anterior (contexto): "${prevParagraph.trim()}"`);
  }
  parts.push(`Parágrafo a reescrever: "${paragraph.trim()}"`);
  if (nextParagraph.trim()) {
    parts.push(`Próximo parágrafo (contexto): "${nextParagraph.trim()}"`);
  }

  return await callOpenAIResponses(
    REWRITE_SYSTEM(primaryLang, additionalLangs),
    parts.join('\n\n'),
    1500,
    { type: 'text' },
  );
}

// ─── Nível 3: Super Completar (expansão de conteúdo) ─────────────────────────

const SUPER_COMPLETE_SYSTEM = (
  primaryLang: string,
  additionalLangs: string[],
  bookTitle: string,
  chapterTitle: string,
  author: string,
  genre: string,
) => {
  const genreNote = genre ? ` | Gênero: ${genre}` : '';
  return `\
Você é um escritor ghost-writer especializado em continuar textos literários.

Livro: "${bookTitle}"${genreNote} | Capítulo: "${chapterTitle}" | Autor: ${author}
Idioma principal: ${primaryLang}${additionalLangs.length > 0 ? ` | Idiomas adicionais: ${additionalLangs.join(', ')}` : ''}

Detecte o idioma predominante do trecho selecionado e gere a continuação NESSE MESMO idioma, \
mantendo coerência com o idioma principal do livro (${primaryLang}) para o restante da narrativa.

Sua tarefa: gerar novos parágrafos que expandam naturalmente o trecho selecionado, \
mantendo o estilo, a voz e o tom do autor, com coerência narrativa em relação ao contexto e ao gênero da obra.

REGRAS:
1. Gere exatamente o número de parágrafos solicitado.
2. Mantenha o mesmo nível de formalidade e vocabulário do original.
3. Cada parágrafo deve ser separado por uma linha em branco.
4. NÃO use travessão longo (—) nem meia-risca (–); o hífen comum (-) é permitido.
5. Retorne SOMENTE os novos parágrafos, sem títulos, sem numeração, sem explicações.`;
};

export async function superCompleteWithAI(
  selectedText: string,
  prevContext: string,
  nextContext: string,
  bookTitle: string,
  chapterTitle: string,
  author: string,
  genre: string,
  languages: string[],
  paragraphCount: number,
): Promise<string> {
  const primaryLang = languages[0] ?? 'Português';
  const additionalLangs = languages.slice(1);

  const parts: string[] = [];
  if (prevContext.trim()) {
    parts.push(`Contexto anterior:\n"${prevContext.trim()}"`);
  }
  parts.push(`Trecho selecionado (expanda a partir daqui):\n"${selectedText.trim()}"`);
  if (nextContext.trim()) {
    parts.push(`Contexto posterior:\n"${nextContext.trim()}"`);
  }
  parts.push(`Gere ${paragraphCount} novo(s) parágrafo(s) de continuação.`);

  return await callOpenAIResponses(
    SUPER_COMPLETE_SYSTEM(primaryLang, additionalLangs, bookTitle, chapterTitle, author, genre),
    parts.join('\n\n'),
    paragraphCount * 300,
    { type: 'text' },
  );
}
