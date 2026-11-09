import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
const schema = z.object({ name: z.string().trim().min(2).max(100), category: z.string().trim().min(2).max(60), description: z.string().trim().min(5).max(500), image: z.url() });

export function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  return NextResponse.json({ facilities: getDb().prepare('SELECT id,name,category,description,image FROM facilities ORDER BY name').all() });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data fasilitas tidak valid.' }, { status: 400 });
  const facility = { ...parsed.data, id: randomUUID() };
  getDb().prepare('INSERT INTO facilities (id,name,category,description,image) VALUES (?,?,?,?,?)').run(facility.id, facility.name, facility.category, facility.description, facility.image);
  return NextResponse.json({ facility }, { status: 201 });
}
