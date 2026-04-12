import React, { useState } from 'react';

interface Props {
  content: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<Props> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
          {content}
        </div>
      )}
    </div>
  );
};
