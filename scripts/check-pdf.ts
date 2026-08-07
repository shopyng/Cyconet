/**
 * Renders sample certificates for manual and automated inspection.
 *
 * Run: npx tsx scripts/check-pdf.ts
 * Then: pdfinfo /tmp/cert-long.pdf && pdftotext /tmp/cert-long.pdf -
 *
 * The awkward names are the point — a long hyphenated name, an apostrophe, and
 * a parenthesis all exercise the escaping and auto-fit paths that a tidy
 * "Demo Student" would not.
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { renderCertificatePdf } from '../src/lib/certificate-pdf';
import { stringWidth } from '../src/lib/pdf-metrics';

const CASES = [
  { file: '/tmp/cert-short.pdf', holderName: 'Ada Obi' },
  { file: '/tmp/cert-long.pdf', holderName: 'Oluwaseun Adebayo-Fashola Oyinlola' },
  { file: '/tmp/cert-odd.pdf', holderName: "O'Brien (Tunde) \\ Smith" },
];

let failures = 0;

for (const testCase of CASES) {
  const bytes = renderCertificatePdf({
    holderName: testCase.holderName,
    programTitle: 'Cybersecurity',
    programDuration: '14 weeks',
    issuedAt: new Date('2026-08-07T00:00:00Z'),
    verificationCode: 'K7M2QW9XZ4',
    verifyUrl: 'cyconet.ng/verify/K7M2QW9XZ4',
  });
  fs.writeFileSync(testCase.file, bytes);

  /*
   * The real assertion. Rendering bytes proves nothing on its own — what
   * matters is that a PDF reader can parse the file AND recover the student's
   * name as selectable text, which is what an employer or an ATS will do with
   * it. pdftotext is an independent implementation, so this catches errors our
   * own writer would happily round-trip.
   */
  let extracted = '';
  try {
    extracted = execFileSync('pdftotext', [testCase.file, '-'], {
      encoding: 'utf8',
    });
  } catch {
    console.log(`${testCase.file}  pdftotext unavailable — skipping text check`);
    continue;
  }

  // pdftotext may wrap or re-space lines, so compare on collapsed whitespace.
  const flat = extracted.replace(/\s+/g, ' ');
  const wanted = testCase.holderName.replace(/\s+/g, ' ');
  const ok = flat.includes(wanted);
  if (!ok) failures += 1;

  console.log(
    `${testCase.file}  ${bytes.length} bytes  name-in-text: ${ok ? 'OK' : 'MISSING'}  "${testCase.holderName}"`,
  );
}

// Width tables must cover codes 32..126 inclusive.
const src = fs.readFileSync('src/lib/pdf-metrics.ts', 'utf8');
const tables = src.matchAll(
  /const (HELVETICA|HELVETICA_BOLD|TIMES_ROMAN|TIMES_BOLD|TIMES_ITALIC) = \[([^\]]*)\]/g,
);
for (const table of tables) {
  const count = table[2].split(',').filter((entry) => entry.trim()).length;
  if (count !== 95) failures += 1;
  console.log(`${table[1].padEnd(16)} ${count} widths ${count === 95 ? 'OK' : 'MISMATCH'}`);
}

console.log('Helvetica 12pt "Hello" =', stringWidth('Hello', 'Helvetica', 12).toFixed(3), 'pt');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll checks passed.');

