import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const booking = getDb().prepare(`SELECT b.code,b.room_id AS roomId,r.name AS roomName,b.check_in AS checkIn,b.check_out AS checkOut,b.guests,b.total,b.status,b.payment_status AS paymentStatus,b.paid_at AS paidAt,b.refund_status AS refundStatus,b.payment_expires_at AS paymentExpiresAt FROM bookings b JOIN rooms r ON r.id=b.room_id WHERE b.code=?`).get(code.toUpperCase());
  if (!booking) return NextResponse.json({ error: 'Kode booking tidak ditemukan.' }, { status: 404, headers: { 'Cache-Control': 'no-store, private' } });
  return NextResponse.json({ booking }, { headers: { 'Cache-Control': 'no-store, private' } });
}
