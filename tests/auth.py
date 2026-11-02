"""Izolowany test HTTP. Nadpisuje konfigurację testową; nie wywołuje modelu."""
import http.cookiejar
import json
import os
import secrets
import signal
import sys
import subprocess
import time
import urllib.request
import urllib.error

origin = 'http://127.0.0.1:3001'
password = secrets.token_hex(16)
env = dict(os.environ, CHAT_PASSWORD=password, SESSION_SECRET=secrets.token_hex(32), OPENROUTER_API_KEY='', OPENROUTER_MODEL='', CHAT_LOGIN_RATE_LIMIT_PROTECTED='')
if '--missing-config' in sys.argv: env['CHAT_PASSWORD'] = ''
process = subprocess.Popen(['npm', 'run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3001'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def request(path, method='GET', body=None, cookie=None):
    headers = {'Origin': origin, 'Content-Type': 'application/json'}
    if cookie: headers['Cookie'] = cookie
    req = urllib.request.Request(origin + path, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
    try: response = client.open(req)
    except urllib.error.HTTPError as error: response = error
    return response.status, response.read().decode(), response.headers
try:
    for _ in range(120):
        try:
            request('/api/session')
            break
        except urllib.error.URLError: time.sleep(.5)
    else: raise RuntimeError('Serwer testowy nie wystartował')
    if '--missing-config' in sys.argv:
        assert request('/api/session', 'POST', {'password': password})[0] == 503
        assert request('/api/chat', 'POST', {'messages': []})[0] == 401
        print('OK: brak konfiguracji ochrony blokuje logowanie i /api/chat.')
        sys.exit(0)
    assert request('/api/chat', 'POST', {'messages': []})[0] == 401
    assert request('/api/session', 'POST', {'password': 'wrong'})[0] == 401
    assert len(jar) == 0
    status, _, headers = request('/api/session', 'POST', {'password': password})
    assert status == 200
    cookie = headers['Set-Cookie']
    assert 'HttpOnly' in cookie and 'SameSite=strict' in cookie and 'Max-Age=14400' in cookie
    assert password not in cookie
    assert json.loads(request('/api/session')[1])['authenticated']
    # Brak konfiguracji OpenRouter: nawet z sesją nie ma wywołania modelu.
    assert request('/api/chat', 'POST', {'messages': []})[0] == 503
    assert request('/api/session', 'DELETE')[0] == 200
    assert not json.loads(request('/api/session')[1])['authenticated']
    assert request('/api/chat', 'POST', {'messages': []})[0] == 401
    assert request('/api/chat', 'POST', {'messages': []}, 'laba_session=forged')[0] == 401
    for _ in range(3): assert request('/api/session', 'POST', {'password': 'wrong'})[0] == 401
    assert request('/api/session', 'POST', {'password': password})[0] == 429
    print('OK: błędne i poprawne hasło, cookie, sesja, wyjście, 401 bez sesji i z fałszywym cookie, brak konfiguracji AI, limit prób. Bez wywołań modelu.')
finally:
    os.killpg(process.pid, signal.SIGTERM)
    process.wait()
