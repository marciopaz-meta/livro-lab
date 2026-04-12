import { Mark, mergeAttributes } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import type { AICorrection } from '../../../services/aiService';

/** Cores por tipo de correção */
const TYPE_COLORS: Record<string, string> = {
  spelling: '#ef4444',
  grammar: '#f97316',
  punctuation: '#eab308',
  agreement: '#8b5cf6',
  clarity: '#3b82f6',
};

export const AICorrectionMark = Mark.create({
  name: 'aiCorrection',

  addAttributes() {
    return {
      id: { default: null },
      suggestion: { default: '' },
      type: { default: 'spelling' },
      explanation: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-ai-correction]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const color = TYPE_COLORS[HTMLAttributes.type as string] ?? '#ef4444';
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-ai-correction': 'true',
        'data-ai-id': HTMLAttributes.id,
        'data-ai-suggestion': HTMLAttributes.suggestion,
        'data-ai-type': HTMLAttributes.type,
        'data-ai-explanation': HTMLAttributes.explanation,
        style: `text-decoration: underline wavy ${color}; text-decoration-skip-ink: none; cursor: pointer;`,
        class: 'ai-correction-mark',
      }),
      0,
    ];
  },
});

// ─── Helpers para aplicar/remover marcas no documento ───────────────────────

export interface DocParagraph {
  index: number;
  text: string;
  from: number;
  to: number;
}

/**
 * Nós complexos a ignorar completamente (não entrar nos filhos).
 * Marks não podem cruzar fronteiras de bloco nesses tipos.
 */
const SKIP_NODE_TYPES = new Set([
  'table', 'tableRow', 'tableCell', 'tableHeader',
  'codeBlock', 'math', 'mathBlock', 'mathDisplay', 'mathInline',
  'image', 'horizontalRule', 'pageBreak', 'stickyNote',
]);

/** Nós folha que contêm texto inline e suportam marks */
const LEAF_TEXT_TYPES = new Set(['paragraph', 'heading']);

/**
 * Travessia recursiva do documento extraindo somente nós folha de texto
 * (paragraph, heading) com suas posições absolutas.
 * Containers (lists, blockquote, listItem…) são percorridos sem virar entrada.
 * Tabelas, blocos de código e outros complexos são pulados inteiramente.
 */
export function extractDocParagraphs(doc: ProseMirrorNode): DocParagraph[] {
  const result: DocParagraph[] = [];
  let index = 0;

  function traverse(node: ProseMirrorNode, nodeStart: number): void {
    if (SKIP_NODE_TYPES.has(node.type.name)) return;

    if (LEAF_TEXT_TYPES.has(node.type.name)) {
      const text = node.textContent;
      if (text.trim()) {
        result.push({ index: index++, text, from: nodeStart + 1, to: nodeStart + node.nodeSize - 1 });
      }
      return;
    }

    // Nó container (bulletList, orderedList, listItem, taskItem, blockquote…): desce
    node.forEach((child, childOffset) => {
      traverse(child, nodeStart + 1 + childOffset);
    });
  }

  // Filhos diretos do doc: offset já é posição absoluta
  doc.forEach((node, offset) => traverse(node, offset));

  return result;
}

/** Encontra posição absoluta de um trecho de texto dentro de um parágrafo */
function findTextInParagraph(
  doc: ProseMirrorNode,
  para: DocParagraph,
  searchText: string,
): { from: number; to: number } | null {
  const startIdx = para.text.indexOf(searchText);
  if (startIdx === -1) return null;

  const endIdx = startIdx + searchText.length;
  let charCount = 0;
  let absFrom = -1;
  let absTo = -1;

  doc.nodesBetween(para.from, para.to, (node, pos) => {
    if (absTo !== -1) return false;        // já encontrou, para tudo
    if (!node.isText) return true;         // nó container: desce nos filhos

    const text = node.text!;
    const len = text.length;

    if (absFrom === -1 && charCount + len > startIdx) {
      absFrom = pos + (startIdx - charCount);
    }
    if (absFrom !== -1 && charCount + len >= endIdx) {
      absTo = pos + (endIdx - charCount);
      return false;
    }
    charCount += len;
    return true;
  });

  if (absFrom === -1 || absTo === -1) return null;
  return { from: absFrom, to: absTo };
}

/** Aplica todas as correções da IA como marcas no documento do editor */
export function applyAICorrections(
  view: EditorView,
  paragraphs: DocParagraph[],
  corrections: AICorrection[],
): void {
  const { state, dispatch } = view;
  let tr = state.tr;
  const markType = state.schema.marks['aiCorrection'];
  if (!markType) return;

  const paraByIndex = new Map<number, DocParagraph>();
  paragraphs.forEach(p => paraByIndex.set(p.index, p));

  corrections.forEach(correction => {
    const para = paraByIndex.get(correction.paragraphIndex);
    if (!para) return;

    const range = findTextInParagraph(state.doc, para, correction.textToCorrect);
    if (!range) return;

    const mark = markType.create({
      id: correction.id,
      suggestion: correction.suggestion,
      type: correction.type,
      explanation: correction.explanation,
    });
    tr = tr.addMark(range.from, range.to, mark);
  });

  dispatch(tr);
}

/** Remove todas as marcas de correção do documento */
export function removeAllAICorrections(view: EditorView): void {
  const { state, dispatch } = view;
  let tr = state.tr;
  const markType = state.schema.marks['aiCorrection'];
  if (!markType) return;
  tr = tr.removeMark(0, state.doc.content.size, markType);
  dispatch(tr);
}

/** Remove a marca de um trecho específico pelo id */
export function removeAICorrectionById(view: EditorView, correctionId: string): void {
  const { state, dispatch } = view;
  let tr = state.tr;
  const markType = state.schema.marks['aiCorrection'];
  if (!markType) return;

  const doc = state.doc;
  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    if (!node.isText) return true;
    node.marks.forEach(mark => {
      if (mark.type === markType && (mark.attrs as { id: string }).id === correctionId) {
        tr = tr.removeMark(pos, pos + node.nodeSize, markType);
      }
    });
    return true;
  });

  dispatch(tr);
}
