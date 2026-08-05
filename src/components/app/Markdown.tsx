/**
 * Minimal Markdown renderer for lesson content.
 *
 * Hand-rolled rather than pulling in `react-markdown` + `remark` + `rehype`,
 * which together outweigh everything else in this app. Lesson bodies use a
 * small, known subset — headings, lists, fenced code, bold/italic, inline code
 * and links — so a full CommonMark implementation would be paying for grammar
 * we never write.
 *
 * ── On safety ───────────────────────────────────────────────────────────────
 * Output goes through `dangerouslySetInnerHTML`, so every input string is
 * HTML-escaped *before* any markup is generated, and the generated tags are
 * drawn from a fixed set. Lesson content is authored by staff, not students,
 * but escaping regardless means a compromised admin account cannot turn a
 * lesson into a payload that runs in every student's browser.
 *
 * Link hrefs are additionally restricted to http/https/mailto/root-relative so
 * `javascript:` URLs cannot slip through the escaping.
 *
 * If lessons ever need tables, footnotes or nested lists, replace this module
 * with a real parser rather than growing it — that is the point at which the
 * dependency starts paying for itself.
 */

import { color, font, radius } from '@/lib/theme';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/** Only schemes that cannot execute script. Anything else renders as plain text. */
function safeHref(href: string): string | null {
  const trimmed = href.trim();
  return /^(https?:\/\/|mailto:|\/)/i.test(trimmed) ? trimmed : null;
}

/**
 * Sentinel wrapping extracted code spans while the rest of the inline grammar
 * runs. U+241E (SYMBOL FOR RECORD SEPARATOR) is used because it cannot appear
 * in lesson text: escapeHtml() has already run, so any literal U+241E an author
 * typed is still itself — but nothing in Markdown syntax produces it, and it is
 * not a digit, so it cannot collide with ordinary prose the way a bare ` 0 `
 * placeholder would ("step 1 done" would be corrupted on the way back).
 */
const SENTINEL = '␞';

/**
 * Inline formatting, applied to already-escaped text.
 *
 * Order matters: code spans come out first and go back last, so `**` inside a
 * code span is never mistaken for bold.
 */
function inline(escaped: string): string {
  const codeSpans: string[] = [];
  let text = escaped.replace(/`([^`]+)`/g, (_, code: string) => {
    codeSpans.push(code);
    return `${SENTINEL}${codeSpans.length - 1}${SENTINEL}`;
  });

  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
    // The href arrives HTML-escaped; unescape &amp; before validating the scheme.
    const url = safeHref(href.replace(/&amp;/g, '&'));
    if (!url) return label;
    const external = /^https?:\/\//i.test(url);
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(url)}"${rel}>${label}</a>`;
  });

  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  const restore = new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, 'g');
  return text.replace(restore, (_, index: string) => `<code>${codeSpans[Number(index)]}</code>`);
}

function render(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];

  let inCode = false;
  let codeBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];

  const closeParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${inline(escapeHtml(paragraph.join(' ')))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        closeParagraph();
        closeList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      closeParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeParagraph();
      closeList();
      // Lesson bodies open with their own `# Title`, which would otherwise be a
      // second <h1> on a page that already has one. Shift every level down.
      const level = Math.min(heading[1].length + 1, 6);
      out.push(`<h${level}>${inline(escapeHtml(heading[2]))}</h${level}>`);
      continue;
    }

    if (/^\s*([-*+])\s+/.test(line)) {
      closeParagraph();
      if (listType !== 'ul') {
        closeList();
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${inline(escapeHtml(line.replace(/^\s*[-*+]\s+/, '')))}</li>`);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      closeParagraph();
      if (listType !== 'ol') {
        closeList();
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${inline(escapeHtml(line.replace(/^\s*\d+[.)]\s+/, '')))}</li>`);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      closeParagraph();
      closeList();
      out.push(`<blockquote>${inline(escapeHtml(line.replace(/^\s*>\s?/, '')))}</blockquote>`);
      continue;
    }

    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      closeParagraph();
      closeList();
      out.push('<hr />');
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  // An unterminated fence still renders as code rather than losing the content.
  if (inCode && codeBuffer.length > 0) {
    out.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
  }
  closeParagraph();
  closeList();

  return out.join('\n');
}

export default function Markdown({ content }: { content: string }) {
  /*
   * Styles live in MarkdownStyles rather than here: a scoped rule cannot reach
   * markup injected through dangerouslySetInnerHTML, so the CSS has to be
   * global and target .cn-md explicitly.
   */
  return <div className="cn-md" dangerouslySetInnerHTML={{ __html: render(content) }} />;
}

/**
 * Typography for rendered Markdown. Mount once per page that uses <Markdown>.
 *
 * A plain <style> tag with the CSS passed through dangerouslySetInnerHTML,
 * rather than styled-jsx: styled-jsx only works in Client Components, and
 * making this one would drag the whole renderer — and the pages importing it —
 * across the boundary for nothing. The CSS is a static template built from
 * theme tokens, with no interpolated user input.
 */
export function MarkdownStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}

const CSS = `
  .cn-md {
    color: ${color.textMuted};
    font-size: ${font.body};
    line-height: 1.75;
  }

  .cn-md h2,
  .cn-md h3,
  .cn-md h4,
  .cn-md h5,
  .cn-md h6 {
    margin: 2rem 0 0.6rem;
    color: ${color.text};
    font-family: var(--font-display), system-ui, sans-serif;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  .cn-md h2 { font-size: ${font.h3}; }
  .cn-md h3 { font-size: 1.15rem; }
  .cn-md h4,
  .cn-md h5,
  .cn-md h6 { font-size: 1rem; }

  .cn-md > *:first-child { margin-top: 0; }

  .cn-md p { margin: 0 0 1rem; }

  .cn-md ul,
  .cn-md ol {
    margin: 0 0 1rem;
    padding-left: 1.4rem;
  }

  .cn-md li { margin-bottom: 0.35rem; }
  .cn-md li::marker { color: ${color.textFaint}; }

  .cn-md strong {
    color: ${color.text};
    font-weight: 600;
  }

  .cn-md a {
    color: ${color.cyan};
    text-underline-offset: 3px;
  }

  .cn-md code {
    padding: 0.12em 0.4em;
    border-radius: ${radius.sm}px;
    background: rgba(255, 255, 255, 0.06);
    color: ${color.cyanSoft};
    font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.88em;
  }

  .cn-md pre {
    margin: 0 0 1.25rem;
    padding: 1rem 1.1rem;
    border: 1px solid ${color.border};
    border-radius: ${radius.md}px;
    background: rgba(255, 255, 255, 0.03);
    overflow-x: auto;
  }

  /* Reset the inline-code pill inside fenced blocks. */
  .cn-md pre code {
    padding: 0;
    background: none;
    color: ${color.text};
    font-size: 0.85rem;
    line-height: 1.7;
  }

  .cn-md blockquote {
    margin: 0 0 1rem;
    padding: 0.35rem 0 0.35rem 1rem;
    border-left: 2px solid ${color.borderStrong};
    color: ${color.textFaint};
  }

  .cn-md hr {
    margin: 1.75rem 0;
    border: 0;
    border-top: 1px solid ${color.border};
  }
`;
