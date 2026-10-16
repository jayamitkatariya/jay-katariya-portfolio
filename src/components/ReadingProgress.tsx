import { useEffect, useRef } from 'react';

// Written straight to the DOM and drawn with a transform: a width animation
// re-lays out the page, and React state would re-render on every scroll frame.
export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const p = total > 0 ? Math.min(Math.max(window.scrollY / total, 0), 1) : 0;
      bar.style.transform = `scaleX(${p})`;
      bar.style.opacity = p > 0 ? '1' : '0';
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // lazy sections (map, snapshots) change the page height after load
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    apply();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[2px] z-[60] pointer-events-none">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-[var(--text-primary)] opacity-0 transition-transform duration-150 ease-out"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
