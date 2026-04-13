// @ts-expect-error — no types for browser bundle
import mammoth from 'mammoth/mammoth.browser.min.js';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface ImportedChapter {
  title: string;
  content: string; // HTML pronto para o TipTap
}

export interface ImportedBook {
  title: string;
  author: string;
  chapters: ImportedChapter[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Divide um HTML grande nas ocorrências de <h1>, cada h1 vira um capítulo. */
function splitByH1(html: string): ImportedChapter[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const nodes = Array.from(doc.body.childNodes);

  const chapters: ImportedChapter[] = [];
  let current: { title: string; nodes: Node[] } | null = null;

  for (const node of nodes) {
    const el = node as Element;
    if (el.tagName === 'H1') {
      if (current) chapters.push(serializeChapter(current));
      current = { title: el.textContent?.trim() || `Capítulo ${chapters.length + 1}`, nodes: [] };
    } else if (current) {
      current.nodes.push(node);
    }
  }
  if (current) chapters.push(serializeChapter(current));

  // Sem h1 nenhum → capítulo único
  if (chapters.length === 0) {
    chapters.push({ title: 'Capítulo 1', content: html });
  }

  return chapters;
}

function serializeChapter({ title, nodes }: { title: string; nodes: Node[] }): ImportedChapter {
  const div = document.createElement('div');
  nodes.forEach(n => div.appendChild(n.cloneNode(true)));
  return { title, content: div.innerHTML || '<p></p>' };
}

/** Extrai título e autor de um texto plano de metadados EPUB/OPF */
function parseDcMeta(opfText: string, tag: string): string {
  const m = opfText.match(new RegExp(`<dc:${tag}[^>]*>([^<]+)<`, 'i'));
  return m?.[1]?.trim() ?? '';
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

export async function importDocx(file: File): Promise<ImportedBook> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({
    arrayBuffer,
    convertImage: mammoth.images.imgElement((image: { read: (enc: string) => Promise<string>; contentType: string }) =>
      image.read('base64').then(data => ({ src: `data:${image.contentType};base64,${data}` }))
    ),
  });
  const chapters = splitByH1(result.value);
  const title = file.name.replace(/\.docx$/i, '');
  return { title, author: '', chapters };
}

// ─── EPUB ─────────────────────────────────────────────────────────────────────

const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml',
};

/** Resolve um caminho relativo: combina base dir + href relativo, normaliza "../" */
function resolveEpubPath(base: string, href: string): string {
  if (href.startsWith('/')) return href.slice(1);
  const parts = (base + href).split('/');
  const out: string[] = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p && p !== '.') out.push(p);
  }
  return out.join('/');
}

export async function importEpub(file: File): Promise<ImportedBook> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  // 1. Descobrir o arquivo OPF via META-INF/container.xml
  const containerXml = await zip.file('META-INF/container.xml')?.async('text') ?? '';
  const opfPathMatch = containerXml.match(/full-path="([^"]+\.opf)"/i);
  const opfPath = opfPathMatch?.[1] ?? '';
  const opfText = await zip.file(opfPath)?.async('text') ?? '';

  const title = parseDcMeta(opfText, 'title') || file.name.replace(/\.epub$/i, '');
  const author = parseDcMeta(opfText, 'creator');

  // 2. Ler a spine (ordem dos itens de conteúdo)
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const idrefsOrder: string[] = [];
  for (const m of opfText.matchAll(/<itemref\s+idref="([^"]+)"/gi)) {
    idrefsOrder.push(m[1]);
  }

  // 3. Mapear id → href
  const hrefById = new Map<string, string>();
  for (const m of opfText.matchAll(/<item\s[^>]*\bid="([^"]+)"[^>]*\bhref="([^"]+)"/gi)) {
    hrefById.set(m[1], m[2]);
  }

  // 4. Pré-carregar todas as imagens da ZIP como data URLs
  const imageDataUrls = new Map<string, string>();
  for (const [zipPath, zipObj] of Object.entries(zip.files)) {
    if (zipObj.dir) continue;
    const ext = zipPath.split('.').pop()?.toLowerCase() ?? '';
    const mime = IMAGE_MIME[ext];
    if (!mime) continue;
    const b64 = await zipObj.async('base64');
    imageDataUrls.set(zipPath, `data:${mime};base64,${b64}`);
  }

  // 5. Parsear cada item da spine
  const chapters: ImportedChapter[] = [];
  for (const idref of idrefsOrder) {
    const href = hrefById.get(idref);
    if (!href) continue;
    const fullPath = opfDir + href;
    const xhtmlDir = fullPath.includes('/') ? fullPath.slice(0, fullPath.lastIndexOf('/') + 1) : '';
    const html = await zip.file(fullPath)?.async('text') ?? '';
    if (!html) continue;

    const doc = new DOMParser().parseFromString(html, 'application/xhtml+xml');

    // Substituir src das imagens por data URLs
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      const resolved = resolveEpubPath(xhtmlDir, src);
      const dataUrl = imageDataUrls.get(resolved);
      if (dataUrl) img.setAttribute('src', dataUrl);
    });

    const h1 = doc.querySelector('h1')?.textContent?.trim();
    const h2 = doc.querySelector('h2')?.textContent?.trim();
    const chapterTitle = h1 || h2 || `Capítulo ${chapters.length + 1}`;
    const body = doc.querySelector('body');
    const content = body?.innerHTML ?? '<p></p>';
    if (content.trim().replace(/<[^>]*>/g, '').trim()) {
      chapters.push({ title: chapterTitle, content });
    }
  }

  if (chapters.length === 0) chapters.push({ title: 'Capítulo 1', content: '<p></p>' });

  return { title, author, chapters };
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

/** Agrupa páginas de PDF em capítulos. Detecta início de capítulo por linha
 *  que começa com "Capítulo", "CAPÍTULO", "Chapter", ou número romano/arábico isolado. */
const CHAPTER_HEADING = /^(cap[íi]tulo|chapter|parte|part)\s+\S+/i;

export async function importPdf(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ImportedBook> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdfDoc.numPages;

  const title = file.name.replace(/\.pdf$/i, '');
  let author = '';

  // Tentar extrair metadados do PDF
  try {
    const meta = await pdfDoc.getMetadata();
    const info = meta.info as Record<string, string>;
    if (info?.Title) title === file.name.replace(/\.pdf$/i, '') && Object.assign({ title: info.Title });
    if (info?.Author) author = info.Author;
  } catch { /* ignora */ }

  // Extrair texto de cada página
  const pages: string[] = [];
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(text);
    onProgress?.(Math.round((i / totalPages) * 90));
  }

  // Agrupar páginas em capítulos
  const chapters: ImportedChapter[] = [];
  let current: { title: string; lines: string[] } = { title: 'Capítulo 1', lines: [] };

  for (const pageText of pages) {
    const lines = pageText.split(/\.\s+|\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (CHAPTER_HEADING.test(line) && current.lines.length > 0) {
        chapters.push(buildPdfChapter(current));
        current = { title: line, lines: [] };
      } else {
        current.lines.push(line);
      }
    }
  }
  if (current.lines.length > 0) chapters.push(buildPdfChapter(current));
  if (chapters.length === 0) chapters.push({ title: 'Capítulo 1', content: '<p></p>' });

  onProgress?.(100);
  return { title, author, chapters };
}

function buildPdfChapter({ title, lines }: { title: string; lines: string[] }): ImportedChapter {
  const paragraphs = lines.map(l => `<p>${l}</p>`).join('');
  return { title, content: paragraphs || '<p></p>' };
}
