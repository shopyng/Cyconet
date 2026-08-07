/**
 * A minimal PDF writer.
 *
 * Enough of PDF 1.4 to lay out a certificate: filled rectangles, lines, and
 * text positioned absolutely. No dependencies, no font binaries, no headless
 * browser — it emits the bytes directly.
 *
 * Two things make that practical:
 *
 *   1. The base-14 fonts. Every conforming PDF reader ships Helvetica, Times
 *      and Courier, so a document naming them embeds nothing. The cost is that
 *      we are limited to those faces and to the WinAnsi character set.
 *
 *   2. PDF has no text layout. There is no "centre this" — you place a string
 *      at an (x, y) in points and it draws left-to-right from there. Centring
 *      therefore requires knowing how wide the string will be, which is what
 *      the width tables in ./pdf-metrics are for.
 *
 * Coordinates are PostScript points (72 per inch) with the origin at the
 * BOTTOM-left, y increasing upward — the opposite of every screen coordinate
 * system. `Page.height` is exposed so callers can work top-down if they prefer.
 */

import { stringWidth, type FontName } from './pdf-metrics';

export type { FontName };

export type Rgb = readonly [number, number, number];

type Op = string;

/** Points per unit for the two page sizes we care about. */
export const PAGE = {
  /** 297 × 210 mm. */
  a4Landscape: { width: 841.89, height: 595.28 },
  /** 210 × 297 mm. */
  a4Portrait: { width: 595.28, height: 841.89 },
} as const;

/**
 * Escape a string for a PDF literal.
 *
 * `(`, `)` and `\` are structural inside `(...)` — an unescaped parenthesis in
 * a student's name would terminate the string early and corrupt the file, so
 * this is a correctness guard, not a nicety.
 *
 * Characters outside WinAnsi are transliterated where there is an obvious
 * equivalent (curly quotes, dashes) and otherwise dropped to `?`. The base-14
 * fonts have no glyphs beyond WinAnsi, so passing the byte through would
 * render as mojibake rather than the intended character.
 */
function escapeText(value: string): string {
  let out = '';
  for (const char of value) {
    const mapped = TRANSLITERATE[char] ?? char;
    for (const c of mapped) {
      const code = c.codePointAt(0) ?? 63;
      if (c === '\\' || c === '(' || c === ')') {
        out += `\\${c}`;
      } else if (code >= 32 && code <= 126) {
        out += c;
      } else if (code >= 160 && code <= 255) {
        // WinAnsi high range — emit as a 3-digit octal escape.
        out += `\\${code.toString(8).padStart(3, '0')}`;
      } else {
        out += '?';
      }
    }
  }
  return out;
}

const TRANSLITERATE: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '…': '...',
  ' ': ' ',
};

function fmt(n: number): string {
  // Three decimals is well inside the precision a point-based layout needs, and
  // trimming the trailing zeros keeps the content stream readable when debugging.
  return Number(n.toFixed(3)).toString();
}

function colorOp(rgb: Rgb, stroke = false): Op {
  const [r, g, b] = rgb;
  return `${fmt(r)} ${fmt(g)} ${fmt(b)} ${stroke ? 'RG' : 'rg'}`;
}

export type TextOptions = {
  font?: FontName;
  size?: number;
  color?: Rgb;
  /** Extra space between glyphs, in points. Used for the tracked-out labels. */
  charSpacing?: number;
};

/**
 * A single page under construction.
 *
 * Drawing calls append operators to a content stream; nothing is rendered
 * until `PdfDocument.build()` assembles the file.
 */
export class Page {
  readonly width: number;
  readonly height: number;
  private ops: Op[] = [];
  private fonts = new Set<FontName>();

  constructor(size: { width: number; height: number }) {
    this.width = size.width;
    this.height = size.height;
  }

  /** Filled rectangle. `y` is the BOTTOM edge. */
  rect(x: number, y: number, width: number, height: number, color: Rgb): this {
    this.ops.push(
      'q',
      colorOp(color),
      `${fmt(x)} ${fmt(y)} ${fmt(width)} ${fmt(height)} re f`,
      'Q',
    );
    return this;
  }

  /** Rectangle outline. */
  strokeRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: Rgb,
    lineWidth = 1,
  ): this {
    this.ops.push(
      'q',
      colorOp(color, true),
      `${fmt(lineWidth)} w`,
      `${fmt(x)} ${fmt(y)} ${fmt(width)} ${fmt(height)} re S`,
      'Q',
    );
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Rgb, lineWidth = 1): this {
    this.ops.push(
      'q',
      colorOp(color, true),
      `${fmt(lineWidth)} w`,
      `${fmt(x1)} ${fmt(y1)} m ${fmt(x2)} ${fmt(y2)} l S`,
      'Q',
    );
    return this;
  }

  /** Draws `text` with its left edge at `x` and its baseline at `y`. */
  text(text: string, x: number, y: number, options: TextOptions = {}): this {
    const {
      font = 'Helvetica',
      size = 12,
      color = [0, 0, 0],
      charSpacing = 0,
    } = options;

    this.fonts.add(font);
    this.ops.push(
      'q',
      colorOp(color),
      'BT',
      `/${font} ${fmt(size)} Tf`,
      charSpacing ? `${fmt(charSpacing)} Tc` : '0 Tc',
      `${fmt(x)} ${fmt(y)} Td`,
      `(${escapeText(text)}) Tj`,
      'ET',
      'Q',
    );
    return this;
  }

  /** Draws `text` centred on `centerX`. */
  textCentered(text: string, centerX: number, y: number, options: TextOptions = {}): this {
    const width = this.measure(text, options);
    return this.text(text, centerX - width / 2, y, options);
  }

  /** Draws `text` with its right edge at `x`. */
  textRight(text: string, x: number, y: number, options: TextOptions = {}): this {
    const width = this.measure(text, options);
    return this.text(text, x - width, y, options);
  }

  /** Rendered width in points, including any charSpacing. */
  measure(text: string, options: TextOptions = {}): number {
    const { font = 'Helvetica', size = 12, charSpacing = 0 } = options;
    return stringWidth(text, font, size) + charSpacing * Math.max(0, text.length - 1);
  }

  /**
   * Largest size at or below `startSize` at which `text` fits `maxWidth`.
   *
   * Certificates carry names and programme titles of wildly different lengths,
   * and a long one must shrink rather than run off the page or collide with the
   * rule beneath it.
   */
  fitSize(text: string, maxWidth: number, startSize: number, font: FontName, minSize = 8): number {
    let size = startSize;
    while (size > minSize && stringWidth(text, font, size) > maxWidth) {
      size -= 0.5;
    }
    return size;
  }

  /** @internal */
  usedFonts(): ReadonlySet<FontName> {
    return this.fonts;
  }

  /** @internal */
  content(): string {
    return this.ops.join('\n');
  }
}

/**
 * Assembles pages into a PDF file.
 *
 * The output is uncompressed. A certificate is a couple of kilobytes either
 * way, and skipping the Flate stage keeps this dependency-free and the bytes
 * inspectable with `less`.
 */
export class PdfDocument {
  private pages: Page[] = [];
  private meta: { title?: string; author?: string; subject?: string } = {};

  addPage(size: { width: number; height: number } = PAGE.a4Landscape): Page {
    const page = new Page(size);
    this.pages.push(page);
    return page;
  }

  setMetadata(meta: { title?: string; author?: string; subject?: string }): this {
    this.meta = meta;
    return this;
  }

  build(): Uint8Array {
    if (this.pages.length === 0) throw new Error('Cannot build a PDF with no pages.');

    /*
     * Objects are 1-indexed and the xref table must record each one's exact
     * byte offset, so the body is assembled as a list of strings and the
     * offsets measured as it is concatenated. Latin-1 is the right encoding
     * here: every byte we emit is <= 0xFF by construction (escapeText octal-
     * escapes anything above 126), so one char is always one byte and the
     * offsets stay correct.
     */
    const objects: string[] = [];
    const add = (body: string): number => {
      objects.push(body);
      return objects.length; // object number
    };

    const fontsUsed = new Set<FontName>();
    for (const page of this.pages) {
      for (const font of page.usedFonts()) fontsUsed.add(font);
    }
    // Always include at least one font so the resource dictionary is valid.
    if (fontsUsed.size === 0) fontsUsed.add('Helvetica');

    const catalogNum = add(''); // 1 — patched below, needs the pages object number
    const pagesNum = add(''); // 2 — same

    const fontNums = new Map<FontName, number>();
    for (const font of fontsUsed) {
      fontNums.set(
        font,
        add(`<< /Type /Font /Subtype /Type1 /BaseFont /${font} /Encoding /WinAnsiEncoding >>`),
      );
    }

    const fontResource = [...fontNums.entries()]
      .map(([name, num]) => `/${name} ${num} 0 R`)
      .join(' ');

    const pageNums: number[] = [];
    for (const page of this.pages) {
      const stream = page.content();
      const contentNum = add(
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      );
      pageNums.push(
        add(
          `<< /Type /Page /Parent ${pagesNum} 0 R ` +
            `/MediaBox [0 0 ${fmt(page.width)} ${fmt(page.height)}] ` +
            `/Resources << /Font << ${fontResource} >> >> ` +
            `/Contents ${contentNum} 0 R >>`,
        ),
      );
    }

    objects[catalogNum - 1] = `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`;
    objects[pagesNum - 1] =
      `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(' ')}] ` +
      `/Count ${pageNums.length} >>`;

    let infoNum: number | null = null;
    if (this.meta.title || this.meta.author || this.meta.subject) {
      const parts = ['<< /Type /Info'];
      if (this.meta.title) parts.push(`/Title (${escapeText(this.meta.title)})`);
      if (this.meta.author) parts.push(`/Author (${escapeText(this.meta.author)})`);
      if (this.meta.subject) parts.push(`/Subject (${escapeText(this.meta.subject)})`);
      parts.push('/Producer (Cyconet)');
      parts.push('>>');
      infoNum = add(parts.join(' '));
    }

    let out = '%PDF-1.4\n';
    /*
     * A comment line of high bytes immediately after the header. This is what
     * tells transfer tools the file is binary rather than text, and stops a
     * well-meaning proxy from "helpfully" rewriting the line endings.
     */
    out += '%\xE2\xE3\xCF\xD3\n';

    const offsets: number[] = [];
    for (let i = 0; i < objects.length; i += 1) {
      offsets.push(out.length);
      out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefOffset = out.length;
    out += `xref\n0 ${objects.length + 1}\n`;
    out += '0000000000 65535 f \n';
    for (const offset of offsets) {
      out += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }

    out += 'trailer\n';
    out += `<< /Size ${objects.length + 1} /Root ${catalogNum} 0 R`;
    if (infoNum) out += ` /Info ${infoNum} 0 R`;
    out += ' >>\n';
    out += `startxref\n${xrefOffset}\n%%EOF\n`;

    // Latin-1, one char per byte — see the note on offsets above.
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i += 1) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
}
