import React from 'react';

interface Props {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ToolbarButton: React.FC<Props> = ({ onClick, active, disabled, title, children, className = '' }) => (
  <button
    onMouseDown={e => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={`p-1.5 rounded text-sm transition-colors duration-100 flex items-center justify-center ${
      active
        ? 'bg-amber-500/30 text-amber-300'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);
