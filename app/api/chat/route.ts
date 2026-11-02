import { authenticated } from '../../lib/auth';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { convertToModelMessages, streamText, validateUIMessages } from 'ai';

export const runtime = 'nodejs';

const providerError = 'Nie udało się pobrać odpowiedzi. Sprawdź klucz, nazwę modelu i środki w OpenRouter, a następnie spróbuj ponownie.';

export async function POST(request: Request) {
  if (!(await authenticated())) return new Response('Sesja wygasła lub nie jesteś zalogowany. Odśwież stronę i wpisz hasło.', { status: 401 });
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();
  if (!apiKey || !model) {
    return new Response('Brak konfiguracji. Uzupełnij OPENROUTER_API_KEY i OPENROUTER_MODEL w .env.local, a następnie uruchom ponownie serwer.', { status: 503 });
  }

  let messages;
  try {
    const body = await request.json();
    messages = await validateUIMessages({ messages: body.messages });
    const last = messages.at(-1);
    if (!last || last.role !== 'user' || !last.parts.some(part => part.type === 'text' && part.text.trim())) {
      return new Response('Wpisz wiadomość przed wysłaniem.', { status: 400 });
    }
    if (messages.some(message => !['user', 'assistant'].includes(message.role) || message.parts.some(part => part.type !== 'text'))) {
      return new Response('Nieprawidłowy format rozmowy.', { status: 400 });
    }
  } catch {
    return new Response('Nieprawidłowy format rozmowy.', { status: 400 });
  }

  try {
    const openrouter = createOpenRouter({ apiKey });
    const result = streamText({
      model: openrouter(model),
      messages: await convertToModelMessages(messages),
      abortSignal: request.signal,
    });
    return result.toUIMessageStreamResponse({ onError: () => providerError });
  } catch {
    return new Response(providerError, { status: 502 });
  }
}
