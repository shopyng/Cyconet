'use server';

/**
 * Student-side payment actions.
 *
 * The only thing a student can do here is attach proof of a transfer they have
 * already made. Approval is an admin action (see reviewPayment in
 * admin-actions.ts) — nothing in this file can activate an enrolment.
 *
 * Like every action in the app, this re-derives the session rather than
 * trusting an ID in the FormData: Server Actions are reachable by direct POST,
 * so a hand-crafted request could otherwise attach a receipt to someone else's
 * payment.
 */

import { revalidatePath } from 'next/cache';
import { db } from './db';
import { verifySession } from './dal';
import type { FormState } from './form-state';

/** 5MB. A phone photo of a receipt is typically well under 2MB. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Accepted formats, keyed by the signature at the start of the file.
 *
 * Sniffed from the bytes rather than trusted from `File.type`, which is set by
 * the browser from the file extension and is trivially forged — renaming
 * payload.exe to receipt.png is enough to spoof it. We store these bytes and
 * later serve them back with a Content-Type, so letting a caller choose that
 * type is how a stored-XSS or drive-by-download bug gets built.
 */
const SIGNATURES: readonly {
  mime: string;
  magic: readonly number[];
  /** Bytes to skip before matching — WebP's marker is at offset 8. */
  offset?: number;
}[] = [
  { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  { mime: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/webp', magic: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" in a RIFF container
];

/** The real type of `bytes`, or null if it is not one we accept. */
function sniffMime(bytes: Uint8Array): string | null {
  for (const signature of SIGNATURES) {
    const offset = signature.offset ?? 0;
    if (bytes.length < offset + signature.magic.length) continue;

    let matches = true;
    for (let i = 0; i < signature.magic.length; i += 1) {
      if (bytes[offset + i] !== signature.magic[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return signature.mime;
  }
  return null;
}

/** Strips directory components and anything awkward out of an upload's name. */
function safeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? 'receipt';
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);
  return cleaned || 'receipt';
}

/**
 * Attach proof of payment.
 *
 * Replaces any previous proof rather than accumulating them: a student whose
 * upload was rejected re-uploads a corrected receipt, and keeping the rejected
 * one would only make the admin queue ambiguous about which to look at.
 */
export async function uploadPaymentProof(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await verifySession();
  const paymentId = String(formData.get('paymentId') ?? '');
  const file = formData.get('proof');

  if (!paymentId) {
    return { status: 'error', message: 'Missing payment.' };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: 'error',
      message: 'Choose the receipt file to upload.',
      errors: { proof: 'A file is required.' },
    };
  }

  if (file.size > MAX_BYTES) {
    return {
      status: 'error',
      message: 'That file is too large.',
      errors: { proof: 'Keep the file under 5MB.' },
    };
  }

  // Scoped by userId — a forged paymentId belonging to someone else finds
  // nothing rather than attaching a receipt to their record.
  const payment = await db.payment.findFirst({
    where: { id: paymentId, userId: user.id },
    select: { id: true, status: true },
  });

  if (!payment) {
    return { status: 'error', message: 'That payment does not exist.' };
  }
  if (payment.status === 'APPROVED') {
    return { status: 'error', message: 'This payment has already been approved.' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffMime(bytes);

  if (!mimeType) {
    return {
      status: 'error',
      message: 'That file type is not accepted.',
      errors: { proof: 'Upload a PNG, JPEG or WebP image, or a PDF.' },
    };
  }

  await db.$transaction(async (tx) => {
    await tx.paymentProof.deleteMany({ where: { paymentId: payment.id } });
    await tx.paymentProof.create({
      data: {
        paymentId: payment.id,
        data: Buffer.from(bytes),
        mimeType,
        fileName: safeFileName(file.name),
        size: bytes.byteLength,
      },
    });
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PENDING',
        // Clear the previous decision so the admin queue does not show a stale
        // rejection against a receipt that has since been replaced.
        reviewNotes: null,
        reviewedAt: null,
        reviewedBy: null,
      },
    });
  });

  revalidatePath('/payment');
  revalidatePath('/admin', 'layout');

  return {
    status: 'success',
    message: 'Proof of payment received. We will confirm it shortly — usually within a working day.',
  };
}
