import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/dither';

interface TypewriterTextProps {
  texts: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export default function TypewriterText({
  texts,
  className = '',
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2500,
}: TypewriterTextProps) {
  const displayRef = useRef('');
  const isDeletingRef = useRef(false);
  const textIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use a ref for the DOM element to avoid re-renders on every character
  const spanRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // latest props via refs, so a re-render with an equal-but-new array doesn't restart typing
  const textsRef = useRef(texts);
  textsRef.current = texts;
  const textsKey = texts.join('\n');

  useEffect(() => {
    const render = () => {
      if (spanRef.current) spanRef.current.textContent = displayRef.current;
    };

    displayRef.current = '';
    isDeletingRef.current = false;
    textIndexRef.current = 0;

    if (prefersReducedMotion()) {
      displayRef.current = textsRef.current[0] ?? '';
      render();
      return;
    }

    const tick = () => {
      const list = textsRef.current;
      const currentFullText = list[textIndexRef.current % list.length] ?? '';
      const speed = isDeletingRef.current ? deletingSpeed : typingSpeed;

      if (!isDeletingRef.current) {
        const next = currentFullText.slice(0, displayRef.current.length + 1);
        displayRef.current = next;
        render();

        if (next === currentFullText) {
          // Finished typing, pause then delete
          timeoutRef.current = setTimeout(() => {
            isDeletingRef.current = true;
            tick();
          }, pauseDuration);
          return;
        }
      } else {
        const next = currentFullText.slice(0, displayRef.current.length - 1);
        displayRef.current = next;
        render();

        if (next === '') {
          isDeletingRef.current = false;
          textIndexRef.current = (textIndexRef.current + 1) % list.length;
        }
      }

      timeoutRef.current = setTimeout(tick, speed + Math.random() * 20);
    };

    timeoutRef.current = setTimeout(tick, typingSpeed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [textsKey, typingSpeed, deletingSpeed, pauseDuration]);

  // Blink cursor
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let visible = true;
    cursorIntervalRef.current = setInterval(() => {
      visible = !visible;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = visible ? '1' : '0';
      }
    }, 530);
    return () => {
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, []);

  return (
    <span className={className}>
      {/* screen readers get the lines whole, not a half-typed fragment */}
      <span className="sr-only">{texts.join('. ')}</span>
      <span ref={spanRef} aria-hidden="true" />
      <span
        ref={cursorRef}
        aria-hidden="true"
        className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle"
      />
    </span>
  );
}
