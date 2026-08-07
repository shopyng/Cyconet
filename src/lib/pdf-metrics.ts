/**
 * Adobe base-14 font metrics.
 *
 * Widths are in 1/1000 of an em, which is the unit AFM files use and the unit
 * PDF text operators assume: a glyph of width 556 set at 12pt occupies
 * 556/1000 × 12 = 6.672pt.
 *
 * These tables exist because PDF cannot centre text. The format has no layout
 * engine — `Td` places a baseline origin and `Tj` draws from there, rightward.
 * To centre a student's name we have to know how wide it will be before we
 * draw it, and the only way to know that is to sum the glyph widths.
 *
 * Each array is indexed from character code 32 (space) through 126 (~), which
 * covers printable ASCII. Codes outside that range fall back to the width of
 * lowercase `n` — accented Latin letters in the WinAnsi upper range are within
 * a few thousandths of their unaccented base, so the error is far below a pixel
 * at any size we render, and the consequence of being wrong is a slightly
 * off-centre line rather than a malformed file.
 */

export type FontName =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Helvetica-Oblique'
  | 'Times-Roman'
  | 'Times-Bold'
  | 'Times-Italic';

// prettier-ignore
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

// prettier-ignore
const HELVETICA_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

// prettier-ignore
const HELVETICA_OBLIQUE = HELVETICA; // Oblique is a sheared Helvetica — same advance widths.

// prettier-ignore
const TIMES_ROMAN = [
  250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278,
  500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 278, 278, 564, 564, 564, 444,
  921, 722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889, 722, 722,
  556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611, 333, 278, 333, 469, 500,
  333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500, 278, 778, 500, 500,
  500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541,
];

// prettier-ignore
const TIMES_BOLD = [
  250, 333, 555, 500, 500, 1000, 833, 278, 333, 333, 500, 570, 250, 333, 250, 278,
  500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333, 570, 570, 570, 500,
  930, 722, 667, 722, 722, 667, 611, 778, 778, 389, 500, 778, 667, 944, 722, 778,
  611, 778, 722, 556, 667, 722, 722, 1000, 722, 722, 667, 333, 278, 333, 581, 500,
  333, 500, 556, 444, 556, 444, 333, 500, 556, 278, 333, 556, 278, 833, 556, 500,
  556, 556, 444, 389, 333, 556, 500, 722, 500, 500, 444, 394, 220, 394, 520,
];

// prettier-ignore
const TIMES_ITALIC = [
  250, 333, 420, 500, 500, 833, 778, 214, 333, 333, 500, 675, 250, 333, 250, 278,
  500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333, 675, 675, 675, 500,
  920, 611, 611, 667, 722, 611, 611, 722, 722, 333, 444, 667, 556, 833, 667, 722,
  611, 722, 611, 500, 556, 722, 611, 833, 611, 556, 556, 389, 278, 389, 422, 500,
  333, 500, 500, 444, 500, 444, 278, 500, 500, 278, 278, 444, 278, 722, 500, 500,
  500, 500, 389, 389, 278, 500, 444, 667, 444, 444, 389, 400, 275, 400, 541,
];

const TABLES: Record<FontName, readonly number[]> = {
  Helvetica: HELVETICA,
  'Helvetica-Bold': HELVETICA_BOLD,
  'Helvetica-Oblique': HELVETICA_OBLIQUE,
  'Times-Roman': TIMES_ROMAN,
  'Times-Bold': TIMES_BOLD,
  'Times-Italic': TIMES_ITALIC,
};

const FIRST_CODE = 32;
/** Index of lowercase `n` — the fallback advance for anything off-table. */
const FALLBACK_INDEX = 110 - FIRST_CODE;

/** Advance width of one character, in 1/1000 em. */
function charWidth(code: number, font: FontName): number {
  const table = TABLES[font];
  const index = code - FIRST_CODE;
  if (index >= 0 && index < table.length) return table[index];
  return table[FALLBACK_INDEX];
}

/** Rendered width of `text` at `size` points. */
export function stringWidth(text: string, font: FontName, size: number): number {
  let total = 0;
  for (let i = 0; i < text.length; i += 1) {
    total += charWidth(text.charCodeAt(i), font);
  }
  return (total / 1000) * size;
}
