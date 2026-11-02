# Hasło warsztatowe

W `.env.local` ustaw `CHAT_PASSWORD=własne_hasło`. Wygenerowany lokalnie `SESSION_SECRET` jest już dopisany do tego pliku; nie publikuj go i nie zmieniaj na tekst ze wzoru. Jeśli zmienna była wcześniej obecna, obowiązuje ostatni wpis. Zmiana sekretu unieważnia poprzednie sesje. Zrestartuj serwer po zmianie konfiguracji.

Sesja trwa 4 godziny. Cookie zawiera termin ważności, losowy identyfikator i podpis HMAC SHA-256, bez hasła. Wyjście usuwa cookie z przeglądarki. Skopiowana wcześniej sesja pozostaje ważna do wygaśnięcia (brak centralnego rejestru sesji).

Lokalny limit to 5 prób (także poprawnych) na 15 minut dla całego procesu. Restart zeruje licznik. To zabezpieczenie warsztatowe, nie wspólny limit dla hostingu.

Przed produkcją skonfiguruj na firewallu hostingu wspólny limit dla POST /api/session: maksymalnie 5 prób na 10 minut dla adresu IP (obejmujący wszystkie instancje, bez możliwości ominięcia firewalla). Dopiero po jego sprawdzeniu ustaw na hostingu CHAT_LOGIN_RATE_LIMIT_PROTECTED=true. Bez tego logowanie w produkcji zwraca 503. Sama flaga nie włącza żadnej usługi limitowania. Ustaw też CHAT_PASSWORD i losowy SESSION_SECRET (minimum 32 znaki), a stronę udostępniaj przez HTTPS. Cookie ma wtedy Secure, a zawsze HttpOnly i SameSite=Strict.

Testy HTTP: zatrzymaj lokalny serwer i uruchom `python3 tests/auth.py`. Używają losowego hasła i sekretu testowego oraz pustej konfiguracji OpenRouter. Nie wykonują zapytań do modelu.

Ręcznie sprawdź w przeglądarce: błędne hasło, poprawne hasło, wyjście i ponowne wyświetlenie ekranu hasła; potem czat z własną konfiguracją. Na hostingu sprawdź też limit firewalla i flagę Secure cookie.

## Aktualne wdrożenie

Adres: https://moj-agent-mocha.vercel.app. Reguła Vercel WAF obejmuje wyłącznie POST /api/session i zwraca 429 po przekroczeniu 5 żądań w stałym oknie 600 sekund na IP. Liczniki WAF są współdzielone przez instancje w regionie; nie jest to jeden licznik dla całego świata. Granice stałych okien mogą pozwolić na krótką serię większą niż limit. Lokalny licznik procesu (5 prób / 15 minut) jest tylko dodatkowym zabezpieczeniem. Test szóstej próby potwierdził HTTP 429.
