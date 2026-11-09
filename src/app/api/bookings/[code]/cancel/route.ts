import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hotelToday } from '@/lib/date';
import { cancelMidtransOrder, cancelMidtransSession, getMidtransStatus, requestMidtransRefund } from '@/lib/midtrans';

export const runtime = 'nodejs';
const CUTOFF_HOUR_WITA = 12; // Check-in begins at 14:00 WITA; cancellations close two hours earlier.
function cancellationDeadline(checkIn: string) { return Date.parse(`${checkIn}T${String(CUTOFF_HOUR_WITA).padStart(2,'0')}:00:00+08:00`); }
function addRetentionDays(date: string) { return new Date(Date.parse(`${date}T00:00:00Z`)+30*86400000).toISOString().slice(0,10); }

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  if (typeof body?.email !== 'string' || !body.email.includes('@')) return NextResponse.json({ error: 'Masukkan email yang digunakan untuk booking.' }, { status: 400 });
  const db = getDb();
  const booking = db.prepare('SELECT code,email,check_in AS checkIn,status,payment_status AS paymentStatus,payment_order_id AS orderId,payment_token AS token,total FROM bookings WHERE code=?').get(code.toUpperCase()) as { code:string;email:string;checkIn:string;status:string;paymentStatus:string;orderId:string|null;token:string|null;total:number }|undefined;
  if (!booking || booking.email.toLowerCase() !== body.email.trim().toLowerCase()) return NextResponse.json({ error: 'Booking tidak ditemukan atau data tidak cocok.' }, { status: 404 });
  if (!['pending','confirmed'].includes(booking.status)) return NextResponse.json({ error: 'Booking ini sudah tidak dapat dibatalkan.' }, { status: 409 });
  if (Date.now() >= cancellationDeadline(booking.checkIn)) return NextResponse.json({ error: 'Batas pembatalan sudah lewat. Pembatalan tersedia sampai 2 jam sebelum check-in pukul 14.00 WITA.' }, { status: 409 });

  let refundStatus = 'not_required';
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return NextResponse.json({ error: 'Layanan pembayaran belum dikonfigurasi; hubungi hotel untuk pembatalan.' }, { status: 503 });
    if (booking.paymentStatus === 'pending') {
      let providerStatus: string | null = null;
      try { providerStatus = (await getMidtransStatus(booking.orderId ?? booking.code)).transaction_status; }
      catch { /* No payment channel has been selected; cancel its unused Snap page. */ }
      if (providerStatus === 'settlement' || providerStatus === 'capture') {
        refundStatus = 'manual_required';
      } else if (providerStatus === 'pending') {
        await cancelMidtransOrder(booking.orderId ?? booking.code);
      } else if (providerStatus === 'expire' || providerStatus === 'cancel' || providerStatus === 'deny') {
        // Already closed by the payment provider.
      } else if (booking.token) {
        await cancelMidtransSession(booking.token);
      }
    } else if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'paid_late') {
      try {
        const provider = await getMidtransStatus(booking.orderId ?? booking.code);
        if (provider.transaction_status === 'settlement') await requestMidtransRefund(booking.orderId ?? booking.code,booking.total,`refund-${booking.code}`);
        else if (provider.transaction_status === 'pending' || provider.transaction_status === 'capture') await cancelMidtransOrder(booking.orderId ?? booking.code);
        else if (provider.transaction_status !== 'cancel' && provider.transaction_status !== 'expire' && provider.transaction_status !== 'deny') refundStatus='manual_required';
      } catch { refundStatus='manual_required'; }
      if (refundStatus !== 'manual_required') refundStatus='refund_requested';
    } else if (booking.paymentStatus === 'paid_late') {
      refundStatus = 'manual_required';
    }
  } catch {
    return NextResponse.json({ error: 'Pembatalan belum dapat diproses di Midtrans. Coba kembali atau hubungi hotel.' }, { status: 502 });
  }

  const cancelledAt = new Date().toISOString();
  const result = db.prepare("UPDATE bookings SET status='cancelled',payment_status=CASE WHEN payment_status='pending' THEN 'cancelled' ELSE payment_status END,refund_status=?,cancelled_at=?,identity_delete_at=? WHERE code=? AND status IN ('pending','confirmed')").run(refundStatus,cancelledAt,addRetentionDays(hotelToday()),booking.code);
  if (!result.changes) return NextResponse.json({ error: 'Status booking berubah. Muat ulang lalu periksa kembali.' }, { status: 409 });
  return NextResponse.json({ ok: true, status: 'cancelled', refundStatus, message: refundStatus === 'manual_required' ? 'Booking dibatalkan. Hubungi hotel untuk menyelesaikan refund.' : refundStatus === 'refund_requested' ? 'Booking dibatalkan dan permintaan refund sudah dikirim ke Midtrans.' : 'Booking dibatalkan.' });
}
