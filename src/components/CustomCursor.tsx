import { useEffect, useRef, useState } from 'react';

// Same gate as the `cursor: none` rule in index.css, so the two never disagree.
// A touchscreen laptop with a mouse still gets the custom cursor.
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const hasFinePointer = () => typeof window !== 'undefined' && window.matchMedia(FINE_POINTER).matches;

// Dot + trailing ring. The loop only runs while the ring is catching up to the
// pointer, then sleeps until the next mousemove.
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(hasFinePointer);

  // input can change under us (iPad + trackpad, tablet mode)
  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER);
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add('custom-cursor-active');

    const s = { mouseX: -100, mouseY: -100, ringX: -100, ringY: -100, hovering: false, clicking: false, shown: false };
    let frameId = 0;
    let running = false;

    const frame = () => {
      dot.style.transform = `translate(${s.mouseX - 3}px, ${s.mouseY - 3}px)`;
      s.ringX += (s.mouseX - s.ringX) * 0.15;
      s.ringY += (s.mouseY - s.ringY) * 0.15;
      const size = s.clicking ? 20 : s.hovering ? 48 : 32;
      ring.style.width = ring.style.height = `${size}px`;
      ring.style.transform = `translate(${s.ringX - size / 2}px, ${s.ringY - size / 2}px)`;
      ring.style.borderWidth = s.hovering ? '1.5px' : '1px';

      if (Math.abs(s.mouseX - s.ringX) + Math.abs(s.mouseY - s.ringY) < 0.3) {
        running = false;
        return;
      }
      frameId = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (running) return;
      running = true;
      frameId = requestAnimationFrame(frame);
    };

    const show = (v: boolean) => {
      if (s.shown === v) return;
      s.shown = v;
      setVisible(v);
    };

    const handleMove = (e: MouseEvent) => {
      s.mouseX = e.clientX;
      s.mouseY = e.clientY;
      s.hovering = !!(e.target as HTMLElement).closest?.('a, button, [role="button"], input, textarea, select, [data-cursor-hover]');
      show(true);
      wake();
    };
    const handleDown = () => { s.clicking = true; wake(); };
    const handleUp = () => { s.clicking = false; wake(); };
    const handleLeave = () => show(false);

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    document.documentElement.addEventListener('mouseleave', handleLeave);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      document.documentElement.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(frameId);
    };
  }, [enabled]);

  if (!enabled) return null;

  // white + difference blend: reads as the inverse of whatever is underneath, so the cursor
  // stays visible over the dark lightbox, photos and toasts in either theme
  return (
    <>
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 w-1.5 h-1.5 bg-white mix-blend-difference rounded-full pointer-events-none z-[9999] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 border border-white/40 mix-blend-difference rounded-full pointer-events-none z-[9999] transition-[width,height,opacity,border-width] duration-200 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}
