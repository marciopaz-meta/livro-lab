# UmLivro Lab

Editor de livros para autores — escrita, formatação, revisão com IA e exportação para PDF/EPub.

## Funcionalidades

- **Biblioteca** — gerenciamento de livros com busca por título, autor e ISBN, filtros por status e estatísticas gerais
- **Editor rico** — baseado no TipTap com suporte a tipografia completa (fontes, tamanhos, entrelinha, cores, destaque, listas, tabelas, imagens redimensionáveis, notas adesivas, quebra de página)
- **Toolbar flutuante** — aparece ao selecionar texto para formatação rápida (negrito, itálico, sublinhado, link, destaque, reescrita com IA)
- **Capítulos** — criação, reordenação por drag-and-drop, renomeação e exclusão
- **Configurações do livro** — formato de página, tipo de papel, margens, cabeçalho/rodapé com variáveis dinâmicas, paginação
- **Metadados** — título, subtítulo, autor, ISBN, edição, sinopse, idioma, data de publicação, gênero, palavras-chave, faixa etária, canais de venda e promoções
- **Revisão com IA** — análise ortográfica/gramatical via OpenAI, reescrita de parágrafo e Super Completar (expansão de texto)
- **Exportação** — PDF via html2pdf e EPub via JSZip
- **Importação** — DOCX (via Mammoth) e PDF (via pdf.js)
- **Auto-save** — salva automaticamente a cada 800 ms de inatividade

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Editor | TipTap 3 (ProseMirror) |
| Estilo | Tailwind CSS 3 |
| Estado | Zustand 5 (persistido no localStorage) |
| Roteamento | React Router 7 |
| Drag & Drop | dnd-kit |
| IA | OpenAI API (gpt-4o-mini por padrão) |
| PDF export | html2pdf.js |
| PDF import | pdf.js |
| DOCX import | Mammoth |
| EPub | JSZip |

## Pré-requisitos

- Node.js 18+
- npm, yarn ou pnpm

## Instalação e execução

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd livro-lab

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Scripts disponíveis

```bash
npm run dev       # Servidor de desenvolvimento com HMR
npm run build     # Build de produção (tsc + vite build)
npm run preview   # Pré-visualização do build de produção
npm run lint      # Verificação de lint com ESLint
```

## Configuração da IA (opcional)

Os recursos de IA requerem uma chave da API da OpenAI. Configure via variável de ambiente ou diretamente na interface.

**Via arquivo `.env`** (recomendado):

```bash
# Crie o arquivo na raiz do projeto
cp .env.example .env
```

```env
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4o-mini   # opcional, padrão: gpt-4o-mini
```

**Via interface**: acesse as configurações de IA dentro do editor para inserir a chave manualmente (salva no localStorage).

Sem a chave configurada, todas as funcionalidades de escrita e edição funcionam normalmente — apenas os recursos de IA ficam desabilitados.

## Estrutura do projeto

```
src/
├── components/
│   ├── ai/             # Modais de revisão, reescrita e expansão com IA
│   ├── books/          # Modal de metadados e importação de livros
│   ├── chapters/       # Painel de capítulos, item de capítulo e modal de configurações
│   ├── editor/         # Toolbar, BubbleMenuBar, FloatingMenuBar, RichEditor e extensões TipTap
│   ├── layout/         # AppShell e Sidebar
│   ├── print/          # PrintSettings, PrintPreview e paginação
│   └── ui/             # Componentes reutilizáveis (Modal, Input, Button, Toast, etc.)
├── config/             # Configuração da IA
├── hooks/              # useAutoSave, usePdfExport
├── pages/              # Dashboard, BooksPage, EditorPage
├── services/           # aiService, importService
├── store/              # Zustand stores (useBookStore, useAIStore, useEditorSettingsStore)
├── types/              # Tipos globais, formatos de página e configurações de impressão
└── utils/              # Utilitários (id, htmlSanitizer, pageCalculator, templateParser)
```

## Persistência de dados

Todos os dados (livros, capítulos, configurações) são armazenados no **localStorage** do navegador. Não há backend — o projeto é totalmente client-side.

## Build de produção

```bash
npm run build
```

Os arquivos gerados ficam em `dist/` e podem ser servidos por qualquer servidor estático (Nginx, Apache, Vercel, Netlify, etc.).
