import { notFound } from 'next/navigation';
import { certificateForPdfByCode } from '@/lib/dal';
import { apexUrl } from '@/lib/tenant';
import { renderCertificatePdf, certificateFileName } from '@/lib/certificate-pdf';

/**
 * Public certificate PDF, for whoever the student sent the code to.
 *
 * Deliberately unauthenticated, exactly like the /verify/[code] page beside it:
 * the whole purpose of a verification code is that a third party who has it can
 * check the credential. The PDF lookup returns only what an employer needs
 * — holder, programme, dates, code and the chosen signatory artwork — and
 * nothing else about the student.
 *
 * No `.pdf` in the path; see the note in the learning-side download route.
 */
export async function GET(
  _request: Request,
  // Explicit rather than the generated `RouteContext` — see the note in the
  // learning-side download route.
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const certificate = await certificateForPdfByCode(code.toUpperCase());

  if (!certificate) notFound();

  const pdf = renderCertificatePdf({
    holderName: certificate.holder,
    programTitle: certificate.program,
    programDuration: certificate.duration,
    issuedAt: certificate.issuedAt,
    verificationCode: certificate.code,
    verifyUrl: await apexUrl(`/verify/${certificate.code}`),
    directorSignature: imageForSignature(certificate.signatures, 'DIRECTOR'),
    studentSignature: imageForSignature(certificate.signatures, 'STUDENT'),
  });

  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificateFileName(certificate.code)}"`,
      'Content-Length': String(pdf.byteLength),
      /*
       * Public and stable — a certificate's contents never change once issued —
       * but revocation should take effect quickly, so this is a short cache
       * rather than an immutable one.
       */
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function imageForSignature(
  signatures: readonly { kind: string; data: Uint8Array; mimeType: 'image/png' | 'image/jpeg' }[],
  kind: 'DIRECTOR' | 'STUDENT',
) {
  const signature = signatures.find((entry) => entry.kind === kind);
  return signature ? { data: signature.data, mimeType: signature.mimeType } : undefined;
}
