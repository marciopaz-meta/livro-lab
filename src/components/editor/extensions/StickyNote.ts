import { Node, mergeAttributes } from '@tiptap/core';

export const StickyNote = Node.create({
  name: 'stickyNote',
  group: 'block',
  content: 'inline*',
  atom: false,
  addAttributes() {
    return {
      color: {
        default: 'yellow',
        parseHTML: el => el.getAttribute('data-color'),
        renderHTML: attrs => ({ 'data-color': attrs.color }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="sticky-note"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const colorMap: Record<string, string> = {
      yellow: '#fffde7',
      green: '#e8f5e9',
      blue: '#e3f2fd',
      pink: '#fce4ec',
    };
    const bg = colorMap[HTMLAttributes['data-color']] || colorMap.yellow;
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'sticky-note',
      class: 'sticky-note',
      style: `background:${bg}`,
    }), 0];
  },
});
