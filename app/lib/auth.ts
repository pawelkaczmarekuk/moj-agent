import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const cookieName = 'laba_session';
export const lifetime = 60 * 60 * 4;
export const cookieOptions = { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
export function configured() {
  return Boolean(process.env.CHAT_PASSWORD?.trim() && (process.env.SESSION_SECRET?.length ?? 0) >= 32);
}
function sign(value: string) {
  return createHmac('sha256', process.env.SESSION_SECRET!).update(value).digest('base64url');
}
export function equal(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export function createSession() {
  const payload = `${Math.floor(Date.now() / 1000) + lifetime}.${randomBytes(24).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}
export async function authenticated() {
  if (!configured()) return false;
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  const remaining = Number(expires) - Math.floor(Date.now() / 1000);
  return Number.isInteger(Number(expires)) && remaining > 0 && remaining <= lifetime && /^[\w-]{32}$/.test(nonce) && equal(signature, sign(`${expires}.${nonce}`));
}
