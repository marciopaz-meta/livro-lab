import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useBookStore } from '../../store/useBookStore';
import { useToast } from '../ui/Toast';
import type { Book, BookMetadata, BookPromotion, AgeRating } from '../../types';
import { generateId } from '../../utils/id';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  book: Book | null;
  onClose: () => void;
}

const TABS = ['Informações', 'Categorias', 'Preço & Publicação'] as const;
type Tab = (typeof TABS)[number];

const AGE_RATINGS: AgeRating[] = ['Livre', '10+', '12+', '14+', '16+', '18+'];

const parseKeywords = (str: string): string[] =>
  str.split(/[,;]/).map(k => k.trim()).filter(Boolean);

const GENRES = [
  'Arte & Fotografia', 'Biografia', 'Ciências', 'Conto', 'Culinária', 'Educação',
  'Fantasia', 'Ficção Científica', 'Filosofia', 'Histórico', 'Horror', 'Humor',
  'Infantil', 'Literatura Brasileira', 'Mistério', 'Negócios', 'Poesia',
  'Psicologia', 'Romance', 'Suspense', 'Tecnologia', 'Viagem',
];

const SALES_CHANNELS = [
  'Amazon Kindle', 'Google Play Books', 'Apple Books', 'Kobo', 'Livraria Cultura',
  'Saraiva', 'Submarino', 'Americanas', 'Site próprio',
];

const LANGUAGES = [
  'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano',
  'Japonês', 'Mandarim', 'Árabe', 'Russo',
];

export const MetadataModal: React.FC<Props> = ({ book, onClose }) => {
  const { updateBookMetadata, updateBook } = useBookStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('Informações');

  const [infoForm, setInfoForm] = useState({
    title: '',
    subtitle: '',
    author: '',
    edition: '',
    synopsis: '',
    language: 'Português',
    publicationDate: '',
  });

  const [catForm, setCatForm] = useState({
    ageRating: 'Livre' as AgeRating,
    genre: '',
    keywords: '',
    isbn: '',
  });

  const [priceForm, setPriceForm] = useState({
    listPrice: '',
    salesChannels: [] as string[],
  });

  const [promotions, setPromotions] = useState<BookPromotion[]>([]);

  useEffect(() => {
    if (!book) return;
    const m = book.metadata ?? {};
    setInfoForm({
      title: book.title,
      subtitle: book.subtitle ?? '',
      author: book.author,
      edition: m.edition ?? '',
      synopsis: book.description ?? '',
      language: book.languages?.[0] ?? 'Português',
      publicationDate: m.publicationDate ?? '',
    });
    setCatForm({
      ageRating: m.ageRating ?? 'Livre',
      genre: book.genre ?? '',
      keywords: (m.keywords ?? []).join(', '),
      isbn: m.isbn ?? '',
    });
    setPriceForm({
      listPrice: m.listPrice != null ? String(m.listPrice) : '',
      salesChannels: m.salesChannels ?? [],
    });
    setPromotions(m.promotions ?? []);
    setActiveTab('Informações');
  // Depend on book.id so reference changes without actual data change don't reset the form
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  if (!book) return null;

  const toggleChannel = (ch: string) => {
    setPriceForm(f => ({
      ...f,
      salesChannels: f.salesChannels.includes(ch)
        ? f.salesChannels.filter(c => c !== ch)
        : [...f.salesChannels, ch],
    }));
  };

  const addPromotion = () => {
    setPromotions(p => [...p, { id: generateId(), startDate: '', endDate: '', price: 0 }]);
  };

  const removePromotion = (id: string) => {
    setPromotions(p => p.filter(pr => pr.id !== id));
  };

  const updatePromotion = (id: string, field: keyof BookPromotion, value: string | number) => {
    setPromotions(p => p.map(pr => pr.id === id ? { ...pr, [field]: value } : pr));
  };

  const handleSave = () => {
    // Update basic book fields
    updateBook(book.id, {
      title: infoForm.title.trim() || book.title,
      subtitle: infoForm.subtitle.trim() || undefined,
      author: infoForm.author.trim() || book.author,
      genre: catForm.genre || undefined,
      description: infoForm.synopsis.trim() || undefined,
      languages: [infoForm.language],
    });

    // Update metadata
    const metadata: BookMetadata = {
      edition: infoForm.edition.trim() || undefined,
      publicationDate: infoForm.publicationDate || undefined,
      ageRating: catForm.ageRating,
      keywords: catForm.keywords ? parseKeywords(catForm.keywords) : undefined,
      isbn: catForm.isbn.trim() || undefined,
      listPrice: priceForm.listPrice ? parseFloat(priceForm.listPrice.replace(',', '.')) : undefined,
      salesChannels: priceForm.salesChannels.length > 0 ? priceForm.salesChannels : undefined,
      promotions: promotions.length > 0 ? promotions : undefined,
    };

    updateBookMetadata(book.id, metadata);
    showToast('Metadados salvos com sucesso', 'success');
    onClose();
  };

  return (
    <Modal isOpen={!!book} onClose={onClose} title={`Metadados — ${book.title}`} width="max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 -mx-5 px-5 mb-5">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
              activeTab === tab
                ? 'border-amber-500 text-amber-700 bg-amber-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
        {/* ─── Tab: Informações ─── */}
        {activeTab === 'Informações' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Título *"
                value={infoForm.title}
                onChange={e => setInfoForm(f => ({ ...f, title: e.target.value }))}
              />
              <Input
                label="Subtítulo"
                value={infoForm.subtitle}
                onChange={e => setInfoForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Autor *"
                value={infoForm.author}
                onChange={e => setInfoForm(f => ({ ...f, author: e.target.value }))}
              />
              <Input
                label="Edição"
                value={infoForm.edition}
                onChange={e => setInfoForm(f => ({ ...f, edition: e.target.value }))}
                placeholder="Ex.: 1, 2ª edição..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Sinopse</label>
              <textarea
                value={infoForm.synopsis}
                onChange={e => setInfoForm(f => ({ ...f, synopsis: e.target.value }))}
                placeholder="Descreva o livro para os leitores..."
                rows={4}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Idioma</label>
                <select
                  value={infoForm.language}
                  onChange={e => setInfoForm(f => ({ ...f, language: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Data de Publicação</label>
                <input
                  type="date"
                  value={infoForm.publicationDate}
                  onChange={e => setInfoForm(f => ({ ...f, publicationDate: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </>
        )}

        {/* ─── Tab: Categorias ─── */}
        {activeTab === 'Categorias' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Faixa Etária</label>
                <select
                  value={catForm.ageRating}
                  onChange={e => setCatForm(f => ({ ...f, ageRating: e.target.value as AgeRating }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  {AGE_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Gênero / Categoria</label>
                <select
                  value={catForm.genre}
                  onChange={e => setCatForm(f => ({ ...f, genre: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="">Selecionar...</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Palavras-chave
                <span className="ml-1 text-gray-400 font-normal">(separadas por vírgula)</span>
              </label>
              <input
                value={catForm.keywords}
                onChange={e => setCatForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="Ex.: aventura, cosmos, ficção científica"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {catForm.keywords && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {parseKeywords(catForm.keywords).map(kw => (
                    <span key={kw} className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Input
              label="ISBN"
              value={catForm.isbn}
              onChange={e => setCatForm(f => ({ ...f, isbn: e.target.value }))}
              placeholder="Ex.: 978-3-16-148410-0"
            />
          </>
        )}

        {/* ─── Tab: Preço & Publicação ─── */}
        {activeTab === 'Preço & Publicação' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Valor de Venda (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceForm.listPrice}
                onChange={e => setPriceForm(f => ({ ...f, listPrice: e.target.value }))}
                placeholder="0,00"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-600">Canais de Venda</label>
              <div className="grid grid-cols-3 gap-2">
                {SALES_CHANNELS.map(ch => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={priceForm.salesChannels.includes(ch)}
                      onChange={() => toggleChannel(ch)}
                      className="rounded text-amber-500 focus:ring-amber-400 h-3.5 w-3.5"
                    />
                    <span className="text-xs text-gray-700">{ch}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600">Promoções</label>
                <button
                  onClick={addPromotion}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Plus size={13} /> Adicionar
                </button>
              </div>
              {promotions.length === 0 && (
                <p className="text-xs text-gray-400 italic">Nenhuma promoção cadastrada.</p>
              )}
              {promotions.map(promo => (
                <div key={promo.id} className="flex gap-2 items-end bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-medium text-gray-500">Início</label>
                    <input
                      type="date"
                      value={promo.startDate}
                      onChange={e => updatePromotion(promo.id, 'startDate', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-medium text-gray-500">Fim</label>
                    <input
                      type="date"
                      value={promo.endDate}
                      onChange={e => updatePromotion(promo.id, 'endDate', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-medium text-gray-500">Preço (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={promo.price || ''}
                      onChange={e => updatePromotion(promo.id, 'price', parseFloat(e.target.value) || 0)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <button
                    onClick={() => removePromotion(promo.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button onClick={handleSave} className="flex-1">Salvar Metadados</Button>
      </div>
    </Modal>
  );
};
