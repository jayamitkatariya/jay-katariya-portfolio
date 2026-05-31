import { useState, useRef, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const messagesForApi = [...messages, userMsg];
    setMessages(messagesForApi);
    setIsLoading(true);
    setStreamingText('');

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForApi.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        console.error(`[chat] ${res.status}:`, errorBody);
        throw new Error(errorBody || 'request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('no stream');

      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta'
            ) {
              full += parsed.delta.text;
              setStreamingText(full);
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: full || "sorry, couldn't generate a response." },
      ]);
      setStreamingText('');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'something went wrong. try again?' },
        ]);
      }
      setStreamingText('');
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isLoading, streamingText, sendMessage, abort };
}
