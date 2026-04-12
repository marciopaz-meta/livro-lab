import { Node, mergeAttributes } from '@tiptap/core';

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-break',
        class: 'page-break',
        contenteditable: 'false',
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        const { state } = this.editor;
        const { $from } = state.selection;

        return this.editor
          .chain()
          .command(({ tr, state: s }) => {
            const pageBreakNode = s.schema.nodes.pageBreak.create();
            const paragraphNode = s.schema.nodes.paragraph.create();
            const isEmptyBlock =
              $from.parent.textContent === '' &&
              $from.parent.type.name === 'paragraph';

            if (isEmptyBlock) {
              // Replace the current empty paragraph with [pageBreak, paragraph]
              const start = $from.before($from.depth);
              const end   = $from.after($from.depth);
              tr.replaceWith(start, end, [pageBreakNode, paragraphNode]);
            } else {
              // Insert [pageBreak, paragraph] after the current block
              const end = $from.after($from.depth);
              tr.insert(end, [pageBreakNode, paragraphNode]);
            }
            return true;
          })
          .run();
      },
    };
  },
});
