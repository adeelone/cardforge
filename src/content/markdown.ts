/**
 * A deliberately small Markdown renderer for first-party blog posts.
 * Supports front matter, ## / ### headings, paragraphs, - and 1. lists,
 * > quotes, | tables |, **bold**, *italic*, `code`, and [links](url).
 * All text is HTML-escaped and only relative, http(s), and mailto links are
 * emitted, so even a careless post cannot inject markup.
 */

export interface FrontMatter {
  [key: string]: string;
}

export function parseFrontMatter(raw: string): { data: FrontMatter; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: FrontMatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (pair) data[pair[1]] = pair[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return { data, body: raw.slice(match[0].length) };
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeHref(url: string) {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed) || /^\/(?!\/)/.test(trimmed) || /^#[\w-]+$/.test(trimmed)) return trimmed;
  return null;
}

export function slugifyHeading(text: string) {
  return text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function inline(text: string): string {
  const codes: string[] = [];
  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(`<code>${code}</code>`);
    return `\uE000${codes.length - 1}\uE001`;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, url: string) => {
    const href = safeHref(url.replace(/&amp;/g, '&'));
    if (!href) return label;
    const external = /^https?:\/\//i.test(href);
    return `<a href="${escapeHtml(href)}"${external ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return out.replace(/\uE000(\d+)\uE001/g, (_, index: string) => codes[Number(index)]);
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let index = 0;

  const isBlockStart = (line: string) => /^(#{2,4}\s|[-*]\s|\d+\.\s|>\s?|\|)/.test(line);

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = inline(heading[2]);
      html.push(`<h${level} id="${slugifyHeading(content)}">${content}</h${level}>`);
      index += 1;
      continue;
    }
    if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const ordered = /^\d+\.\s/.test(line);
      const pattern = ordered ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/;
      const items: string[] = [];
      while (index < lines.length && pattern.test(lines[index])) {
        const item = pattern.exec(lines[index])![1];
        const task = /^\[( |x)\]\s+(.*)$/i.exec(item);
        items.push(task ? `<li class="task">${task[1].trim() ? '☑' : '☐'} ${inline(task[2])}</li>` : `<li>${inline(item)}</li>`);
        index += 1;
      }
      html.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
      continue;
    }
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].startsWith('|')) {
        const cells = lines[index].replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) rows.push(cells);
        index += 1;
      }
      const [head, ...body] = rows;
      html.push(
        `<table><thead><tr>${head.map((cell) => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead>` +
          `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      );
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return html.join('\n');
}

/** Plain text for reading-time estimates and llms-full.txt. */
export function markdownToText(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*`>#|]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
