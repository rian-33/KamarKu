import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export function GET() {
  const facilities = getDb().prepare('SELECT id,name,category,description,image FROM facilities ORDER BY category,name').all();
  return NextResponse.json({ facilities });
}
