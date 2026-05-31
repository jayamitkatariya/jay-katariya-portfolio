import { useEffect, useRef, useState } from 'react';

interface TextScrambleProps {
  text: string;
  className?: string;
  duration?: number;
  trigger?: 'mount' | 'inView';
  once?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

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
  const frameRef = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const scramble = useRef(() => {
    const startTime = performance.now();
    const length = text.length;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const revealedCount = Math.floor(progress * length);

      let result = '';
      for (let i = 0; i < length; i++) {
        if (i < revealedCount) {
          result += text[i];
        } else if (text[i] === ' ') {
          result += ' ';
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      setDisplayText(result);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayText(text);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }).current;

  useEffect(() => {
    if (trigger === 'mount') {
      scramble();
      return () => cancelAnimationFrame(frameRef.current);
    }

    const el = ref.current;
    if (!el) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!once || !hasPlayedRef.current) {
            scramble();
            hasPlayedRef.current = true;
          }
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(el);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [text, duration, trigger, once, scramble]);

  return (
    <span ref={ref} className={className}>
      {displayText}
    </span>
  );
}
