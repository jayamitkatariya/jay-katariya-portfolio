import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';

/** Strip custom markup tags for terminal display */
function stripChatTags(text: string): string {
  return text
    .replace(/\[chips:[^\]]*\]/g, '')
    .replace(/\[action:[^\]]*\]/g, '')
    .replace(/\[project:([^\]]+)\]/g, '$1')
    .replace(/\[link:([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[button:([^\]]+)\]\([^)]+\)/g, '[$1]')
    .trim();
}

const WELCOME_LINES = [
  'last login: ' + new Date().toLocaleDateString('en-us', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toLowerCase(),
  '',
  "welcome to jay's portfolio terminal.",
  "type anything to chat with jay's ai, or try:",
  "  • what does jay do?",
  "  • tell me about jay's projects",
  "  • how can i contact jay?",
  '',
];

export default function TerminalApp() {
  const { messages, isLoading, streamingText, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, streamingText]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="h-full flex flex-col bg-[#1a1a2e] text-[#e0e0e0] font-mono text-[13px] leading-relaxed cursor-text"
      onClick={handleContainerClick}
    >
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 pb-0">
        {/* Welcome message */}
        {WELCOME_LINES.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap text-[#8888aa]">
            {line || '\u00A0'}
          </div>
        ))}

        {/* Message history */}
        {messages.map((msg, i) => (
          <div key={i} className="mt-1">
            {msg.role === 'user' ? (
              <div>
                <span className="text-[#6ee7b7]">jay@portfolio</span>
                <span className="text-[#8888aa]"> ~ % </span>
                <span className="text-[#e0e0e0]">{msg.content}</span>
              </div>
            ) : (
              <div className="text-[#a5b4fc] whitespace-pre-wrap pl-0 mb-1">
                {stripChatTags(msg.content)}
              </div>
            )}
          </div>
        ))}

        {/* Streaming response */}
        {streamingText && (
          <div className="text-[#a5b4fc] whitespace-pre-wrap mt-1">
            {stripChatTags(streamingText)}
            <span className="inline-block w-2 h-3.5 bg-[#a5b4fc] ml-0.5 animate-pulse align-text-bottom" />
          </div>
        )}

        {/* Loading dots */}
        {isLoading && !streamingText && (
          <div className="flex gap-1 mt-2 items-center">
            <span className="w-1.5 h-1.5 bg-[#6ee7b7] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-[#6ee7b7] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-[#6ee7b7] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* Input line */}
      <form onSubmit={handleSubmit} className="flex items-center px-4 py-3 shrink-0">
        <span className="text-[#6ee7b7] shrink-0">jay@portfolio</span>
        <span className="text-[#8888aa] shrink-0"> ~ % </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none text-[#e0e0e0] caret-[#6ee7b7] min-w-0"
          spellCheck={false}
          autoComplete="off"
        />
        {!isLoading && (
          <span className="inline-block w-2 h-4 bg-[#6ee7b7] animate-pulse" />
        )}
      </form>
    </div>
  );
}
