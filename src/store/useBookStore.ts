import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PRINT_SETTINGS } from '../types';
import type { Book, BookMetadata, Chapter, PrintSettings } from '../types';
import { generateId } from '../utils/id';

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countChars(html: string): number {
  return html.replace(/<[^>]*>/g, '').length;
}

const SEED_BOOKS: Book[] = [
  {
    id: 'book-1',
    title: 'O Labirinto das Estrelas',
    subtitle: 'Uma jornada pelo cosmos',
    author: 'Ana Luísa Ferreira',
    genre: 'Ficção Científica',
    description: 'Uma aventura épica pelos confins do universo.',
    coverColor: '#1a3a5c',
    coverEmoji: '🌌',
    paperType: 'offset' as const,
    languages: ['Português'],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    printSettings: DEFAULT_PRINT_SETTINGS,
    chapters: [
      {
        id: 'ch-1-1',
        title: 'A Descoberta',
        order: 0,
        wordCount: 120,
        charCount: 680,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: `<h1>A Descoberta</h1><p>Era uma noite fria de outubro quando a Dra. Mara Voss descobriu o sinal. Ela estava sozinha no observatório, cercada por telas piscando dados telúricos, quando uma frequência <strong>nunca antes registrada</strong> atravessou os receptores.</p><p>Ela se inclinou para frente, ajustou os óculos e murmurou:</p><blockquote>— Isso não pode ser natural. Nada na natureza produz um padrão tão regular.</blockquote><h2>A Análise</h2><p>Nas horas seguintes, Mara correu análises repetidas. Os resultados eram consistentes. O sinal vinha de <em>Kepler-452b</em>, a 1.400 anos-luz da Terra.</p><h3>Dados do Sinal</h3><table><tr><th>Parâmetro</th><th>Valor</th><th>Desvio</th></tr><tr><td>Frequência</td><td>1420 MHz</td><td>±0.001</td></tr><tr><td>Duração</td><td>72 segundos</td><td>±0.1s</td></tr><tr><td>Intensidade</td><td>-120 dBm</td><td>±2</td></tr></table><ul><li>O sinal era periódico — repetia-se a cada 37 minutos</li><li>Continha estrutura matemática reconhecível</li><li>Não havia interferência atmosférica</li></ul><p>Ela pegou o telefone e discou para seu orientador. Era meia-noite, mas isso não importava mais.</p>`,
      },
      {
        id: 'ch-1-2',
        title: 'O Contato',
        order: 1,
        wordCount: 95,
        charCount: 530,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: `<h1>O Contato</h1><p>A agência espacial mobilizou uma equipe de trinta cientistas em menos de quarenta e oito horas. O mundo ainda não sabia, mas tudo estava prestes a mudar.</p><h2>A Mensagem</h2><p>Após semanas de trabalho, a mensagem foi decodificada. Ela continha três elementos principais:</p><ol><li><strong>Uma sequência de números primos</strong> — confirmação de inteligência matemática</li><li><strong>Um mapa estelar</strong> — coordenadas de um ponto de encontro</li><li><strong>Uma data</strong> — faltavam exatos <em>três anos</em></li></ol><p>O código que revelou a mensagem foi elegante em sua simplicidade:</p><pre><code>def decode_signal(raw_bytes):
    primes = sieve_of_eratosthenes(1000)
    pattern = extract_pattern(raw_bytes, primes)
    return reconstruct_message(pattern)</code></pre>`,
      },
      {
        id: 'ch-1-3',
        title: 'A Partida',
        order: 2,
        wordCount: 88,
        charCount: 490,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: `<h1>A Partida</h1><p>A nave <em>Estrela d'Alva</em> foi construída em tempo recorde. Nenhuma missão na história da humanidade havia sido tão urgente, tão carregada de esperança — e de medo.</p><blockquote>Partimos não como conquistadores, mas como estudantes. O universo nos chama, e responderemos com humildade.</blockquote><p>— Discurso de Mara Voss no lançamento</p><h2>A Tripulação</h2><ul><li>Dra. Mara Voss — Astrofísica e líder da missão</li><li>Eng. Carlos Menezes — Propulsão e sistemas</li><li>Dra. Yuki Tanaka — Linguística e comunicação</li><li>Dr. Amara Diallo — Biologia e astrobiologia</li></ul>`,
      },
    ],
  },
  {
    id: 'book-2',
    title: 'Receitas da Memória',
    subtitle: 'Sabores que contam histórias',
    author: 'Roberto Almeida',
    genre: 'Culinária / Memórias',
    description: 'Uma viagem gastronômica pela infância.',
    coverColor: '#5c2d0a',
    coverEmoji: '🍳',
    paperType: 'polen' as const,
    languages: ['Português'],
    status: 'review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    printSettings: { ...DEFAULT_PRINT_SETTINGS, format: '16x23' },
    chapters: [
      {
        id: 'ch-2-1',
        title: 'A Cozinha da Vovó',
        order: 0,
        wordCount: 102,
        charCount: 570,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: `<h1>A Cozinha da Vovó</h1><p>Toda memória afetiva tem um cheiro. Para mim, é o aroma do <strong>alho dourado no azeite</strong>, seguido do frango caindo na panela quente — o som que antecede cada domingo na casa da vovó Luzia.</p><p>Ela nunca mediu nada. Quando perguntada sobre as quantidades, ela respondia com um sorriso:</p><blockquote>— Coloca até ficar bonito, meu filho. Cozinha não é química, é afeto.</blockquote><h2>O Frango ao Molho Pardo</h2><p>A receita mais famosa de sua coleção era também a mais simples. Os ingredientes eram poucos, mas a técnica, apurada em décadas:</p><table><tr><th>Ingrediente</th><th>Quantidade</th></tr><tr><td>Frango caipira</td><td>1 unidade</td></tr><tr><td>Alho</td><td>6 dentes</td></tr><tr><td>Vinagre de cana</td><td>3 colheres</td></tr><tr><td>Pimenta-do-reino</td><td>a gosto</td></tr></table>`,
      },
      {
        id: 'ch-2-2',
        title: 'Pão de Queijo das Sextas',
        order: 1,
        wordCount: 78,
        charCount: 430,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: `<h1>Pão de Queijo das Sextas</h1><p>Às sextas-feiras, a casa enchia de um cheiro impossível de resistir. O pão de queijo da minha mãe era uma <em>instituição familiar</em>.</p><h2>A Receita</h2><ol><li>Misture o polvilho azedo com o leite quente e o óleo</li><li>Adicione os ovos um a um</li><li>Incorpore o queijo meia-cura ralado generosamente</li><li>Modele bolinhas e asse em forno pré-aquecido</li></ol><p>O segredo, descobri anos depois, era o <strong>queijo meia-cura artesanal</strong> comprado na feira. Nenhum queijo de supermercado produzia o mesmo resultado.</p>`,
      },
      {
        id: 'ch-2-3',
        title: 'Doce de Leite da Tia Nena',
        order: 2,
        wordCount: 65,
        charCount: 360,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: `<h1>Doce de Leite da Tia Nena</h1><p>Existem pessoas que carregam receitas como se fossem segredos de Estado. A tia Nena era uma delas. Seu doce de leite era diferente de tudo que eu já havia provado — mais espesso, mais escuro, com um toque de <em>cacau amargo</em> que ninguém esperava.</p><blockquote>A paciência é o ingrediente principal. Mexe, mexe, mexe — e não para.</blockquote><h2>Variações</h2><ul><li><strong>Clássico:</strong> leite integral + açúcar + bicarbonato</li><li><strong>Especiado:</strong> adicionar canela e cravo durante o cozimento</li><li><strong>Cacau:</strong> incorporar cacau 70% nos últimos 15 minutos</li></ul>`,
      },
    ],
  },
];

interface BookState {
  books: Book[];
  createBook: (title: string, author: string, extra?: Partial<Book>) => Book;
  updateBook: (id: string, partial: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  duplicateBook: (id: string) => Book;
  createChapter: (bookId: string, title: string) => Chapter;
  updateChapter: (bookId: string, chapterId: string, partial: Partial<Chapter>) => void;
  deleteChapter: (bookId: string, chapterId: string) => void;
  reorderChapters: (bookId: string, newOrder: string[]) => void;
  updateChapterContent: (bookId: string, chapterId: string, html: string) => void;
  updatePrintSettings: (bookId: string, partial: Partial<PrintSettings>) => void;
  updateBookMetadata: (id: string, metadata: BookMetadata) => void;
}

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      books: SEED_BOOKS,
      createBook: (title, author, extra = {}) => {
        const book: Book = {
          id: generateId(),
          title,
          author,
          coverColor: '#1a3a5c',
          coverEmoji: '📖',
          paperType: 'offset' as const,
          languages: ['Português'],
          chapters: [],
          printSettings: DEFAULT_PRINT_SETTINGS,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...extra,
        };
        const firstChapter: Chapter = {
          id: generateId(),
          title: 'Capítulo 1',
          content: '<p></p>',
          order: 0,
          wordCount: 0,
          charCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        book.chapters = [firstChapter];
        set(s => ({ books: [...s.books, book] }));
        return book;
      },
      updateBook: (id, partial) => set(s => ({
        books: s.books.map(b => b.id === id ? { ...b, ...partial, updatedAt: new Date().toISOString() } : b),
      })),
      deleteBook: (id) => set(s => ({ books: s.books.filter(b => b.id !== id) })),
      duplicateBook: (id) => {
        const src = get().books.find(b => b.id === id)!;
        const copy: Book = {
          ...src,
          id: generateId(),
          title: src.title + ' (cópia)',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          chapters: src.chapters.map(c => ({ ...c, id: generateId() })),
        };
        set(s => ({ books: [...s.books, copy] }));
        return copy;
      },
      createChapter: (bookId, title) => {
        const book = get().books.find(b => b.id === bookId)!;
        const chapter: Chapter = {
          id: generateId(),
          title,
          content: '<p></p>',
          order: book.chapters.length,
          wordCount: 0,
          charCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(s => ({
          books: s.books.map(b => b.id === bookId
            ? { ...b, chapters: [...b.chapters, chapter], updatedAt: new Date().toISOString() }
            : b),
        }));
        return chapter;
      },
      updateChapter: (bookId, chapterId, partial) => set(s => ({
        books: s.books.map(b => b.id === bookId
          ? {
              ...b,
              chapters: b.chapters.map(c => c.id === chapterId
                ? { ...c, ...partial, updatedAt: new Date().toISOString() }
                : c),
              updatedAt: new Date().toISOString(),
            }
          : b),
      })),
      deleteChapter: (bookId, chapterId) => set(s => ({
        books: s.books.map(b => b.id === bookId
          ? {
              ...b,
              chapters: b.chapters.filter(c => c.id !== chapterId).map((c, i) => ({ ...c, order: i })),
              updatedAt: new Date().toISOString(),
            }
          : b),
      })),
      reorderChapters: (bookId, newOrder) => set(s => ({
        books: s.books.map(b => {
          if (b.id !== bookId) return b;
          const sorted = newOrder.map((id, i) => {
            const c = b.chapters.find(ch => ch.id === id)!;
            return { ...c, order: i };
          });
          return { ...b, chapters: sorted, updatedAt: new Date().toISOString() };
        }),
      })),
      updateChapterContent: (bookId, chapterId, html) => set(s => ({
        books: s.books.map(b => b.id === bookId
          ? {
              ...b,
              chapters: b.chapters.map(c => c.id === chapterId
                ? {
                    ...c,
                    content: html,
                    wordCount: countWords(html),
                    charCount: countChars(html),
                    updatedAt: new Date().toISOString(),
                  }
                : c),
              updatedAt: new Date().toISOString(),
            }
          : b),
      })),
      updatePrintSettings: (bookId, partial) => set(s => ({
        books: s.books.map(b => b.id === bookId
          ? { ...b, printSettings: { ...b.printSettings, ...partial }, updatedAt: new Date().toISOString() }
          : b),
      })),
      updateBookMetadata: (id, metadata) => set(s => ({
        books: s.books.map(b => b.id === id
          ? { ...b, metadata, updatedAt: new Date().toISOString() }
          : b),
      })),
    }),
    { name: 'livro-lab-books' }
  )
);
