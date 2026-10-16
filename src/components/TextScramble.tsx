import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/dither';

interface TextScrambleProps {
  text: string;
  className?: string;
  duration?: number;
  trigger?: 'mount' | 'inView';
  once?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

// Decodes `text` from random characters. Screen readers get the real text from
// a visually-hidden copy; the animated glyphs are aria-hidden.
export default function TextScramble({
  text,
  className = '',
  duration = 800,
  trigger = 'inView',
  once = true,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const hasPlayedRef = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayText(text);
      return;
    }

    let frame = 0;
    const scramble = () => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const revealedCount = Math.floor(progress * text.length);
        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < revealedCount || text[i] === ' ') result += text[i];
          else result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        setDisplayText(result);
        if (progress < 1) frame = requestAnimationFrame(tick);
        else setDisplayText(text);
      };
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };

    if (trigger === 'mount') {
      scramble();
      return () => cancelAnimationFrame(frame);
    }

    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasPlayedRef.current)) {
          hasPlayedRef.current = true;
          scramble();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, duration, trigger, once]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
}
