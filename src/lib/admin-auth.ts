import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

const cookieName = 'kamarku_admin';
const maxAge = 60 * 60 * 8;

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function createAdminToken() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters.');
  const value = `${Date.now() + maxAge * 1000}`;
  return `${value}.${signature(value, secret)}`;
}

export function isAdminToken(token: string | undefined) {
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret || secret.length < 32) return false;
  const [expires, supplied] = token.split('.');
  if (!expires || !supplied || Number(expires) < Date.now()) return false;
  const expected = signature(expires, secret);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdminRequest(request: NextRequest) {
  return isAdminToken(request.cookies.get(cookieName)?.value);
}

export const adminCookie = { name: cookieName, maxAge };
