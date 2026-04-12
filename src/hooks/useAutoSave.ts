import { useCallback, useEffect, useRef, useState } from 'react';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface AutoSaveResult {
  status: SaveStatus;
  forceSave: () => void;
}

export function useAutoSave(
  content: string,
  onSave: (html: string) => void,
  delay = 1000
): AutoSaveResult {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(content);
  const contentRef = useRef(content);
  contentRef.current = content;

  const doSave = useCallback((html: string) => {
    setStatus('saving');
    try {
      onSave(html);
      lastSavedRef.current = html;
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [onSave]);

  const forceSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave(contentRef.current);
  }, [doSave]);

  useEffect(() => {
    if (content === lastSavedRef.current) return;
    setStatus('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(content), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, delay, doSave]);

  useEffect(() => {
    const handler = () => {
      if (contentRef.current !== lastSavedRef.current) {
        onSave(contentRef.current);
        lastSavedRef.current = contentRef.current;
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [onSave]);

  return { status, forceSave };
}
