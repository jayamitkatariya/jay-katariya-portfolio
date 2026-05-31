import { useEffect, useRef, useCallback } from 'react';

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

  const render = useCallback(() => {
    if (spanRef.current) {
      spanRef.current.textContent = displayRef.current;
    }
  }, []);

  const tick = useCallback(() => {
    const currentFullText = texts[textIndexRef.current];
    const speed = isDeletingRef.current ? deletingSpeed : typingSpeed;

    if (!isDeletingRef.current) {
      // Typing
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
      // Deleting
      const next = currentFullText.slice(0, displayRef.current.length - 1);
      displayRef.current = next;
      render();

      if (next === '') {
        isDeletingRef.current = false;
        textIndexRef.current = (textIndexRef.current + 1) % texts.length;
      }
    }

    timeoutRef.current = setTimeout(tick, speed + Math.random() * 20);
  }, [texts, typingSpeed, deletingSpeed, pauseDuration, render]);

  useEffect(() => {
    // Reset on texts change
    displayRef.current = '';
    isDeletingRef.current = false;
    textIndexRef.current = 0;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(tick, typingSpeed);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [texts, tick, typingSpeed]);

  // Blink cursor
  useEffect(() => {
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
      <span ref={spanRef} />
      <span
        ref={cursorRef}
        className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle"
      />
    </span>
  );
}
