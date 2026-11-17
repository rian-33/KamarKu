import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

const outcomeSchema = z.object({ outcome: z.enum(['paid', 'failed', 'cancelled']) });

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  if (process.env.NODE_ENV === 'production' || process.env.PAYMENT_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Mode simulasi tidak tersedia.' }, { status: 404 });
  }

  const { code } = await context.params;
  const parsed = outcomeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Hasil simulasi tidak valid.' }, { status: 400 });

  const db = getDb();
  const bookingCode = code.toUpperCase();
  const now = new Date().toISOString();
  const isPaid = parsed.data.outcome === 'paid';
  const status = isPaid ? 'confirmed' : 'cancelled';
  const paymentStatus = isPaid ? 'paid' : parsed.data.outcome === 'failed' ? 'failed' : 'cancelled';
  const updated = db.prepare(`UPDATE bookings
    SET status=?,payment_status=?,paid_at=CASE WHEN ?='paid' THEN COALESCE(paid_at,?) ELSE paid_at END,
        cancelled_at=CASE WHEN ?='paid' THEN cancelled_at ELSE COALESCE(cancelled_at,?) END,
        payment_expires_at=NULL
    WHERE code=? AND status='pending' AND payment_status='pending'`)
    .run(status, paymentStatus, paymentStatus, now, paymentStatus, now, bookingCode);

  if (!updated.changes) return NextResponse.json({ error: 'Booking tidak ditemukan atau sudah diproses.' }, { status: 409 });
  return NextResponse.json({ ok: true, status, paymentStatus });
}
