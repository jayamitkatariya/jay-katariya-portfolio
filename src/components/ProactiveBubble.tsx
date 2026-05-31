import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const CONTEXTUAL_MESSAGES: Record<string, string[]> = {
  'home:work': [
    'curious about any of these roles? ask me',
  ],
  'home:about': [
    'want to know more about jay?',
  ],
  'home:contact': [
    'not sure how to reach out? i can help',
  ],
  'portfolio': [
    'want details on any project? just ask',
  ],
  'memories': [
    'ask me about jay\'s travels',
  ],
};

interface ProactiveBubbleProps {
  currentPage: string;
  scrollSection: string | null;
  isChatOpen: boolean;
  hasInteracted: boolean;
  onOpenChat: () => void;
}

export default function ProactiveBubble({
  currentPage,
  scrollSection,
  isChatOpen,
  hasInteracted,
  onOpenChat,
}: ProactiveBubbleProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const showCountRef = useRef(0);
  const dismissedSectionsRef = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contextKey = currentPage === 'home' && scrollSection
    ? `home:${scrollSection}`
    : currentPage !== 'home'
      ? currentPage
      : null;

  const dismiss = useCallback(() => {
    setVisible(false);
    setMessage(null);
    if (contextKey) {
      dismissedSectionsRef.current.add(contextKey);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, [contextKey]);

  const handleClick = useCallback(() => {
    dismiss();
    onOpenChat();
  }, [dismiss, onOpenChat]);

  useEffect(() => {
    // Clear any pending timers when context changes
    if (timerRef.current) clearTimeout(timerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setVisible(false);
    setMessage(null);

    // Don't show if:
    if (isChatOpen) return;
    if (hasInteracted) return;
    if (showCountRef.current >= 2) return;
    if (!contextKey) return;
    if (dismissedSectionsRef.current.has(contextKey)) return;

    const messages = CONTEXTUAL_MESSAGES[contextKey];
    if (!messages || messages.length === 0) return;

    // Show after delay
    timerRef.current = setTimeout(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setMessage(msg);
      setVisible(true);
      showCountRef.current += 1;

      // Auto-dismiss after 8 seconds
      dismissTimerRef.current = setTimeout(() => {
        dismiss();
      }, 8000);
    }, 6000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [contextKey, isChatOpen, hasInteracted, dismiss]);

  // Hide immediately if chat opens
  useEffect(() => {
    if (isChatOpen && visible) {
      setVisible(false);
      setMessage(null);
    }
  }, [isChatOpen, visible]);

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 md:right-12 z-[45] hidden sm:block"
        >
          {/* Subtle glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#4facfe]/20 via-[#00f2fe]/20 to-[#f093fb]/20 blur-md rounded-xl" />

          <div className="relative flex items-center gap-2.5 bg-[var(--card-bg)] backdrop-blur-xl rounded-xl px-4 py-2.5 shadow-lg border border-[var(--border-secondary)] max-w-[240px]">
            {/* Pulsing dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#4facfe] to-[#f093fb] animate-pulse shrink-0" />

            {/* Message */}
            <button
              onClick={handleClick}
              className="font-mono text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-left leading-relaxed"
            >
              {message}
            </button>

            {/* Dismiss */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0 p-0.5 rounded-full hover:bg-[var(--bg-secondary)]"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
