import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/dal';
import { db } from '@/lib/db';

/**
 * Serves an uploaded payment receipt.
 *
 * Authorisation is done here, not inherited. Route handlers do not run
 * layouts, so the learning and admin gates never fire for this request — this
 * handler is the only thing standing between a receipt and the internet.
 *
 * Two callers are allowed: the student who uploaded it, and any admin
 * reviewing the queue. Anything else gets a 404 rather than a 403, so the
 * response does not confirm that a given payment ID exists.
 */
export async function GET(
  _request: Request,
  // Explicit rather than the generated `RouteContext` global, which only exists
  // once `next typegen` has run.
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) notFound();

  const { id } = await context.params;

  const payment = await db.payment.findUnique({
    where: { id },
    select: {
      userId: true,
      proof: { select: { data: true, mimeType: true, fileName: true } },
    },
  });

  if (!payment?.proof) notFound();
  if (user.role !== 'ADMIN' && payment.userId !== user.id) notFound();

  const { data, mimeType, fileName } = payment.proof;

  return new Response(new Uint8Array(data) as BodyInit, {
    headers: {
      'Content-Type': mimeType,
      /*
       * `inline` so an admin can eyeball the receipt without downloading it.
       * That is only safe because the type was sniffed from the file's own
       * magic bytes at upload (see payment-actions.ts) rather than taken from
       * the client — otherwise this header would happily serve HTML from our
       * own origin.
       */
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': String(data.length),
      // Belt and braces: forbid MIME sniffing, and disallow scripts outright.
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; object-src 'none'",
      'Cache-Control': 'private, no-store',
    },
  });
}
