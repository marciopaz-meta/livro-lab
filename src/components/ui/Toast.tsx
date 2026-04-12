import React, { useEffect, createContext, useContext, useCallback, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: { label: string; onClick: () => void };
}

interface Props {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export const Toast: React.FC<Props> = ({ toasts, onRemove }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
    {toasts.map(t => (
      <ToastItem key={t.id} toast={t} onRemove={onRemove} />
    ))}
  </div>
);

const ToastItem: React.FC<{ toast: ToastData; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const Icon = icons[toast.type];
  const colors = { success: 'bg-green-700', error: 'bg-red-700', info: 'bg-blue-700' };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm shadow-xl min-w-[280px] ${colors[toast.type]}`}>
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button onClick={toast.action.onClick} className="underline text-xs opacity-90 hover:opacity-100">
          {toast.action.label}
        </button>
      )}
      <button onClick={() => onRemove(toast.id)} className="opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
};

interface ToastContextType {
  showToast: (message: string, type?: ToastData['type'], action?: ToastData['action']) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const removeToast = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), []);
  const showToast = useCallback((message: string, type: ToastData['type'] = 'info', action?: ToastData['action']) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, type, action }]);
  }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};
