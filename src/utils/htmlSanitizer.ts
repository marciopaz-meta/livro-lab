export function sanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function cleanNode(node: Element) {
    // Remove dangerous tags
    const dangerous = ['script', 'iframe', 'object', 'embed', 'style', 'link'];
    dangerous.forEach(tag => {
      node.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Clean inline styles — keep only safe ones
    node.querySelectorAll('[style]').forEach(el => {
      const style = el.getAttribute('style') || '';
      const safe: string[] = [];
      if (/font-weight\s*:\s*bold|font-weight\s*:\s*[6-9]00/.test(style)) safe.push('font-weight:bold');
      if (/font-style\s*:\s*italic/.test(style)) safe.push('font-style:italic');
      if (/text-decoration\s*:.*underline/.test(style)) safe.push('text-decoration:underline');
      const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/);
      if (colorMatch) safe.push(`color:${colorMatch[1].trim()}`);
      if (safe.length) el.setAttribute('style', safe.join(';'));
      else el.removeAttribute('style');
    });

    // Remove external classes
    node.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
    node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    // Convert b→strong, i→em
    node.querySelectorAll('b').forEach(el => {
      const strong = doc.createElement('strong');
      strong.innerHTML = el.innerHTML;
      el.replaceWith(strong);
    });
    node.querySelectorAll('i').forEach(el => {
      const em = doc.createElement('em');
      em.innerHTML = el.innerHTML;
      el.replaceWith(em);
    });
  }

  cleanNode(doc.body);
  return doc.body.innerHTML;
}
