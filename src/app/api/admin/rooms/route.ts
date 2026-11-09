import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getDb, listRooms } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
const roomSchema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).default('Kamar nyaman untuk perjalanan Anda.'), price: z.number().int().min(0), capacity: z.number().int().min(1).max(12), stock: z.number().int().min(0).max(500), image: z.url().default('https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85'), amenities: z.array(z.string().trim().min(1).max(50)).max(20).default([]) });

export function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  return NextResponse.json({ rooms: listRooms().map((room) => ({ ...room, amenities: room.amenities.split(',') })) });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const parsed = roomSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data kamar tidak valid.' }, { status: 400 });
  const room = parsed.data;
  const id = randomUUID();
  getDb().prepare('INSERT INTO rooms (id,name,description,price,capacity,stock,image,amenities) VALUES (?,?,?,?,?,?,?,?)').run(id, room.name, room.description, room.price, room.capacity, room.stock, room.image, room.amenities.join(','));
  return NextResponse.json({ room: { ...room, id } }, { status: 201 });
}
