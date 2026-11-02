import { cookies } from 'next/headers';
import { authenticated, configured, cookieName, cookieOptions, createSession, equal, lifetime } from '../../lib/auth';

export const runtime = 'nodejs';
// Limit globalny dla tego procesu, a nie dla wielu instancji hostingu.
let attempts = 0;
let windowEnds = 0;
function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get('origin') ?? '');
    return origin.host === request.headers.get('host') && (origin.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && origin.protocol === 'http:'));
  } catch { return false; }
}
export async function GET() {
  return Response.json({ authenticated: await authenticated() }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response('Niedozwolone źródło żądania.', { status: 403 });
  if (!configured()) return new Response('Brak konfiguracji ochrony. Ustaw CHAT_PASSWORD i SESSION_SECRET (minimum 32 znaki).', { status: 503 });
  // W produkcji operator musi najpierw włączyć wspólny limit na firewallu hostingu.
  if (process.env.NODE_ENV === 'production' && process.env.CHAT_LOGIN_RATE_LIMIT_PROTECTED !== 'true') {
    return new Response('Logowanie zablokowane: skonfiguruj globalny limit prób na hostingu.', { status: 503 });
  }
  if (Date.now() >= windowEnds) { attempts = 0; windowEnds = Date.now() + 15 * 60 * 1000; }
  if (attempts >= 5) return new Response('Za dużo prób. Spróbuj ponownie za 15 minut.', { status: 429, headers: { 'Retry-After': String(Math.ceil((windowEnds - Date.now()) / 1000)) } });
  attempts++;
  let password;
  try { password = (await request.json()).password; } catch { return new Response('Nieprawidłowe żądanie.', { status: 400 }); }
  if (typeof password !== 'string' || password.length > 1024 || !equal(password, process.env.CHAT_PASSWORD!)) {
    return new Response('Nieprawidłowe hasło.', { status: 401 });
  }
  (await cookies()).set(cookieName, createSession(), { ...cookieOptions, maxAge: lifetime });
  return Response.json({ ok: true });
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response('Niedozwolone źródło żądania.', { status: 403 });
  (await cookies()).set(cookieName, '', { ...cookieOptions, maxAge: 0 });
  return Response.json({ ok: true });
}
