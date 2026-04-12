import React, { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  /** When true, renders swatches directly without a toggle button (controlled externally) */
  inline?: boolean;
}

const DEFAULT_COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
  '#1A140E', '#C9903F', '#5C2D0A', '#1A3A5C',
];

const Swatches: React.FC<{ value: string; onChange: (c: string) => void; colors: string[] }> = ({ value, onChange, colors }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-2 grid grid-cols-4 gap-1.5 w-36">
    {colors.map(c => (
      <button
        key={c}
        onMouseDown={e => e.preventDefault()}
        onClick={() => onChange(c)}
        className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
        style={{ background: c, borderColor: c === value ? '#C9903F' : 'transparent' }}
        title={c}
      />
    ))}
    <input
      type="color"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="col-span-4 h-7 w-full cursor-pointer rounded"
      title="Cor personalizada"
    />
  </div>
);

export const ColorPicker: React.FC<Props> = ({ value, onChange, colors = DEFAULT_COLORS, inline = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inline) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [inline]);

  if (inline) {
    return <Swatches value={value} onChange={onChange} colors={colors} />;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onMouseDown={e => e.preventDefault()}
        onClick={() => setOpen(!open)}
        className="w-6 h-6 rounded border border-gray-300 shadow-sm"
        style={{ background: value }}
        title="Escolher cor"
      />
      {open && (
        <div className="absolute top-8 left-0 z-50">
          <Swatches value={value} onChange={c => { onChange(c); setOpen(false); }} colors={colors} />
        </div>
      )}
    </div>
  );
};
