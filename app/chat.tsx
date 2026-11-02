'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

const transport = new DefaultChatTransport({ api: '/api/chat' });

export default function Home() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, clearError } = useChat({ transport });
  const busy = status === 'submitted' || status === 'streaming';

  return (
    <main>
      <h1>Mój chatbot</h1>
      <section aria-label="Rozmowa" aria-live="polite" className="conversation" aria-busy={busy}>
        {messages.map(message => (
          <div className="message" key={message.id}>
            <strong>{message.role === 'user' ? 'Ty' : 'Chatbot'}</strong>
            <p>{message.parts.map(part => part.type === 'text' ? part.text : '').join('')}</p>
          </div>
        ))}
      </section>
      {busy && <p role="status">{status === 'submitted' ? 'Czekam na odpowiedź…' : 'Chatbot pisze…'}</p>}
      {error && <p role="alert" className="error">{error.message || 'Nie udało się połączyć. Spróbuj ponownie.'}</p>}
      <form onSubmit={event => {
        event.preventDefault();
        const text = input.trim();
        if (!text || busy) return;
        clearError();
        void sendMessage({ text });
        setInput('');
      }}>
        <label htmlFor="message">Wiadomość</label>
        <div className="controls">
          <input id="message" value={input} onChange={event => setInput(event.target.value)} disabled={busy} placeholder="Napisz wiadomość…" />
          <button type="submit" disabled={busy || !input.trim()}>Wyślij</button>
        </div>
      </form>
    </main>
  );
}
