import type { UIMessage } from 'ai';

// Odpowiedzi strumieniowe SDK zawierają także granice kroków i reasoning.
// Wiadomości użytkownika nadal dopuszczają wyłącznie tekst.
export function isSupportedChatMessage(message: UIMessage): boolean {
  if (message.role === 'user') {
    return message.parts.every(part => part.type === 'text');
  }
  if (message.role === 'assistant') {
    return message.parts.every(part =>
      part.type === 'text' || part.type === 'step-start' || part.type === 'reasoning'
    );
  }
  return false;
}
