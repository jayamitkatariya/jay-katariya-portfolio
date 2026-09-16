import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';

const GREETINGS = ['namaste', 'hola', 'bonjour', 'ciao', 'olá', 'konnichiwa', 'salaam', 'ni hao'];
const CHARS = 'abcdefghijklmnopqrstuvwxyz';
const WORD_MS = 280;
const SETTLE_MS = 120;
const TOTAL_MS = GREETINGS.length * WORD_MS + SETTLE_MS;

function scramble(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [display, setDisplay] = useState(() => scramble(GREETINGS[0].length));
  const [wordIndex, setWordIndex] = useState(0);
  const stableOnComplete = useCallback(onComplete, []);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    stableOnComplete();
  }, [stableOnComplete]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(GREETINGS[0]);
      const timer = setTimeout(finish, 800);
      return () => clearTimeout(timer);
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const idx = Math.min(Math.floor(elapsed / WORD_MS), GREETINGS.length - 1);
      const word = GREETINGS[idx];
      const progress = (elapsed - idx * WORD_MS) / WORD_MS;
      const revealed = Math.floor(Math.min(progress / 0.75, 1) * word.length);

      let out = '';
      for (let i = 0; i < word.length; i++) {
        if (word[i] === ' ') {
          out += ' ';
        } else if (i < revealed) {
          out += word[i];
        } else {
          out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      if (elapsed >= TOTAL_MS) {
        setDisplay(word);
        finish();
        return;
      }

      setDisplay(out);
      setWordIndex(idx);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finish]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[200] bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-7"
      role="status"
      aria-label="loading"
    >
      <span className="font-mono text-base sm:text-lg tracking-[0.35em] pl-[0.35em] text-[var(--text-secondary)] select-none">
        {display}
      </span>

      <div className="flex items-center gap-1.5" aria-hidden="true">
        {GREETINGS.map((_, i) => (
          <span
            key={i}
            className={`h-[3px] rounded-full transition-all duration-200 ease-out ${
              i === wordIndex
                ? 'w-4 bg-[var(--text-tertiary)]'
                : 'w-[3px] bg-[var(--border-primary)]'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
