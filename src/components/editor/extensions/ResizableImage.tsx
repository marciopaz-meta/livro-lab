import React, { useRef, useCallback } from 'react';
import { Image } from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

type Corner = 'nw' | 'ne' | 'sw' | 'se';
type Side = 'w' | 'e';
type Align = 'left' | 'center' | 'right';

const HANDLE_SIZE = 10;

const cornerStyle = (c: Corner): React.CSSProperties => ({
  position: 'absolute',
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  background: '#fff',
  border: '2px solid #6366f1',
  borderRadius: 2,
  cursor: `${c}-resize`,
  pointerEvents: 'all',
  zIndex: 10,
  ...(c.includes('n') ? { top: -HANDLE_SIZE / 2 } : { bottom: -HANDLE_SIZE / 2 }),
  ...(c.includes('w') ? { left: -HANDLE_SIZE / 2 } : { right: -HANDLE_SIZE / 2 }),
});

const sideStyle = (s: Side): React.CSSProperties => ({
  position: 'absolute',
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  background: '#fff',
  border: '2px solid #6366f1',
  borderRadius: 2,
  cursor: 'ew-resize',
  pointerEvents: 'all',
  zIndex: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  ...(s === 'w' ? { left: -HANDLE_SIZE / 2 } : { right: -HANDLE_SIZE / 2 }),
});

// NodeViewWrapper externo: ocupa a linha toda, só define o alinhamento via flex
const outerStyle: Record<Align, React.CSSProperties> = {
  left:   { display: 'flex', justifyContent: 'flex-start' },
  center: { display: 'flex', justifyContent: 'center'     },
  right:  { display: 'flex', justifyContent: 'flex-end'   },
};

// ─── NodeView ─────────────────────────────────────────────────────────────────

const ResizableImageView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  const startResize = useCallback(
    (e: React.MouseEvent, isLeft: boolean) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startW = imgRef.current?.offsetWidth ?? (node.attrs.width as number | null) ?? 300;

      const onMove = (ev: MouseEvent) => {
        const delta = isLeft ? startX - ev.clientX : ev.clientX - startX;
        updateAttributes({ width: Math.max(40, Math.round(startW + delta)) });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.attrs.width, updateAttributes],
  );

  const w     = node.attrs.width as number | null;
  const align = (node.attrs.align as Align | null) ?? 'center';

  return (
    // NodeViewWrapper ocupa a linha toda, alinha via flexbox
    <NodeViewWrapper style={{ ...outerStyle[align], lineHeight: 0, userSelect: 'none' }}>

      {/* Div interno abraça a imagem — é ele que recebe handles e toolbar */}
      <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>

        {/* Toolbar de alinhamento — posicionada acima do div interno */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 6,
              display: 'flex',
              gap: 2,
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 6,
              padding: '3px 4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              zIndex: 20,
              whiteSpace: 'nowrap',
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {([
              { a: 'left'   as Align, Icon: AlignLeft,   title: 'Alinhar à esquerda' },
              { a: 'center' as Align, Icon: AlignCenter,  title: 'Centralizar'        },
              { a: 'right'  as Align, Icon: AlignRight,   title: 'Alinhar à direita'  },
            ]).map(({ a, Icon, title }) => (
              <button
                key={a}
                title={title}
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateAttributes({ align: a });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: align === a ? 'rgba(99,102,241,0.35)' : 'transparent',
                  color: align === a ? '#a5b4fc' : '#9ca3af',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        )}

        <img
          ref={imgRef}
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) ?? ''}
          title={(node.attrs.title as string) ?? ''}
          style={w ? { width: w, maxWidth: '100%', display: 'block' } : { maxWidth: '100%', display: 'block' }}
          draggable={false}
        />

        {/* Outline + handles — relativos ao div interno (tamanho da imagem) */}
        {selected && (
          <div style={{ position: 'absolute', inset: 0, outline: '2px solid #6366f1', pointerEvents: 'none' }}>
            {(['nw', 'ne', 'sw', 'se'] as Corner[]).map(c => (
              <div key={c} style={cornerStyle(c)} onMouseDown={e => startResize(e, c.includes('w'))} />
            ))}
            {(['w', 'e'] as Side[]).map(s => (
              <div key={s} style={sideStyle(s)} onMouseDown={e => startResize(e, s === 'w')} />
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

// ─── Extensão ────────────────────────────────────────────────────────────────

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: el => {
          const w = el.getAttribute('width') || el.style.width?.replace('px', '');
          return w ? Number(w) : null;
        },
        renderHTML: attrs =>
          attrs.width ? { width: attrs.width, style: `width: ${attrs.width}px` } : {},
      },
      align: {
        default: 'center',
        parseHTML: el => el.getAttribute('data-align') ?? 'center',
        renderHTML: attrs => ({ 'data-align': attrs.align ?? 'center' }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
