import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, FileCode, File, X, CheckCircle2,
  BookOpen, Layers, AlertCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useBookStore } from '../../store/useBookStore';
import { useToast } from '../ui/Toast';
import { importDocx, importEpub, importPdf } from '../../services/importService';
import type { ImportedBook } from '../../services/importService';
import { DEFAULT_PRINT_SETTINGS } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'pick' | 'loading' | 'preview' | 'error';

interface FileType {
  ext: string;
  label: string;
  mime: string;
  icon: React.ElementType;
  color: string;
}

const FILE_TYPES: FileType[] = [
  { ext: 'docx', label: 'Word (.docx)', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: FileText, color: 'text-blue-500' },
  { ext: 'epub', label: 'ePub (.epub)', mime: 'application/epub+zip', icon: FileCode, color: 'text-green-500' },
  { ext: 'pdf',  label: 'PDF (.pdf)',   mime: 'application/pdf',      icon: File,     color: 'text-red-500'  },
];

const ACCEPTED = FILE_TYPES.map(t => `.${t.ext}`).join(',');

export const ImportBookModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createBook } = useBookStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('pick');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [imported, setImported] = useState<ImportedBook | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('pick');
    setProgress(0);
    setErrorMsg('');
    setImported(null);
    setFileName('');
    setDragging(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['docx', 'epub', 'pdf'].includes(ext ?? '')) {
      setErrorMsg(`Formato não suportado: .${ext}. Use .docx, .epub ou .pdf.`);
      setStep('error');
      return;
    }

    setFileName(file.name);
    setStep('loading');
    setProgress(10);

    try {
      let result: ImportedBook;
      if (ext === 'docx') {
        setProgress(40);
        result = await importDocx(file);
        setProgress(100);
      } else if (ext === 'epub') {
        setProgress(30);
        result = await importEpub(file);
        setProgress(100);
      } else {
        result = await importPdf(file, pct => setProgress(10 + Math.round(pct * 0.85)));
      }

      setImported(result);
      setStep('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar o arquivo.');
      setStep('error');
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleConfirm = () => {
    if (!imported) return;
    const book = createBook(imported.title || 'Livro importado', imported.author || 'Autor desconhecido', {
      printSettings: DEFAULT_PRINT_SETTINGS,
    });

    const { updateChapterContent, updateBook, createChapter } = useBookStore.getState();

    // Substituir o capítulo padrão pelo primeiro importado e criar os demais
    const [first, ...rest] = imported.chapters;
    if (book.chapters[0] && first) {
      updateBook(book.id, { chapters: [{ ...book.chapters[0], title: first.title }] });
      updateChapterContent(book.id, book.chapters[0].id, first.content);
    }
    for (const ch of rest) {
      const newCh = createChapter(book.id, ch.title);
      updateChapterContent(book.id, newCh.id, ch.content);
    }

    showToast(`"${book.title}" importado com ${imported.chapters.length} capítulo(s)`, 'success');
    handleClose();
    navigate(`/editor/${book.id}`);
  };

  const extIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const ft = FILE_TYPES.find(t => t.ext === ext);
    if (!ft) return null;
    const Icon = ft.icon;
    return <Icon size={16} className={ft.color} />;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Livro" width="max-w-lg">
      {/* ─── Passo 1: Escolher arquivo ─── */}
      {step === 'pick' && (
        <div className="space-y-4">
          {/* Zona de drop */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors select-none ${
              dragging ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Upload size={26} className={dragging ? 'text-amber-500' : 'text-gray-400'} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {dragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Suporta .docx, .epub e .pdf</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={onFileInput}
            />
          </div>

          {/* Formatos suportados */}
          <div className="grid grid-cols-3 gap-2">
            {FILE_TYPES.map(ft => {
              const Icon = ft.icon;
              return (
                <div key={ft.ext} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <Icon size={15} className={ft.color} />
                  <span className="text-xs text-gray-600">{ft.label}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-400 text-center">
            O conteúdo do arquivo será convertido em capítulos editáveis dentro do UmLivro Lab.
          </p>
        </div>
      )}

      {/* ─── Passo 2: Carregando ─── */}
      {step === 'loading' && (
        <div className="flex flex-col items-center gap-5 py-8">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke="#d97706" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
              {progress}%
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Processando arquivo...</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              {extIcon(fileName)} {fileName}
            </p>
          </div>
        </div>
      )}

      {/* ─── Passo 3: Preview ─── */}
      {step === 'preview' && imported && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">Arquivo processado com sucesso</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              {extIcon(fileName)} {fileName}
            </span>
          </div>

          {/* Resumo do livro */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-14 rounded-lg bg-amber-700 flex items-center justify-center text-2xl flex-shrink-0">
                📖
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{imported.title || '(sem título)'}</p>
                <p className="text-xs text-gray-500">{imported.author || 'Autor desconhecido'}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><BookOpen size={11} /> {imported.chapters.length} capítulos detectados</span>
                  <span className="flex items-center gap-1">
                    <Layers size={11} />
                    {imported.chapters.reduce((s, c) => s + c.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length, 0).toLocaleString('pt-BR')} palavras
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de capítulos */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Capítulos encontrados</p>
            <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
              {imported.chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100 text-xs text-gray-700">
                  <span className="text-gray-300 font-mono w-5 text-right flex-shrink-0">{i + 1}</span>
                  <span className="truncate">{ch.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={reset} className="flex-1">
              Escolher outro
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Importar para a Biblioteca
            </Button>
          </div>
        </div>
      )}

      {/* ─── Passo 4: Erro ─── */}
      {step === 'error' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Erro ao importar</p>
            <p className="text-xs text-gray-500 max-w-xs">{errorMsg}</p>
          </div>
          <Button variant="secondary" onClick={reset}>
            <X size={14} /> Tentar novamente
          </Button>
        </div>
      )}
    </Modal>
  );
};
