import { notFound } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import { db } from '@/lib/db';
import { apexUrl } from '@/lib/tenant';
import { renderCertificatePdf, certificateFileName } from '@/lib/certificate-pdf';
import type { PdfImage } from '@/lib/pdf';

/**
 * The signed-in student's own certificate, as a PDF.
 *
 * Note the route has no `.pdf` extension. The proxy's matcher excludes any path
 * containing a dot (see src/proxy.ts), so `/certificate/ABC.pdf` on
 * learning.cyconet.ng would never be rewritten onto /learning/... and would
 * 404. The download filename comes from Content-Disposition instead, which is
 * what the browser uses regardless of the URL.
 *
 * Authorisation happens here rather than being inherited: route handlers do not
 * run layouts, so the (app) layout's session gate never fires for this request.
 * The lookup is scoped by userId so another student's code returns 404 — and
 * 404 rather than 403, which would confirm the code exists.
 */
export async function GET(
  _request: Request,
  /*
   * Typed explicitly rather than with the generated `RouteContext` helper: that
   * global only exists after `next typegen` has run, so a bare `tsc --noEmit`
   * on a clean checkout would fail. This matches how the page components in
   * this codebase type their params.
   */
  context: { params: Promise<{ code: string }> },
) {
  const user = await verifySession();
  const { code } = await context.params;

  const certificate = await db.certificate.findFirst({
    where: { verificationCode: code.toUpperCase(), userId: user.id },
    include: {
      user: { select: { name: true } },
      program: { select: { title: true, duration: true } },
      signatures: { select: { kind: true, data: true, mimeType: true } },
    },
  });

  if (!certificate) notFound();

  const pdf = renderCertificatePdf({
    holderName: certificate.user.name,
    programTitle: certificate.program.title,
    programDuration: certificate.program.duration,
    issuedAt: certificate.issuedAt,
    verificationCode: certificate.verificationCode,
    verifyUrl: await apexUrl(`/verify/${certificate.verificationCode}`),
    directorSignature: imageForSignature(certificate.signatures, 'DIRECTOR'),
    studentSignature: imageForSignature(certificate.signatures, 'STUDENT'),
  });

  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificateFileName(
        certificate.verificationCode,
      )}"`,
      'Content-Length': String(pdf.byteLength),
      // Personal, and cheap to regenerate — never let a shared cache hold it.
      'Cache-Control': 'private, no-store',
    },
  });
}

function imageForSignature(
  signatures: readonly { kind: string; data: Uint8Array | Buffer; mimeType: string }[],
  kind: 'DIRECTOR' | 'STUDENT',
): PdfImage | undefined {
  const signature = signatures.find((entry) => entry.kind === kind);
  if (!signature) return undefined;
  if (signature.mimeType !== 'image/png' && signature.mimeType !== 'image/jpeg') return undefined;
  return { data: new Uint8Array(signature.data), mimeType: signature.mimeType };
}
