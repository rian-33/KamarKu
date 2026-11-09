import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, type RoomRecord } from '@/lib/db';
import { hotelToday } from '@/lib/date';
import { encryptPii, parseIdentityPhoto } from '@/lib/pii';
import { createSnapPayment } from '@/lib/midtrans';

export const runtime = 'nodejs';

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  roomId: z.string().min(1).max(100),
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  guests: z.number().int().min(1).max(12),
  identityNumber: z.string().regex(/^\d{16}$/, 'Nomor KTP harus terdiri dari 16 angka.'),
  identityPhoto: z.string().min(1).max(7_100_000),
  identityConsent: z.literal(true),
}).refine((value) => value.checkOut > value.checkIn, { path: ['checkOut'], message: 'Tanggal check-out harus setelah check-in.' });

function addDays(date: string, count: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + count * 86400000).toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  if (!process.env.MIDTRANS_SERVER_KEY) return NextResponse.json({ error: 'Pembayaran belum diaktifkan. Hubungi pengelola hotel.' }, { status: 503 });
  let input: z.infer<typeof payloadSchema>;
  try {
    input = payloadSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Format permintaan tidak valid.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (input.checkIn < hotelToday()) return NextResponse.json({ error: 'Tanggal check-in tidak boleh di masa lalu.' }, { status: 400 });
  let identityPhoto: { bytes: Buffer; mimeType: string };
  let identityNumberEncrypted: string;
  let identityPhotoEncrypted: string;
  try {
    identityPhoto = parseIdentityPhoto(input.identityPhoto);
    identityNumberEncrypted = encryptPii(input.identityNumber);
    identityPhotoEncrypted = encryptPii(identityPhoto.bytes);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Data identitas tidak dapat diproses.' }, { status: 400 });
  }
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
    db.prepare(`INSERT INTO bookings (code,name,email,room_id,check_in,check_out,guests,total,status,identity_number_encrypted,identity_photo_encrypted,identity_photo_mime,identity_consent_at,identity_delete_at,payment_status,payment_order_id,payment_expires_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(code, input.name, input.email, room.id, input.checkIn, input.checkOut, input.guests, total, 'pending', identityNumberEncrypted, identityPhotoEncrypted, identityPhoto.mimeType, new Date().toISOString(), addDays(input.checkOut, 30), 'pending', code, expiresAt);
    db.exec('COMMIT');
  } catch {
    try { db.exec('ROLLBACK'); } catch { /* No transaction remains to roll back. */ }
    return NextResponse.json({ error: 'Pemesanan belum dapat disimpan. Silakan coba kembali.' }, { status: 500 });
  }
  try {
    const appUrl = process.env.APP_URL || request.nextUrl.origin;
    const snap = await createSnapPayment({ orderId: code, amount: total, name: input.name, email: input.email, finishUrl: `${appUrl}/booking/result?code=${encodeURIComponent(code)}` });
    db.prepare('UPDATE bookings SET payment_token=?,payment_url=? WHERE code=?').run(snap.token, snap.redirect_url, code);
    return NextResponse.json({ booking: { code, name: input.name, email: input.email, roomId: input.roomId, roomName, checkIn: input.checkIn, checkOut: input.checkOut, guests: input.guests, total, status: 'pending', paymentStatus: 'pending', paymentUrl: snap.redirect_url, paymentExpiresAt: expiresAt } }, { status: 201 });
  } catch (error) {
    db.prepare("UPDATE bookings SET status='cancelled',payment_status='failed',identity_number_encrypted=NULL,identity_photo_encrypted=NULL,identity_photo_mime=NULL,identity_consent_at=NULL,identity_delete_at=NULL WHERE code=?").run(code);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sesi pembayaran gagal dibuat. Silakan coba kembali.' }, { status: 502 });
  }
}
