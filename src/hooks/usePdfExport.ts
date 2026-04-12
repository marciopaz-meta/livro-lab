import { PAGE_FORMATS, PAPER_COLORS, DEFAULT_PRINT_SETTINGS } from '../types';
import type { Book, HeaderFooterConfig } from '../types';

/**
 * Opens a print-ready window using Paged.js for faithful CSS Paged Media rendering.
 * Exports ALL chapters of the book in order.
 * When `chapterStartsOnOddPage` is enabled each chapter after the first gets
 * `break-before: right`, which forces it to start on an odd (recto) page —
 * Paged.js inserts a blank verso page automatically if needed.
 */
export function usePdfExport() {
  const exportPdf = async (book: Book) => {
    const fmt = PAGE_FORMATS[book.printSettings.format];
    const ps  = book.printSettings;
    const bg  = PAPER_COLORS[book.paperType ?? 'offset'].bg;
    const { margins } = ps;

    const px2mm = (px: number) => ((px / 96) * 25.4).toFixed(2);

    /** Replace static template variables (page/totalPages handled separately in CSS) */
    const resolveText = (tpl: string) => (tpl || '')
      .replace(/\{\{bookTitle\}\}/g,    escHtml(book.title))
      .replace(/\{\{bookSubtitle\}\}/g, escHtml(book.subtitle || ''))
      .replace(/\{\{author\}\}/g,       escHtml(book.author))
      .replace(/\{\{chapter\}\}/g,      '')   // not meaningful in multi-chapter export
      .replace(/\{\{date\}\}/g,         new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{year\}\}/g,         String(new Date().getFullYear()));

    /**
     * Convert a template string to a CSS `content` expression.
     * {{page}} → counter(page)  {{totalPages}} → counter(pages)
     * Everything else → quoted string literals.
     */
    const tplToCSS = (tpl: string): string => {
      const raw = resolveText(tpl || '');
      const parts = raw
        .split(/(\{\{page\}\}|\{\{totalPages\}\})/g)
        .map(p => {
          if (p === '{{page}}')       return 'counter(page)';
          if (p === '{{totalPages}}') return 'counter(pages)';
          if (!p) return null;
          return `'${p.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        })
        .filter(Boolean);
      return parts.length ? parts.join(' ') : "''";
    };

    const hfStyleCSS = (cfg: HeaderFooterConfig) =>
      `font-size: ${cfg.fontSize}pt; font-style: ${cfg.fontStyle}; color: #888; font-family: inherit;`;

    /** Build @page margin-box declarations for a header/footer pair */
    const marginBoxes = (hdr: HeaderFooterConfig | null, ftr: HeaderFooterConfig | null) => {
      const h = hdr?.enabled ? `
        @top-left   { content: ${tplToCSS(hdr.left)};   ${hfStyleCSS(hdr)} }
        @top-center { content: ${tplToCSS(hdr.center)}; ${hfStyleCSS(hdr)} }
        @top-right  { content: ${tplToCSS(hdr.right)};  ${hfStyleCSS(hdr)} }` : '';
      const f = ftr?.enabled ? `
        @bottom-left   { content: ${tplToCSS(ftr.left)};   ${hfStyleCSS(ftr)} }
        @bottom-center { content: ${tplToCSS(ftr.center)}; ${hfStyleCSS(ftr)} }
        @bottom-right  { content: ${tplToCSS(ftr.right)};  ${hfStyleCSS(ftr)} }` : '';
      return h + f;
    };

    const hEven = ps.headerEven ?? DEFAULT_PRINT_SETTINGS.headerEven;
    const fEven = ps.footerEven ?? DEFAULT_PRINT_SETTINGS.footerEven;

    // Mirror margins: left=internal (inside), right=external (outside)
    const mTop    = px2mm(margins.top);
    const mBottom = px2mm(margins.bottom);
    const mInner  = px2mm(margins.left);   // left margin = inner (odd pages) / outer (even pages)
    const mOuter  = px2mm(margins.right);  // right margin = outer (odd pages) / inner (even pages)

    const baseMargin = ps.mirrorMargins
      ? ''  // handled per :left/:right below
      : `margin: ${mTop}mm ${mOuter}mm ${mBottom}mm ${mInner}mm;`;

    const rightMargin = ps.mirrorMargins
      ? `margin: ${mTop}mm ${mOuter}mm ${mBottom}mm ${mInner}mm;` : '';
    const leftMargin  = ps.mirrorMargins
      ? `margin: ${mTop}mm ${mInner}mm ${mBottom}mm ${mOuter}mm;` : '';

    const useEvenOdd = ps.useEvenOddHeaders;

    // For even/odd or mirror margins we need :right and :left rules
    const needSplit = useEvenOdd || ps.mirrorMargins;

    const pageRules = needSplit ? `
      @page :right {
        ${rightMargin}
        ${marginBoxes(ps.header, ps.footer)}
      }
      @page :left {
        ${leftMargin}
        ${marginBoxes(
          useEvenOdd ? hEven : ps.header,
          useEvenOdd ? fEven : ps.footer
        )}
      }
    ` : `
      @page {
        ${baseMargin}
        ${marginBoxes(ps.header, ps.footer)}
      }
    `;

    // Build chapter bodies in order
    const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);
    const chapterStartsOnOddPage = ps.chapterStartsOnOddPage ?? false;

    // A quebra é aplicada via classe CSS no próprio <article> — elementos com conteúdo
    // real são processados corretamente pelo Paged.js. Classe diferente para ímpar vs nova página.
    const chaptersHtml = sortedChapters.map((ch, idx) => {
      const cls = idx === 0
        ? 'chapter'
        : chapterStartsOnOddPage
          ? 'chapter chapter-odd'
          : 'chapter chapter-new';
      return `<article class="${cls}">\n${ch.content}\n</article>`;
    }).join('\n');

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Popups estão bloqueados. Permita popups para este site e tente novamente.');
      return;
    }

    // Google Fonts URL — replace spaces with + for URL compatibility
    const fontUrl = `https://fonts.googleapis.com/css2?family=${ps.fontFamily.replace(/ /g, '+')}:ital,wght@0,400;0,700;1,400&display=swap`;

    win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${escHtml(book.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${fontUrl}" rel="stylesheet">
<style>
  @page {
    size: ${fmt.widthMm}mm ${fmt.heightMm}mm;
    ${!needSplit ? `margin: ${mTop}mm ${mOuter}mm ${mBottom}mm ${mInner}mm;` : ''}
  }
  ${pageRules}

  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: ${bg}; }
  body {
    font-family: '${ps.fontFamily}', Georgia, 'Times New Roman', serif;
    font-size: ${ps.fontSize}pt;
    line-height: ${ps.lineHeight};
    color: #1a140e;
  }
  p  { margin: 0 0 .8em; }
  h1 { font-size: 2em; font-weight: 700; margin: 0 0 .6em; line-height: 1.2; page-break-after: avoid; }
  h2 { font-size: 1.5em; font-weight: 600; margin: 1.2em 0 .5em; page-break-after: avoid; }
  h3 { font-size: 1.2em; font-weight: 600; margin: 1em 0 .4em; page-break-after: avoid; }
  h4 { font-size: .85em; font-weight: 700; margin: .8em 0 .3em; text-transform: uppercase; letter-spacing: .06em; page-break-after: avoid; }
  blockquote { border-left: 3px solid #c9903f; padding: .5em 0 .5em 1.2em; margin: 1.2em 0; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: .92em; page-break-inside: avoid; }
  td, th { border: 1px solid #d1c9b8; padding: .5em .75em; }
  th { background: #f4f1eb; font-weight: 600; }
  tr:nth-child(even) td { background: #faf8f3; }
  ul, ol { padding-left: 1.5em; margin: 0 0 .8em; }
  li { margin-bottom: .25em; }
  pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 1em 1.2em;
    font-size: .85em;
    line-height: 1.6;
    margin: 1em 0;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: break-word;
    border-radius: 4px;
    border-left: 3px solid #89b4fa;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    page-break-inside: avoid;
  }
  pre code { background: transparent; padding: 0; font-size: inherit; color: inherit; border-radius: 0; }
  code { font-size: .87em; background: #f0ece2; padding: .15em .4em; border-radius: 3px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  /* Highlight.js token colours — subset that covers most languages */
  .hljs-keyword, .hljs-selector-tag, .hljs-literal  { color: #cba6f7; font-weight: 600; }
  .hljs-string, .hljs-attr, .hljs-template-variable  { color: #a6e3a1; }
  .hljs-number, .hljs-symbol, .hljs-bullet           { color: #fab387; }
  .hljs-comment, .hljs-quote                         { color: #6c7086; font-style: italic; }
  .hljs-title, .hljs-section, .hljs-name             { color: #89b4fa; font-weight: 700; }
  .hljs-type, .hljs-class, .hljs-built_in            { color: #f38ba8; }
  .hljs-variable, .hljs-params                       { color: #cdd6f4; }
  .hljs-meta                                         { color: #f9e2af; }
  img  { max-width: 100%; display: block; margin: .8em auto; page-break-inside: avoid; }
  sup  { font-size: .75em; vertical-align: super; }
  sub  { font-size: .75em; vertical-align: sub; }
  a    { color: #c9903f; }
  ul[data-type="taskList"]  { list-style: none; padding-left: .5em; }
  li[data-type="taskItem"]  { display: flex; gap: .6em; align-items: flex-start; }
  [data-type="page-break"]  { display: block; break-after: page; height: 0; overflow: hidden; }
  .sticky-note { display: none !important; }
  /* Quebra de capítulo — propriedades CSS2 e CSS3 para máxima compatibilidade com Paged.js */
  .chapter-new  { page-break-before: always;  break-before: page; }
  .chapter-odd  { page-break-before: right;   break-before: right; }
  ${ps.firstLineIndent ? 'p + p { text-indent: 1.5em; }' : ''}
  ${ps.dropCap ? `p:first-of-type::first-letter { font-size: 3.5em; font-weight: 700; float: left; line-height: .85; margin: .05em .1em 0 0; color: #c9903f; }` : ''}
</style>
</head>
<body>
${chaptersHtml}
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"><\/script>
<script>
  // Apply syntax highlighting to all code blocks
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('pre code').forEach(function(el) {
      hljs.highlightElement(el);
    });
  });

  // Wait for Paged.js to finish rendering, then print
  if (window.PagedPolyfill) {
    window.PagedPolyfill.on('rendered', function() {
      setTimeout(function() { window.print(); }, 300);
    });
  } else {
    window.addEventListener('load', function() {
      document.fonts.ready.then(function() {
        setTimeout(function() { window.print(); }, 500);
      });
    });
  }
<\/script>
<script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"><\/script>
</body>
</html>`);
    win.document.close();
  };

  return { exportPdf };
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
