import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { z } from 'zod';
import { hotelToday } from '@/lib/date';
import { cancelMidtransOrder, cancelMidtransSession, getMidtransStatus, requestMidtransRefund } from '@/lib/midtrans';

export const runtime = 'nodejs';
const statusSchema = z.object({ status: z.enum(['confirmed', 'cancelled', 'completed']) });

export function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const bookings = getDb().prepare(`SELECT b.code,b.name,b.email,b.room_id AS roomId,r.name AS roomName,b.check_in AS checkIn,b.check_out AS checkOut,b.guests,b.total,b.status,b.payment_status AS paymentStatus,b.paid_at AS paidAt,b.refund_status AS refundStatus,(b.identity_photo_encrypted IS NOT NULL) AS identityProvided FROM bookings b JOIN rooms r ON r.id=b.room_id ORDER BY b.created_at DESC`).all();
  return NextResponse.json({ bookings }, { headers: { 'Cache-Control': 'no-store, private' } });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const code = request.nextUrl.searchParams.get('code');
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!code || !parsed.success) return NextResponse.json({ error: 'Perubahan status tidak valid.' }, { status: 400 });
  const db = getDb();
  const booking = db.prepare('SELECT code,status,payment_status AS paymentStatus,payment_order_id AS orderId,payment_token AS token,total FROM bookings WHERE code=?').get(code) as {code:string;status:string;paymentStatus:string;orderId:string|null;token:string|null;total:number}|undefined;
  if (!booking || !['pending','confirmed'].includes(booking.status)) return NextResponse.json({ error: 'Booking tidak ditemukan atau statusnya sudah berubah.' }, { status: 409 });
  let refundStatus:string|null=null;
  if (parsed.data.status==='cancelled') {
    if (!process.env.MIDTRANS_SERVER_KEY) return NextResponse.json({ error: 'Midtrans belum dikonfigurasi; booking tidak diubah.' }, { status: 503 });
    try {
      if (booking.paymentStatus==='pending') {
        let providerStatus:string|null=null;
        try { providerStatus=(await getMidtransStatus(booking.orderId??booking.code)).transaction_status; } catch { /* An unused Snap session may not have a transaction yet. */ }
        if (providerStatus==='settlement') refundStatus='manual_required';
        else if (providerStatus==='pending') await cancelMidtransOrder(booking.orderId??booking.code);
        else if (!['expire','cancel','deny'].includes(providerStatus??'') && booking.token) await cancelMidtransSession(booking.token);
      } else if (booking.paymentStatus==='paid') {
        await requestMidtransRefund(booking.orderId??booking.code,booking.total,`refund-${booking.code}`);
        refundStatus='refund_requested';
      } else if (booking.paymentStatus==='paid_late') refundStatus='manual_required';
    } catch { return NextResponse.json({ error: 'Pembatalan Midtrans gagal diproses; booking tidak diubah.' }, { status: 502 }); }
  }
  const now = new Date().toISOString();
  const deleteAt = new Date(Date.parse(`${hotelToday()}T00:00:00Z`)+30*86400000).toISOString().slice(0,10);
  const changed = db.prepare(`UPDATE bookings SET status=?,
      payment_status=CASE WHEN ?='cancelled' AND payment_status='pending' THEN 'cancelled' ELSE payment_status END,
      cancelled_at=CASE WHEN ?='cancelled' THEN ? ELSE cancelled_at END,
      identity_delete_at=CASE WHEN ?='cancelled' THEN ? ELSE identity_delete_at END,
      refund_status=CASE WHEN ?='cancelled' AND ? IS NOT NULL THEN ? WHEN ?='cancelled' AND payment_status IN ('paid','paid_late') THEN 'manual_required' ELSE refund_status END
    WHERE code=? AND status IN ('pending','confirmed')
      AND (?!='confirmed' OR payment_status='paid')
      AND (?!='completed' OR check_out<=?)`).run(parsed.data.status,parsed.data.status,parsed.data.status,now,parsed.data.status,deleteAt,parsed.data.status,refundStatus,refundStatus,parsed.data.status,code,parsed.data.status,parsed.data.status,hotelToday());
  if (changed.changes === 0) return NextResponse.json({ error: 'Booking belum dibayar, tidak ditemukan, status tidak dapat diubah, atau check-out belum tiba.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
