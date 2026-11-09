import { compare } from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { adminCookie, createAdminToken } from '@/lib/admin-auth';
import { z } from 'zod';

export const runtime = 'nodejs';
const schema = z.object({ email: z.email(), password: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Email atau kata sandi tidak valid.' }, { status: 400 });
  const email = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !hash || parsed.data.email.toLowerCase() !== email.toLowerCase() || !(await compare(parsed.data.password, hash))) {
    return NextResponse.json({ error: 'Email atau kata sandi salah.' }, { status: 401 });
  }
  try {
    const response = NextResponse.json({ ok: true });
    const secure = process.env.NODE_ENV === 'production' && (request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https');
    response.cookies.set(adminCookie.name, createAdminToken(), { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: adminCookie.maxAge });
    return response;
  } catch {
    return NextResponse.json({ error: 'Konfigurasi autentikasi belum lengkap.' }, { status: 503 });
  }
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(adminCookie.name);
  return response;
}
