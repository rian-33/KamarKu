import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hotelToday } from '@/lib/date';

export const runtime = 'nodejs';
const mealLabels: Record<string, string> = { BREAKFAST: 'Sarapan', LUNCH: 'Makan siang', DINNER: 'Makan malam' };
const mealIcons: Record<string, string> = { BREAKFAST: '☀', LUNCH: '◉', DINNER: '☾' };

export function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') ?? hotelToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) return NextResponse.json({ error: 'Tanggal menu tidak valid.' }, { status: 400 });
  const schedules = getDb().prepare(`SELECT s.id,s.meal_type AS type,s.start_time AS startTime,s.end_time AS endTime,m.id AS menuId,m.dish_name AS dishName,m.category FROM meal_schedules s LEFT JOIN meal_menus m ON m.schedule_id=s.id AND m.menu_date=? ORDER BY s.id,m.category,m.dish_name`).all(date) as { id:number;type:string;startTime:string;endTime:string;menuId:string|null;dishName:string|null;category:string|null }[];
  const meals = ['BREAKFAST','LUNCH','DINNER'].map((type) => {
    const matching = schedules.filter((item) => item.type === type);
    const schedule = matching[0];
    return { id: schedule?.id, type, label: mealLabels[type], icon: mealIcons[type], time: schedule ? `${schedule.startTime} – ${schedule.endTime}` : '', menus: matching.filter((item) => item.menuId).map((item) => ({ id: item.menuId, name: item.dishName, category: item.category })) };
  });
  return NextResponse.json({ date, meals });
}
