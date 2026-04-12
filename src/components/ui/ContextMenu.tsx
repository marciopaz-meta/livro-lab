import React, { useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

interface Props {
  items: MenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<Props> = ({ items, x, y, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => item.separator
        ? <div key={i} className="border-t border-gray-100 my-1" />
        : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${item.danger ? 'text-red-600' : 'text-gray-700'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
    </div>
  );
};
