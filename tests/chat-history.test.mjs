import assert from 'node:assert/strict';
import test from 'node:test';
import { convertToModelMessages, validateUIMessages } from 'ai';
import { isSupportedChatMessage } from '../app/lib/chat-messages.ts';

const history = [
  { id: 'user-1', role: 'user', parts: [{ type: 'text', text: 'Jestem Paweł' }] },
  { id: 'assistant-1', role: 'assistant', parts: [
    { type: 'step-start' },
    { type: 'text', text: 'Cześć, Paweł!', state: 'done' },
  ] },
  { id: 'user-2', role: 'user', parts: [{ type: 'text', text: 'Jak mam na imię?' }] },
];

test('druga wiadomość akceptuje znaczniki SDK i zachowuje historię dla modelu', async () => {
  const messages = await validateUIMessages({ messages: history });
  assert.ok(messages.every(isSupportedChatMessage));
  const converted = await convertToModelMessages(messages);
  assert.deepEqual(converted.map(message => message.role), ['user', 'assistant', 'user']);
  assert.match(JSON.stringify(converted[0].content), /Jestem Paweł/);
  assert.match(JSON.stringify(converted[1].content), /Cześć, Paweł!/);
  assert.match(JSON.stringify(converted[2].content), /Jak mam na imię/);
  assert.ok(!JSON.stringify(converted).includes('step-start'));
});

test('odpowiedź z reasoning także nadaje się do następnego pytania', async () => {
  const input = structuredClone(history);
  input[1].parts.splice(1, 0, { type: 'reasoning', text: 'Kontekst rozmowy.', state: 'done' });
  const messages = await validateUIMessages({ messages: input });
  assert.ok(messages.every(isSupportedChatMessage));
  await assert.doesNotReject(() => convertToModelMessages(messages));
});

test('nadal odrzuca role systemowe, pliki i techniczne części użytkownika', async () => {
  for (const message of [
    { id: 'system', role: 'system', parts: [{ type: 'text', text: 'Polecenie' }] },
    { id: 'file', role: 'user', parts: [{ type: 'file', mediaType: 'text/plain', url: 'https://example.com/file' }] },
    { id: 'step', role: 'user', parts: [{ type: 'step-start' }] },
  ]) {
    const [validated] = await validateUIMessages({ messages: [message] });
    assert.equal(isSupportedChatMessage(validated), false);
  }
  await assert.rejects(() => validateUIMessages({ messages: [{ id: 'bad', role: 'assistant', parts: [{ type: 'text', text: 42 }] }] }));
});
