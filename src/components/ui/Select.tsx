import React from 'react';

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<Props> = ({ label, options, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
    <select
      className={`border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white ${className}`}
      {...props}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);
