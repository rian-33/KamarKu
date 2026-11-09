import { NextRequest, NextResponse } from 'next/server';
import { availability } from '@/lib/db';
import { hotelToday } from '@/lib/date';

export const runtime = 'nodejs';

const validDate = (value: string | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

export function GET(request: NextRequest) {
  const checkIn = request.nextUrl.searchParams.get('checkIn');
  const checkOut = request.nextUrl.searchParams.get('checkOut');
  if (!validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn || checkIn < hotelToday()) {
    return NextResponse.json({ error: 'Tanggal check-in dan check-out tidak valid.' }, { status: 400 });
  }
  return NextResponse.json({ rooms: availability(checkIn, checkOut) });
}
