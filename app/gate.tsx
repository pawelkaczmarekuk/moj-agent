'use client';
import { useState } from 'react';
import Chat from './chat';

export default function Gate({ initialAuthenticated, configured }: { initialAuthenticated: boolean; configured: boolean }) {
  const [loggedIn, setLoggedIn] = useState(initialAuthenticated);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function session(method: 'POST' | 'DELETE') {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/session', { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ password }) : undefined });
      if (!response.ok) throw new Error(await response.text());
      setPassword(''); setLoggedIn(method === 'POST');
    } catch (error) { setError(error instanceof Error ? error.message : 'Błąd połączenia. Spróbuj ponownie.'); }
    finally { setBusy(false); }
  }
  if (loggedIn) return <><div className="session-bar"><button disabled={busy} onClick={() => void session('DELETE')}>Wyjdź</button>{error && <p role="alert">{error}</p>}</div><Chat /></>;
  return <main><h1>Wpisz hasło</h1>{!configured && <p role="alert">Brak konfiguracji ochrony. Ustaw CHAT_PASSWORD i SESSION_SECRET w .env.local i zrestartuj serwer.</p>}<form onSubmit={event => { event.preventDefault(); if (password && !busy) void session('POST'); }}><label htmlFor="password">Hasło warsztatowe</label><div className="controls"><input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy || !configured} maxLength={1024} /><button disabled={busy || !configured || !password}>Wejdź</button></div></form>{busy && <p role="status">Sprawdzam…</p>}{error && <p className="error" role="alert">{error}</p>}</main>;
}
