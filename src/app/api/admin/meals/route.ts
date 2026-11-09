import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getDb } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
const menuSchema = z.object({ scheduleId: z.number().int().min(1).max(3), date: z.iso.date(), dishName: z.string().trim().min(2).max(120), category: z.enum(['main', 'side', 'dessert', 'drink']) });
const scheduleSchema = z.object({ mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']), startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).refine((value) => value.endTime > value.startTime);

export function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const db = getDb();
  return NextResponse.json({ schedules: db.prepare('SELECT id,meal_type AS mealType,start_time AS startTime,end_time AS endTime FROM meal_schedules ORDER BY id').all(), menus: db.prepare('SELECT id,schedule_id AS scheduleId,menu_date AS date,dish_name AS dishName,category FROM meal_menus WHERE menu_date=? ORDER BY schedule_id,category').all(date) });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const parsed = menuSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data menu tidak valid.' }, { status: 400 });
  const menu = parsed.data;
  try {
    getDb().prepare('INSERT INTO meal_menus (id,schedule_id,menu_date,dish_name,category) VALUES (?,?,?,?,?)').run(randomUUID(), menu.scheduleId, menu.date, menu.dishName, menu.category);
  } catch {
    return NextResponse.json({ error: 'Menu ini sudah tercatat untuk jadwal dan tanggal tersebut.' }, { status: 409 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const parsed = scheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Jadwal makan tidak valid.' }, { status: 400 });
  const schedule = parsed.data;
  getDb().prepare('UPDATE meal_schedules SET start_time=?,end_time=? WHERE meal_type=?').run(schedule.startTime, schedule.endTime, schedule.mealType);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID menu diperlukan.' }, { status: 400 });
  const result = getDb().prepare('DELETE FROM meal_menus WHERE id=?').run(id);
  if (!result.changes) return NextResponse.json({ error: 'Menu tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
