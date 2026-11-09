import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hotelToday } from '@/lib/date';

export const runtime = 'nodejs';
function signatureValid(orderId: string, statusCode: string, grossAmount: string, supplied: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !/^[a-f0-9]{128}$/i.test(supplied)) return false;
  const expected = createHash('sha512').update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest('hex');
  const actualBytes = Buffer.from(supplied.toLowerCase());
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function POST(request: NextRequest) {
  const notification = await request.json().catch(() => null) as null | Record<string, unknown>;
  if (!notification || typeof notification.order_id !== 'string' || typeof notification.status_code !== 'string' || typeof notification.gross_amount !== 'string' || typeof notification.signature_key !== 'string') {
    return NextResponse.json({ error: 'Notifikasi pembayaran tidak valid.' }, { status: 400 });
  }
  const { order_id: orderId, status_code: statusCode, gross_amount: grossAmount, signature_key: signature, transaction_status: transactionStatus, fraud_status: fraudStatus } = notification as Record<string,string>;
  if (!signatureValid(orderId,statusCode,grossAmount,signature)) return NextResponse.json({ error: 'Tanda tangan notifikasi tidak valid.' }, { status: 401 });
  const db = getDb();
  const booking = db.prepare('SELECT total,status,payment_status FROM bookings WHERE code=?').get(orderId) as { total:number;status:string;payment_status:string }|undefined;
  if (!booking) return NextResponse.json({ error: 'Kode transaksi tidak ditemukan.' }, { status: 404 });
  if (Math.round(Number(grossAmount)) !== booking.total) return NextResponse.json({ error: 'Nominal transaksi tidak cocok.' }, { status: 400 });

  if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
    if (booking.status === 'pending') {
      db.prepare("UPDATE bookings SET status='confirmed',payment_status='paid',paid_at=?,payment_expires_at=NULL WHERE code=?").run(new Date().toISOString(),orderId);
    } else {
      db.prepare("UPDATE bookings SET payment_status='paid_late',paid_at=? WHERE code=? AND payment_status!='paid'").run(new Date().toISOString(),orderId);
    }
  } else if (transactionStatus === 'expire' || transactionStatus === 'deny' || transactionStatus === 'cancel') {
    db.prepare("UPDATE bookings SET status='cancelled',payment_status=?,cancelled_at=?,identity_delete_at=? WHERE code=? AND status='pending'").run(transactionStatus, new Date().toISOString(), new Date(Date.parse(`${hotelToday()}T00:00:00Z`) + 30*86400000).toISOString().slice(0,10),orderId);
  } else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
    db.prepare('UPDATE bookings SET payment_status=? WHERE code=?').run(transactionStatus === 'refund' ? 'refunded' : 'partially_refunded',orderId);
  }
  return NextResponse.json({ received: true });
}
