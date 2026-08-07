/**
 * Renders a certificate as a real PDF.
 *
 * The student's name is the point of the document, so it gets the largest type
 * on the page and its own rule. It is also the one field of unbounded length —
 * `fitSize` shrinks it rather than letting a long name run into the frame.
 *
 * A4 landscape at 72dpi. Coordinates in this module are expressed from the TOP
 * of the page and converted by `fromTop`, because that is how the layout was
 * designed; PDF's own origin is bottom-left.
 */

import { PdfDocument, PAGE, type Rgb } from './pdf';

/*
 * Print palette. The marketing cyan (#00E5FF) is deliberately not used: it
 * measures about 1.3:1 on white and all but disappears on a printed page. This
 * is the same hue taken far enough down in luminance to hold up in ink.
 */
const INK: Rgb = [0.059, 0.09, 0.165]; // #0F172A
const MUTED: Rgb = [0.392, 0.455, 0.545]; // #64748B
const ACCENT: Rgb = [0.031, 0.569, 0.698]; // #0891B2
const FAINT: Rgb = [0.85, 0.88, 0.91];
const PAPER: Rgb = [1, 1, 1];

export type CertificateData = {
  /** The name printed on the certificate. */
  holderName: string;
  programTitle: string;
  programDuration: string;
  issuedAt: Date;
  verificationCode: string;
  /** Absolute URL a third party can check, e.g. https://cyconet.ng/verify/ABC. */
  verifyUrl: string;
};

function formatIssueDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function renderCertificatePdf(data: CertificateData): Uint8Array {
  const doc = new PdfDocument();
  doc.setMetadata({
    title: `Cyconet Certificate — ${data.holderName}`,
    author: 'Cyconet',
    subject: `${data.programTitle} — certificate of completion`,
  });

  const page = doc.addPage(PAGE.a4Landscape);
  const W = page.width;
  const H = page.height;
  const cx = W / 2;
  const fromTop = (y: number) => H - y;

  page.rect(0, 0, W, H, PAPER);

  /* ---------------- Frame ---------------- */

  // A wide accent band down the left edge anchors the composition and gives the
  // page an obvious "front" when it is filed in a stack.
  page.rect(0, 0, 14, H, ACCENT);

  page.strokeRect(32, 30, W - 64, H - 60, ACCENT, 1.6);
  page.strokeRect(41, 39, W - 82, H - 78, FAINT, 0.6);

  /* ---------------- Masthead ---------------- */

  const brand = 'CYCONET';
  const brandSize = 15;
  const brandSpacing = 5.5;
  const brandWidth = page.measure(brand, {
    font: 'Helvetica-Bold',
    size: brandSize,
    charSpacing: brandSpacing,
  });
  // The mark and the wordmark are centred as a single unit, so the square sits
  // to the left of the text rather than the text being centred around it.
  const markSize = 11;
  const lockupWidth = markSize + 10 + brandWidth;
  const lockupLeft = cx - lockupWidth / 2;

  page.rect(lockupLeft, fromTop(84) - 1, markSize, markSize, ACCENT);
  page.text(brand, lockupLeft + markSize + 10, fromTop(84), {
    font: 'Helvetica-Bold',
    size: brandSize,
    color: INK,
    charSpacing: brandSpacing,
  });

  page.textCentered('CYBERSECURITY ACADEMY  ·  TECH SCHOOL  ·  IBADAN, NIGERIA', cx, fromTop(104), {
    font: 'Helvetica',
    size: 7.5,
    color: MUTED,
    charSpacing: 1.8,
  });

  /* ---------------- Title ---------------- */

  page.textCentered('Certificate of Completion', cx, fromTop(168), {
    font: 'Times-Bold',
    size: 38,
    color: INK,
  });

  page.line(cx - 46, fromTop(188), cx + 46, fromTop(188), ACCENT, 1.4);

  /* ---------------- Holder ---------------- */

  page.textCentered('This is to certify that', cx, fromTop(232), {
    font: 'Times-Italic',
    size: 13,
    color: MUTED,
  });

  /*
   * The headline. Fitted rather than fixed: "Ada Obi" and
   * "Oluwaseun Adebayo-Fashola" are both plausible, and the second must not
   * collide with the frame.
   */
  const nameMaxWidth = W - 260;
  const nameSize = page.fitSize(data.holderName, nameMaxWidth, 36, 'Times-Bold', 16);
  page.textCentered(data.holderName, cx, fromTop(282), {
    font: 'Times-Bold',
    size: nameSize,
    color: INK,
  });

  // Rule sized to the name it underlines, with a floor so a short name still
  // gets a rule long enough to read as a deliberate flourish.
  const nameWidth = page.measure(data.holderName, { font: 'Times-Bold', size: nameSize });
  const ruleHalf = Math.min(nameMaxWidth, Math.max(nameWidth + 70, 260)) / 2;
  page.line(cx - ruleHalf, fromTop(298), cx + ruleHalf, fromTop(298), FAINT, 0.9);

  /* ---------------- Programme ---------------- */

  page.textCentered('has successfully completed the programme', cx, fromTop(334), {
    font: 'Times-Italic',
    size: 13,
    color: MUTED,
  });

  const titleSize = page.fitSize(data.programTitle, W - 300, 20, 'Helvetica-Bold', 12);
  page.textCentered(data.programTitle.toUpperCase(), cx, fromTop(370), {
    font: 'Helvetica-Bold',
    size: titleSize,
    color: ACCENT,
    charSpacing: 1.2,
  });

  page.textCentered(
    `${data.programDuration}  ·  Issued ${formatIssueDate(data.issuedAt)}`,
    cx,
    fromTop(394),
    { font: 'Helvetica', size: 10, color: MUTED },
  );

  page.textCentered(
    'Awarded on completion of every lesson, examination and assessed project on the programme.',
    cx,
    fromTop(420),
    { font: 'Helvetica', size: 8.5, color: MUTED },
  );

  /* ---------------- Footer ---------------- */

  const footY = 500;
  const leftX = 96;
  const rightX = W - 96;

  page.text('VERIFICATION CODE', leftX, fromTop(footY - 16), {
    font: 'Helvetica-Bold',
    size: 7,
    color: MUTED,
    charSpacing: 1.4,
  });
  page.text(data.verificationCode, leftX, fromTop(footY), {
    font: 'Helvetica-Bold',
    size: 14,
    color: INK,
    charSpacing: 1.6,
  });
  page.text(`Verify at ${data.verifyUrl}`, leftX, fromTop(footY + 16), {
    font: 'Helvetica',
    size: 8,
    color: MUTED,
  });

  // Signature block, right-aligned against the same optical margin.
  page.line(rightX - 190, fromTop(footY - 2), rightX, fromTop(footY - 2), MUTED, 0.8);
  page.textRight('Cyconet Academy', rightX, fromTop(footY - 8), {
    font: 'Times-Italic',
    size: 13,
    color: INK,
  });
  page.textRight('Director of Studies', rightX, fromTop(footY + 12), {
    font: 'Helvetica',
    size: 8,
    color: MUTED,
    charSpacing: 0.8,
  });

  return doc.build();
}

/** Filename offered to the browser. Safe for every OS: ASCII, no spaces. */
export function certificateFileName(code: string): string {
  return `Cyconet-Certificate-${code.replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
}
