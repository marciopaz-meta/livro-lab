import React, { useState } from 'react';
import { PAGE_FORMATS, PAPER_COLORS, DEFAULT_PRINT_SETTINGS } from '../../types';
import type { Book, PageFormat, PrintSettings as PrintSettingsType, PaperType, HeaderFooterConfig } from '../../types';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';

const COMMON_LANGUAGES = [
  'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão',
  'Italiano', 'Japonês', 'Mandarim', 'Árabe', 'Russo',
];

// Re-export font list from toolbar (same source of truth)
const FONT_OPTIONS = [
  { value: 'Lora', label: 'Lora' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'EB Garamond', label: 'EB Garamond' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Source Serif 4', label: 'Source Serif 4' },
  { value: 'Crimson Text', label: 'Crimson Text' },
  { value: 'Spectral', label: 'Spectral' },
  { value: 'Cardo', label: 'Cardo' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
];

const FORMAT_OPTIONS = Object.entries(PAGE_FORMATS).map(([k, v]) => ({ value: k, label: v.label }));

const PAPER_OPTIONS: { value: PaperType; label: string }[] = Object.entries(PAPER_COLORS).map(
  ([k, v]) => ({ value: k as PaperType, label: v.label })
);

interface Props {
  book: Book;
  onUpdate: (partial: Partial<PrintSettingsType>) => void;
  onUpdateBook?: (partial: Partial<Book>) => void;
}

/** Seletor de idiomas do livro (usado pela revisão IA) */
const LanguageSelector: React.FC<{ languages: string[]; onChange: (langs: string[]) => void }> = ({
  languages, onChange,
}) => {
  const [custom, setCustom] = useState('');

  const add = (lang: string) => {
    const trimmed = lang.trim();
    if (trimmed && !languages.includes(trimmed)) onChange([...languages, trimmed]);
    setCustom('');
  };

  const remove = (lang: string) => onChange(languages.filter(l => l !== lang));

  return (
    <div className="space-y-2">
      {/* Tags dos idiomas selecionados */}
      <div className="flex flex-wrap gap-1">
        {languages.map(lang => (
          <span key={lang} className="flex items-center gap-0.5 text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-200">
            {lang}
            <button onClick={() => remove(lang)} className="ml-0.5 hover:text-red-600">
              <X size={10} />
            </button>
          </span>
        ))}
        {languages.length === 0 && (
          <span className="text-[11px] text-gray-400 italic">Nenhum idioma selecionado</span>
        )}
      </div>

      {/* Adição rápida via lista */}
      <div className="flex flex-wrap gap-1">
        {COMMON_LANGUAGES.filter(l => !languages.includes(l)).map(lang => (
          <button key={lang} onClick={() => add(lang)}
            className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-700 transition-colors">
            + {lang}
          </button>
        ))}
      </div>

      {/* Campo livre */}
      <div className="flex gap-1">
        <input
          type="text"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add(custom)}
          placeholder="Outro idioma..."
          className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:border-amber-500"
        />
        <button onClick={() => add(custom)}
          className="p-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
};

// Collapsible section
const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-2">
      <button
        className="w-full flex items-center justify-between py-2 px-1 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
        onClick={() => setOpen(o => !o)}
      >
        {title}
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div className="space-y-1.5 pb-1">{children}</div>}
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2 py-0.5">
    <span className="text-xs text-gray-500 flex-shrink-0 w-24">{label}</span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label, checked, onChange,
}) => (
  <label className="flex items-center gap-2 cursor-pointer py-0.5">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
    <span className="text-xs text-gray-600">{label}</span>
  </label>
);

const HFEditor: React.FC<{
  label: string;
  value: HeaderFooterConfig;
  onChange: (v: HeaderFooterConfig) => void;
}> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <Toggle label={`Exibir ${label}`} checked={value.enabled} onChange={v => onChange({ ...value, enabled: v })} />
    {value.enabled && (
      <div className="pl-2 space-y-1 border-l-2 border-amber-200">
        <Input label="Esquerda" value={value.left} onChange={e => onChange({ ...value, left: e.target.value })} placeholder="{{author}}" />
        <Input label="Centro" value={value.center} onChange={e => onChange({ ...value, center: e.target.value })} placeholder="{{page}}" />
        <Input label="Direita" value={value.right} onChange={e => onChange({ ...value, right: e.target.value })} placeholder="{{bookTitle}}" />
        <Row label="Tamanho">
          <Input type="number" min={6} max={16} value={value.fontSize} onChange={e => onChange({ ...value, fontSize: Number(e.target.value) })} />
        </Row>
        <Row label="Estilo">
          <Select options={[{ value: 'normal', label: 'Normal' }, { value: 'italic', label: 'Itálico' }]}
            value={value.fontStyle} onChange={e => onChange({ ...value, fontStyle: e.target.value as 'normal' | 'italic' })} />
        </Row>
      </div>
    )}
  </div>
);

export const PrintSettings: React.FC<Props> = ({ book, onUpdate, onUpdateBook }) => {
  const s = book.printSettings;

  return (
    <div className="p-3 overflow-y-auto h-full text-sm space-y-0">

      <Section title="Idiomas do Livro" defaultOpen={true}>
        <p className="text-[11px] text-gray-400 mb-1.5 leading-relaxed">
          Idiomas usados na revisão e reescrita com IA.
        </p>
        <LanguageSelector
          languages={book.languages ?? ['Português']}
          onChange={langs => onUpdateBook?.({ languages: langs })}
        />
      </Section>

      <Section title="Página">
        <Row label="Formato">
          <Select options={FORMAT_OPTIONS} value={s.format}
            onChange={e => onUpdate({ format: e.target.value as PageFormat })} />
        </Row>
        <Row label="Orientação">
          <Select options={[{ value: 'portrait', label: 'Retrato' }, { value: 'landscape', label: 'Paisagem' }]}
            value={s.orientation} onChange={e => onUpdate({ orientation: e.target.value as 'portrait' | 'landscape' })} />
        </Row>
        <Row label="Papel">
          <div className="flex items-center gap-2">
            <Select options={PAPER_OPTIONS} value={book.paperType ?? 'offset'}
              onChange={e => onUpdateBook?.({ paperType: e.target.value as PaperType })} />
            <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
              style={{ background: PAPER_COLORS[book.paperType ?? 'offset'].bg }} />
          </div>
        </Row>
      </Section>

      <Section title="Margens">
        <Toggle label="Margens espelhadas (pares/ímpares)" checked={s.mirrorMargins}
          onChange={v => onUpdate({ mirrorMargins: v })} />
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {([
            ['top', s.mirrorMargins ? 'Superior' : 'Superior'],
            ['bottom', s.mirrorMargins ? 'Inferior' : 'Inferior'],
            ['left', s.mirrorMargins ? 'Interno' : 'Esquerda'],
            ['right', s.mirrorMargins ? 'Externo' : 'Direita'],
          ] as [keyof typeof s.margins, string][]).map(([side, lbl]) => (
            <Input key={side} label={lbl} type="number" min={0} max={300}
              value={s.margins[side]}
              onChange={e => onUpdate({ margins: { ...s.margins, [side]: Number(e.target.value) } })} />
          ))}
        </div>
      </Section>

      <Section title="Tipografia">
        <Row label="Fonte">
          <Select options={FONT_OPTIONS} value={s.fontFamily} onChange={e => onUpdate({ fontFamily: e.target.value })} />
        </Row>
        <Row label="Tamanho (pt)">
          <Input type="number" min={6} max={36} value={s.fontSize} onChange={e => onUpdate({ fontSize: Number(e.target.value) })} />
        </Row>
        <Row label="Entrelinha">
          <Input type="number" min={1} max={3} step={0.1} value={s.lineHeight} onChange={e => onUpdate({ lineHeight: Number(e.target.value) })} />
        </Row>
        <Row label="Espaç. §">
          <Input type="number" min={0} max={5} step={0.1} value={s.paragraphSpacing} onChange={e => onUpdate({ paragraphSpacing: Number(e.target.value) })} />
        </Row>
        <Toggle label="Recuo na 1ª linha" checked={s.firstLineIndent} onChange={v => onUpdate({ firstLineIndent: v })} />
        <Toggle label="Drop cap (capitular)" checked={s.dropCap} onChange={v => onUpdate({ dropCap: v })} />
        <Row label="Colunas">
          <Select options={[{ value: '1', label: '1 coluna' }, { value: '2', label: '2 colunas' }]}
            value={String(s.columnCount)} onChange={e => onUpdate({ columnCount: Number(e.target.value) as 1 | 2 })} />
        </Row>
      </Section>

      <Section title="Cabeçalho / Rodapé">
        <Toggle label="Diferente em pares/ímpares" checked={s.useEvenOddHeaders}
          onChange={v => onUpdate({ useEvenOddHeaders: v })} />

        <p className="text-xs font-medium text-gray-500 mt-2">
          {s.useEvenOddHeaders ? 'Páginas ímpares' : 'Cabeçalho'}
        </p>
        <HFEditor label="cabeçalho" value={s.header}
          onChange={v => onUpdate({ header: v })} />

        <p className="text-xs font-medium text-gray-500 mt-2">
          {s.useEvenOddHeaders ? 'Páginas ímpares' : 'Rodapé'}
        </p>
        <HFEditor label="rodapé" value={s.footer}
          onChange={v => onUpdate({ footer: v })} />

        {s.useEvenOddHeaders && (
          <>
            <p className="text-xs font-medium text-gray-500 mt-2">Páginas pares — cabeçalho</p>
            <HFEditor label="cabeçalho par" value={s.headerEven ?? DEFAULT_PRINT_SETTINGS.headerEven}
              onChange={v => onUpdate({ headerEven: v })} />
            <p className="text-xs font-medium text-gray-500 mt-2">Páginas pares — rodapé</p>
            <HFEditor label="rodapé par" value={s.footerEven ?? DEFAULT_PRINT_SETTINGS.footerEven}
              onChange={v => onUpdate({ footerEven: v })} />
          </>
        )}
      </Section>

      <Section title="Paginação" defaultOpen={false}>
        <Toggle label="Mostrar numeração" checked={s.showPageNumbers} onChange={v => onUpdate({ showPageNumbers: v })} />
        <Row label="Iniciar em">
          <Input type="number" min={1} value={s.startPageNumber} onChange={e => onUpdate({ startPageNumber: Number(e.target.value) })} />
        </Row>
        <Toggle label="Quebra automática" checked={s.autoPageBreak} onChange={v => onUpdate({ autoPageBreak: v })} />
        <Toggle label="Capítulo inicia em página ímpar" checked={s.chapterStartsOnOddPage ?? false} onChange={v => onUpdate({ chapterStartsOnOddPage: v })} />
      </Section>

      <div className="mt-3 p-2 bg-amber-50 rounded-lg text-[10px] text-amber-700 font-mono leading-5">
        <span className="font-sans text-xs font-medium text-amber-800 block mb-1">Variáveis</span>
        {'{{bookTitle}} {{bookSubtitle}}'}<br />
        {'{{author}} {{chapter}}'}<br />
        {'{{page}} {{totalPages}}'}<br />
        {'{{date}} {{year}}'}
      </div>
    </div>
  );
};

export { PrintSettings as PrintSettingsPanel };
