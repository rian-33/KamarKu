import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
const schema = z.object({ name: z.string().trim().min(2).max(100), category: z.string().trim().min(2).max(60), description: z.string().trim().min(5).max(500), image: z.url() });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data fasilitas tidak valid.' }, { status: 400 });
  const result = getDb().prepare('UPDATE facilities SET name=?,category=?,description=?,image=? WHERE id=?').run(parsed.data.name, parsed.data.category, parsed.data.description, parsed.data.image, id);
  if (!result.changes) return NextResponse.json({ error: 'Fasilitas tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const { id } = await context.params;
  const result = getDb().prepare('DELETE FROM facilities WHERE id=?').run(id);
  if (!result.changes) return NextResponse.json({ error: 'Fasilitas tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
