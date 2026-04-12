import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Quando o cursor entra em um bloco vazio (parágrafo ou heading),
 * herda o fontFamily do último caractere digitado antes desse bloco,
 * evitando que o usuário precise reselecionar a fonte após apagar e redigitar.
 */
export const FontInheritance = Extension.create({
  name: 'fontInheritance',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('fontInheritance'),

        appendTransaction(transactions, _oldState, newState) {
          const changed = transactions.some(tr => tr.selectionSet || tr.docChanged);
          if (!changed) return null;

          const { selection, doc, schema } = newState;
          const textStyleType = schema.marks['textStyle'];
          if (!textStyleType) return null;

          // Somente cursor colapsado
          if (!selection.empty) return null;

          const { $from } = selection;

          // Somente em blocos de texto vazios
          if ($from.parent.content.size > 0) return null;

          // Se já há um TextStyle nos storedMarks (usuário escolheu explicitamente), não sobrescreve
          const stored = newState.storedMarks ?? [];
          if (stored.some(m => m.type === textStyleType)) return null;

          // Percorre o documento até o início do bloco atual buscando o último fontFamily usado
          const blockStart = $from.before($from.depth);
          if (blockStart <= 0) return null;

          let fontFamily: string | null = null;
          doc.nodesBetween(0, blockStart, node => {
            if (node.isText) {
              const m = node.marks.find(mk => mk.type === textStyleType && mk.attrs.fontFamily);
              if (m) fontFamily = m.attrs.fontFamily as string;
            }
            return true;
          });

          if (!fontFamily) return null;

          const mark = textStyleType.create({ fontFamily });
          return newState.tr.setStoredMarks([...stored, mark]);
        },
      }),
    ];
  },
});
