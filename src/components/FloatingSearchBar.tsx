import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check } from 'lucide-react';
import { parseMessage, stripTrailingIncomplete } from '../lib/parseMessage';
import { stripTrailingMarkdown } from '../lib/parseMarkdown';
import { loadMemory, saveMemory, incrementVisit, extractTopics, detectName, addTopics, setVisitorName, buildMemoryContext } from '../lib/chatMemory';
import type { ChatMemory } from '../lib/chatMemory';
import type { Project } from '../data/projects';
import MessageRenderer from './chat/MessageRenderer';
import WelcomeCards from './chat/WelcomeCards';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FloatingSearchBarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onFirstMessage?: () => void;
  onAction?: (action: string) => void;
  projects: Project[];
}

export default function FloatingSearchBar({ isOpen, setIsOpen, onFirstMessage, onAction, projects }: FloatingSearchBarProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [suggestionChips, setSuggestionChips] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const memoryRef = useRef<ChatMemory | null>(null);
  const lastFailedRef = useRef<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load memory on mount
  useEffect(() => {
    const mem = loadMemory();
    const updated = incrementVisit(mem);
    memoryRef.current = updated;
    saveMemory(updated);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setTimeout(() => inputRef.current?.focus(), 400);
      } else {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Lock body scroll when open (position: fixed technique for iOS)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (top) window.scrollTo(0, parseInt(top, 10) * -1);
    }
    return () => {
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (top) window.scrollTo(0, parseInt(top, 10) * -1);
    };
  }, [isOpen]);

  const handleClose = () => {
    abortRef.current?.abort();
    setIsOpen(false);
  };

  const handleAction = useCallback((action: string) => {
    onAction?.(action);
  }, [onAction]);

  const handleNavigate = useCallback((path: string) => {
    onAction?.(`navigate:${path}`);
  }, [onAction]);

  const handleFocusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const exportChat = useCallback(() => {
    const transcript = messages
      .map(m => `${m.role === 'user' ? 'You' : "Jay's AI"}: ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [messages]);

  // Keyboard shortcut: Cmd+K / Ctrl+K to toggle, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setErrorMessage(null);
    lastFailedRef.current = null;

    // Process memory for this message
    if (memoryRef.current) {
      const name = detectName(trimmed);
      if (name) {
        memoryRef.current = setVisitorName(memoryRef.current, name);
      }
      const topics = extractTopics(trimmed);
      if (topics.length > 0) {
        memoryRef.current = addTopics(memoryRef.current, topics);
      }
      saveMemory(memoryRef.current);
    }

    const userMsg: Message = { role: 'user', content: trimmed };
    const messagesForApi = [...messages, userMsg];
    setMessages(messagesForApi);
    setInput('');
    setIsLoading(true);
    setStreamingText('');
    setSuggestionChips([]);

    if (messages.length === 0 && onFirstMessage) onFirstMessage();

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const memoryContext = memoryRef.current ? buildMemoryContext(memoryRef.current) : '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForApi.map(m => ({ role: m.role, content: m.content })),
          memoryContext: memoryContext || undefined,
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

      // Extract chips from completed response
      const segments = parseMessage(full);
      const chipsSegment = segments.find(s => s.type === 'chips');
      if (chipsSegment && chipsSegment.type === 'chips') {
        setSuggestionChips(chipsSegment.chips);
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: full || "sorry, couldn't generate a response." },
      ]);
      setStreamingText('');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        lastFailedRef.current = trimmed;
        setErrorMessage('something went wrong');
      }
      // Remove the failed user message to keep alternating user/assistant turns,
      // otherwise the next request sends consecutive user messages → Anthropic 400
      setMessages(prev => prev.slice(0, -1));
      setStreamingText('');
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const hasMessages = messages.length > 0 || !!streamingText;

  return (
    <>
      {/* Backdrop - only when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* FAB button - hidden when open */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-4 sm:bottom-8 sm:right-6 md:right-12 z-50 group"
          aria-label="Open chat"
        >
          {/* Glow layers */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#f093fb] blur-md opacity-70 group-hover:opacity-100 group-hover:blur-lg rounded-full transition-all duration-700 animate-gradient-xy" />
          <div
            className="absolute -inset-[2px] bg-gradient-to-l from-[#f5576c] via-[#f093fb] to-[#4facfe] blur-md opacity-50 group-hover:opacity-80 group-hover:blur-lg rounded-full transition-all duration-700 animate-gradient-xy"
            style={{ animationDirection: 'reverse', animationDuration: '4s' }}
          />
          <div className="relative flex items-center justify-center bg-black/90 backdrop-blur-md rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-2xl border border-white/10 group-hover:bg-black group-hover:scale-105 transition-all duration-300">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <span className="hidden sm:block absolute -top-7 right-0 font-mono text-[10px] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ⌘K
          </span>
        </button>
      )}

      {/* Chat panel - mobile: bottom sheet, desktop: floating panel */}
      {isOpen && (
        <div className="fixed z-50 inset-x-0 bottom-0 sm:inset-auto sm:bottom-8 sm:right-6 md:right-12">
          {/* Glow - desktop only (mobile is full-width, glow not needed) */}
          <div className="hidden sm:block absolute -inset-[3px] bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#f093fb] blur-lg opacity-100 rounded-2xl animate-gradient-xy" />
          <div
            className="hidden sm:block absolute -inset-[3px] bg-gradient-to-l from-[#f5576c] via-[#f093fb] to-[#4facfe] blur-xl opacity-80 rounded-2xl animate-gradient-xy"
            style={{ animationDirection: 'reverse', animationDuration: '4s' }}
          />

          <div
            className="relative flex flex-col bg-[var(--card-bg)] backdrop-blur-xl shadow-2xl border border-[var(--border-secondary)] overflow-hidden
                       rounded-t-2xl sm:rounded-2xl
                       w-full sm:w-[26rem] lg:w-[28rem]
                       max-h-[85dvh] sm:max-h-[calc(100dvh-6rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--border-secondary)] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#4facfe] to-[#f093fb] animate-pulse" />
                <span className="font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">
                  ask jay's ai
                </span>
              </div>
              <div className="flex items-center gap-1">
                {hasMessages && (
                  <button
                    onClick={exportChat}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--bg-secondary)]"
                    aria-label="Copy chat"
                    title="copy chat"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
              <button
                onClick={handleClose}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-2 -mr-1 rounded-full hover:bg-[var(--bg-secondary)]"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              </div>
            </div>

            {/* Messages area */}
            <div
              className={`overflow-y-auto px-4 sm:px-5 flex-1 ${
                hasMessages ? 'py-4 min-h-[4rem]' : 'py-4'
              }`}
            >
              {/* Welcome cards */}
              {!hasMessages && (
                <WelcomeCards
                  isReturning={!!(memoryRef.current && memoryRef.current.visitCount > 1)}
                  visitorName={memoryRef.current?.visitorName ?? null}
                  onSendMessage={sendMessage}
                  onFocusInput={handleFocusInput}
                />
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <MessageRenderer
                        segments={parseMessage(msg.content)}
                        projects={projects}
                        onAction={handleAction}
                        onNavigate={handleNavigate}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming text */}
              {streamingText && (
                <div className="flex mb-3 justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                    <MessageRenderer
                      segments={parseMessage(stripTrailingIncomplete(stripTrailingMarkdown(streamingText)))}
                      projects={projects}
                      onNavigate={handleNavigate}
                    />
                    <span className="inline-block w-1 h-3.5 bg-[var(--text-tertiary)] ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                  </div>
                </div>
              )}

              {/* Thinking indicator */}
              {isLoading && !streamingText && (
                <div className="flex mb-3 justify-start">
                  <div className="rounded-2xl px-4 py-2.5 bg-[var(--bg-tertiary)]">
                    <span className="font-mono text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4facfe] to-[#f093fb] animate-pulse" />
                      thinking...
                    </span>
                  </div>
                </div>
              )}

              {/* Error with retry */}
              {errorMessage && !isLoading && (
                <div className="flex mb-3 justify-start">
                  <div className="rounded-2xl px-4 py-2.5 bg-[var(--bg-tertiary)] flex items-center gap-2">
                    <span className="text-[var(--text-tertiary)] font-mono text-xs">{errorMessage}</span>
                    <button
                      onClick={() => {
                        setErrorMessage(null);
                        if (lastFailedRef.current) sendMessage(lastFailedRef.current);
                      }}
                      className="font-mono text-xs text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--text-primary)] transition-colors"
                    >
                      retry
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic suggestion chips */}
              <AnimatePresence>
                {suggestionChips.length > 0 && !isLoading && !streamingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-wrap gap-2 mb-3 mt-1 px-0.5"
                  >
                    {suggestionChips.map((chip, i) => (
                      <motion.button
                        key={`chip-${i}`}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        onClick={() => {
                          setSuggestionChips([]);
                          sendMessage(chip);
                        }}
                        className="font-mono text-[11px] text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-full px-3 py-1.5 hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] active:scale-[0.95] transition-all duration-200"
                      >
                        {chip}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center px-4 sm:px-5 py-3 border-t border-[var(--border-secondary)] gap-2 shrink-0 pb-[env(safe-area-inset-bottom,12px)]"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ask me anything..."
                className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] font-mono text-sm min-w-0"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 p-2.5 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:bg-[var(--bg-tertiary)]"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
