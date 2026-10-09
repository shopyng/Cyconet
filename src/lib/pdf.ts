/**
 * A minimal PDF writer.
 *
 * Enough of PDF 1.4 to lay out a certificate: filled rectangles, lines, images
 * and text positioned absolutely. No third-party dependencies, no font
 * binaries, no headless browser — it emits the bytes directly.
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
import { deflateSync, inflateSync } from 'node:zlib';

export type { FontName };

export type Rgb = readonly [number, number, number];

export type PdfImage = {
  data: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
};

type Op = string;

type ImagePlacement = {
  image: PdfImage;
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_IMAGE_PIXELS = 4_000_000;

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
  private images: ImagePlacement[] = [];

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

  /** Draws an uploaded signature image into the given box. */
  image(image: PdfImage, x: number, y: number, width: number, height: number): this {
    this.images.push({ image, x, y, width, height });
    return this;
  }

  /** Draws a QR matrix as vector squares, so it remains sharp when printed. */
  qr(matrix: readonly (readonly boolean[])[], x: number, y: number, size: number, color: Rgb): this {
    const moduleSize = size / matrix.length;
    for (let row = 0; row < matrix.length; row += 1) {
      for (let column = 0; column < matrix[row].length; column += 1) {
        if (matrix[row][column]) {
          this.rect(x + column * moduleSize, y + size - (row + 1) * moduleSize, moduleSize, moduleSize, color);
        }
      }
    }
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
  usedImages(): readonly ImagePlacement[] {
    return this.images;
  }

  /** @internal */
  content(imageNames: ReadonlyMap<ImagePlacement, string> = new Map()): string {
    const imageOps = this.images.map((placement) => {
      const name = imageNames.get(placement);
      if (!name) throw new Error('PDF image resource was not registered.');
      return [
        'q',
        `${fmt(placement.width)} 0 0 ${fmt(placement.height)} ${fmt(placement.x)} ${fmt(placement.y)} cm`,
        `/${name} Do`,
        'Q',
      ].join('\n');
    });
    return [...this.ops, ...imageOps].join('\n');
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

    const imageNames = new Map<ImagePlacement, string>();
    const imageNums = new Map<string, number>();
    let imageIndex = 0;

    for (const page of this.pages) {
      for (const placement of page.usedImages()) {
        const name = `Im${++imageIndex}`;
        const prepared = prepareImage(placement.image);
        const alphaNum = prepared.alpha
          ? addImageObject({
              width: prepared.width,
              height: prepared.height,
              colorSpace: '/DeviceGray',
              data: prepared.alpha,
              filter: '/FlateDecode',
            }, add)
          : null;
        const imageNum = addImageObject(
          {
            width: prepared.width,
            height: prepared.height,
            colorSpace: prepared.colorSpace,
            data: prepared.data,
            filter: prepared.filter,
            alphaNum,
          },
          add,
        );
        imageNames.set(placement, name);
        imageNums.set(name, imageNum);
      }
    }

    const imageResource = [...imageNums.entries()]
      .map(([name, num]) => `/${name} ${num} 0 R`)
      .join(' ');

    const pageNums: number[] = [];
    for (const page of this.pages) {
      const stream = page.content(imageNames);
      const contentNum = add(
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      );
      const resources = [`/Font << ${fontResource} >>`];
      if (imageResource) resources.push(`/XObject << ${imageResource} >>`);
      pageNums.push(
        add(
          `<< /Type /Page /Parent ${pagesNum} 0 R ` +
            `/MediaBox [0 0 ${fmt(page.width)} ${fmt(page.height)}] ` +
            `/Resources << ${resources.join(' ')} >> ` +
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

type PreparedImage = {
  width: number;
  height: number;
  colorSpace: string;
  data: Uint8Array;
  filter: string;
  alpha?: Uint8Array;
};

function addImageObject(
  image: {
    width: number;
    height: number;
    colorSpace: string;
    data: Uint8Array;
    filter: string;
    alphaNum?: number | null;
  },
  add: (body: string) => number,
): number {
  const parts = [
    '<< /Type /XObject /Subtype /Image',
    `/Width ${image.width}`,
    `/Height ${image.height}`,
    `/ColorSpace ${image.colorSpace}`,
    '/BitsPerComponent 8',
    `/Filter ${image.filter}`,
  ];
  if (image.alphaNum) parts.push(`/SMask ${image.alphaNum} 0 R`);
  parts.push(`/Length ${image.data.byteLength} >>`);
  return add(`${parts.join(' ')}\nstream\n${latin1(image.data)}\nendstream`);
}

function latin1(data: Uint8Array): string {
  let result = '';
  // Chunking prevents a large signature upload from overflowing the argument
  // limit of String.fromCharCode.apply.
  for (let offset = 0; offset < data.length; offset += 0x8000) {
    const chunk = data.subarray(offset, offset + 0x8000);
    result += String.fromCharCode(...chunk);
  }
  return result;
}

function prepareImage(image: PdfImage): PreparedImage {
  if (image.mimeType === 'image/jpeg') return prepareJpeg(image.data);
  return preparePng(image.data);
}

function prepareJpeg(data: Uint8Array): PreparedImage {
  if (data[0] !== 0xff || data[1] !== 0xd8) throw new Error('Invalid JPEG signature.');

  let offset = 2;
  while (offset + 8 < data.length) {
    while (offset < data.length && data[offset] !== 0xff) offset += 1;
    while (offset < data.length && data[offset] === 0xff) offset += 1;
    const marker = data[offset++];
    if (marker === undefined) break;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = readUint16(data, offset);
    if (!length || offset + length > data.length) break;

    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = readUint16(data, offset + 3);
      const width = readUint16(data, offset + 5);
      const components = data[offset + 7] ?? 3;
      if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
        throw new Error('Signature image dimensions are too large.');
      }
      const colorSpace = components === 1 ? '/DeviceGray' : components === 4 ? '/DeviceCMYK' : '/DeviceRGB';
      return { width, height, colorSpace, data, filter: '/DCTDecode' };
    }
    offset += length;
  }
  throw new Error('JPEG dimensions could not be read.');
}

function preparePng(data: Uint8Array): PreparedImage {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((byte, index) => data[index] === byte)) {
    throw new Error('Invalid PNG signature.');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette: Uint8Array | undefined;
  let transparency: Uint8Array | undefined;
  const idat: Uint8Array[] = [];

  while (offset + 12 <= data.length) {
    const length = readUint32(data, offset);
    const type = String.fromCharCode(...data.subarray(offset + 4, offset + 8));
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') {
      width = readUint32(chunk, 0);
      height = readUint32(chunk, 4);
      bitDepth = chunk[8] ?? 0;
      colorType = chunk[9] ?? 0;
      interlace = chunk[12] ?? 0;
    } else if (type === 'IDAT') {
      idat.push(chunk);
    } else if (type === 'PLTE') {
      palette = chunk;
    } else if (type === 'tRNS') {
      transparency = chunk;
    } else if (type === 'IEND') {
      break;
    }
  }

  const bytesPerPixel =
    colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 3 || colorType === 0 ? 1 : 0;
  if (
    !width ||
    !height ||
    bitDepth !== 8 ||
    !bytesPerPixel ||
    interlace !== 0 ||
    idat.length === 0 ||
    (colorType === 3 && (!palette || palette.length < 3)) ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new Error('Only non-interlaced 8-bit RGB/RGBA PNG signatures are supported.');
  }

  const compressed = joinBytes(idat);
  const filtered = new Uint8Array(inflateSync(Buffer.from(compressed)));
  const stride = width * bytesPerPixel;
  const pixels = new Uint8Array(height * stride);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = filtered[sourceOffset++];
    const rowStart = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = filtered[sourceOffset++];
      const left = x >= bytesPerPixel ? pixels[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[rowStart - stride + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? pixels[rowStart - stride + x - bytesPerPixel] : 0;
      pixels[rowStart + x] = unfilterByte(filter, raw, left, up, upperLeft);
    }
  }

  const channels = colorType === 6 || colorType === 2 || colorType === 3 ? 3 : 1;
  const rgb = new Uint8Array(width * height * channels);
  const alpha =
    colorType === 6 || colorType === 4 || (colorType === 3 && transparency)
      ? new Uint8Array(width * height)
      : undefined;
  let rgbOffset = 0;
  let alphaOffset = 0;
  for (let i = 0; i < width * height; i += 1) {
    const source = i * bytesPerPixel;
    if (colorType === 6) {
      rgb[rgbOffset++] = pixels[source];
      rgb[rgbOffset++] = pixels[source + 1];
      rgb[rgbOffset++] = pixels[source + 2];
      if (alpha) alpha[alphaOffset++] = pixels[source + 3];
    } else if (colorType === 4) {
      rgb[rgbOffset++] = pixels[source];
      if (alpha) alpha[alphaOffset++] = pixels[source + 1];
    } else if (colorType === 3) {
      const paletteIndex = pixels[source] * 3;
      rgb[rgbOffset++] = palette?.[paletteIndex] ?? 0;
      rgb[rgbOffset++] = palette?.[paletteIndex + 1] ?? 0;
      rgb[rgbOffset++] = palette?.[paletteIndex + 2] ?? 0;
      if (alpha) alpha[alphaOffset++] = transparency?.[pixels[source]] ?? 255;
    } else if (colorType === 2) {
      rgb[rgbOffset++] = pixels[source];
      rgb[rgbOffset++] = pixels[source + 1];
      rgb[rgbOffset++] = pixels[source + 2];
    } else {
      rgb[rgbOffset++] = pixels[source];
    }
  }

  return {
    width,
    height,
    colorSpace: channels === 3 ? '/DeviceRGB' : '/DeviceGray',
    data: new Uint8Array(deflateSync(Buffer.from(rgb))),
    filter: '/FlateDecode',
    alpha: alpha ? new Uint8Array(deflateSync(Buffer.from(alpha))) : undefined,
  };
}

function unfilterByte(filter: number | undefined, raw: number | undefined, left: number, up: number, upperLeft: number): number {
  const value = raw ?? 0;
  switch (filter) {
    case 1:
      return (value + left) & 0xff;
    case 2:
      return (value + up) & 0xff;
    case 3:
      return (value + Math.floor((left + up) / 2)) & 0xff;
    case 4:
      return (value + paeth(left, up, upperLeft)) & 0xff;
    default:
      return value;
  }
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function joinBytes(chunks: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function readUint16(data: Uint8Array, offset: number): number {
  return ((data[offset] ?? 0) << 8) | (data[offset + 1] ?? 0);
}

function readUint32(data: Uint8Array, offset: number): number {
  return (
    ((data[offset] ?? 0) << 24) |
    ((data[offset + 1] ?? 0) << 16) |
    ((data[offset + 2] ?? 0) << 8) |
    (data[offset + 3] ?? 0)
  ) >>> 0;
}
