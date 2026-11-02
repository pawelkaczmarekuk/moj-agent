# Mój chatbot — LABA

Next.js App Router, TypeScript, Vercel AI SDK 6 i OpenRouter. Czat strumieniowy z historią bieżącej rozmowy i wspólnym hasłem warsztatowym.

## Lokalnie

`npm ci`, następnie skopiuj puste pola z `.env.example` do własnego `.env.local`. Ustaw klucz i model OpenRouter, hasło warsztatowe oraz losowy sekret sesji (minimum 32 znaki). Nie publikuj `.env.local`. Uruchom `npm run dev` i otwórz http://127.0.0.1:3000.

`npm run build` sprawdza kompilację. Testy ochrony: po zatrzymaniu serwera `python3 tests/auth.py` i `python3 tests/auth.py --missing-config`. Nie wywołują modelu.

## Vercel

Zaimportuj własne repozytorium GitHub jako projekt Next.js. Zachowaj `package-lock.json`; ustaw instalację `npm ci` i build `npm run build`.

Zmienne serwerowe: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `CHAT_PASSWORD`, `SESSION_SECRET`. Żadna nie powinna mieć prefiksu `NEXT_PUBLIC_`.

Przed udostępnieniem skonfiguruj globalny limit POST `/api/session` na firewallu Vercel: 5 prób na 15 minut na IP, blokowanie nadmiarowych prób. Dopiero po sprawdzeniu reguły ustaw `CHAT_LOGIN_RATE_LIMIT_PROTECTED=true` i wykonaj ponowne wdrożenie. Bez tej flagi produkcyjne logowanie pozostaje zablokowane. Szczegóły w AUTH.md.

Po wdrożeniu sprawdź: ekran hasła w prywatnym oknie; błędne i poprawne hasło; wyjście; HTTP 401 z POST `/api/chat` bez cookie; cookie HttpOnly, SameSite=Strict i Secure; limit firewalla. Pierwszą wiadomość do modelu wysyła właściciel w przeglądarce.
