import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
const roomSchema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500), price: z.number().int().min(0), capacity: z.number().int().min(1).max(12), stock: z.number().int().min(0).max(500), image: z.url(), amenities: z.array(z.string().trim().min(1).max(50)).max(20) });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const { id } = await context.params;
  const parsed = roomSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data kamar tidak valid.' }, { status: 400 });
  const room = parsed.data;
  const result = getDb().prepare('UPDATE rooms SET name=?,description=?,price=?,capacity=?,stock=?,image=?,amenities=? WHERE id=?').run(room.name, room.description, room.price, room.capacity, room.stock, room.image, room.amenities.join(','), id);
  if (!result.changes) return NextResponse.json({ error: 'Tipe kamar tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const { id } = await context.params;
  const db = getDb();
  const used = db.prepare('SELECT COUNT(*) AS count FROM bookings WHERE room_id=?').get(id) as { count: number } | undefined;
  if (!used) return NextResponse.json({ error: 'Tipe kamar tidak ditemukan.' }, { status: 404 });
  if (used.count > 0) return NextResponse.json({ error: 'Kamar sudah memiliki riwayat booking dan tidak dapat dihapus.' }, { status: 409 });
  const result = db.prepare('DELETE FROM rooms WHERE id=?').run(id);
  if (!result.changes) return NextResponse.json({ error: 'Tipe kamar tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
