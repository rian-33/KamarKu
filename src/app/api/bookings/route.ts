import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, type RoomRecord } from '@/lib/db';
import { hotelToday } from '@/lib/date';
import { createSnapPayment } from '@/lib/midtrans';

export const runtime = 'nodejs';

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  email: z.email().max(254),
  roomId: z.string().min(1).max(100),
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  guests: z.number().int().min(1).max(12),
}).refine((value) => value.checkOut > value.checkIn, { path: ['checkOut'], message: 'Tanggal check-out harus setelah check-in.' });

export async function POST(request: NextRequest) {
  const demoMode = process.env.NODE_ENV !== 'production' && process.env.PAYMENT_DEMO_MODE === 'true';
  if (!process.env.MIDTRANS_SERVER_KEY && !demoMode) return NextResponse.json({ error: 'Pembayaran belum diaktifkan. Isi kunci Midtrans sandbox atau aktifkan mode simulasi lokal.' }, { status: 503 });
  let input: z.infer<typeof payloadSchema>;
  try {
    input = payloadSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Format permintaan tidak valid.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (input.checkIn < hotelToday()) return NextResponse.json({ error: 'Tanggal check-in tidak boleh di masa lalu.' }, { status: 400 });
  const db = getDb();
  const code = `KK${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  let total = 0;
  let roomName = '';
  const expiresAt = new Date(Date.now() + 30 * 60000).toISOString();
  try {
    db.exec('BEGIN IMMEDIATE');
    const room = db.prepare('SELECT id,name,description,price,capacity,stock,image,amenities FROM rooms WHERE id = ?').get(input.roomId) as RoomRecord | undefined;
    if (!room) { db.exec('ROLLBACK'); return NextResponse.json({ error: 'Tipe kamar tidak ditemukan.' }, { status: 404 }); }
    if (input.guests > room.capacity) { db.exec('ROLLBACK'); return NextResponse.json({ error: 'Jumlah tamu melebihi kapasitas kamar.' }, { status: 400 }); }
    const occupied = db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE room_id = ? AND status IN ('pending','confirmed') AND check_in < ? AND check_out > ?").get(room.id, input.checkOut, input.checkIn) as { count: number };
    if (room.stock - occupied.count < 1) { db.exec('ROLLBACK'); return NextResponse.json({ error: 'Kamar ini sudah penuh untuk tanggal yang dipilih.' }, { status: 409 }); }
    const nights = (Date.parse(`${input.checkOut}T00:00:00Z`) - Date.parse(`${input.checkIn}T00:00:00Z`)) / 86400000;
    total = room.price * nights;
    roomName = room.name;
    db.prepare(`INSERT INTO bookings (code,name,phone,email,room_id,check_in,check_out,guests,total,status,payment_status,payment_order_id,payment_expires_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(code, input.name, input.phone, input.email, room.id, input.checkIn, input.checkOut, input.guests, total, 'pending', 'pending', code, expiresAt);
    db.exec('COMMIT');
  } catch {
    try { db.exec('ROLLBACK'); } catch { /* No transaction remains to roll back. */ }
    return NextResponse.json({ error: 'Pemesanan belum dapat disimpan. Silakan coba kembali.' }, { status: 500 });
  }
  if (demoMode) {
    const paymentUrl = `${request.nextUrl.origin}/payment/demo?code=${encodeURIComponent(code)}`;
    db.prepare('UPDATE bookings SET payment_url=? WHERE code=?').run(paymentUrl, code);
    return NextResponse.json({ booking: { code, name: input.name, email: input.email, roomId: input.roomId, roomName, checkIn: input.checkIn, checkOut: input.checkOut, guests: input.guests, total, status: 'pending', paymentStatus: 'pending', paymentUrl, paymentExpiresAt: expiresAt, demoMode: true } }, { status: 201 });
  }
  try {
    const appUrl = process.env.APP_URL || request.nextUrl.origin;
    const snap = await createSnapPayment({ orderId: code, amount: total, name: input.name, email: input.email, finishUrl: `${appUrl}/booking/result?code=${encodeURIComponent(code)}` });
    db.prepare('UPDATE bookings SET payment_token=?,payment_url=? WHERE code=?').run(snap.token, snap.redirect_url, code);
    return NextResponse.json({ booking: { code, name: input.name, email: input.email, roomId: input.roomId, roomName, checkIn: input.checkIn, checkOut: input.checkOut, guests: input.guests, total, status: 'pending', paymentStatus: 'pending', paymentUrl: snap.redirect_url, paymentExpiresAt: expiresAt } }, { status: 201 });
  } catch (error) {
    db.prepare("UPDATE bookings SET status='cancelled',payment_status='failed' WHERE code=?").run(code);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sesi pembayaran gagal dibuat. Silakan coba kembali.' }, { status: 502 });
  }
}
