import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { prefersReducedMotion } from '../lib/dither';
import { coverGrid } from '../lib/tileGrid';

// Route-change transition: tiles pop in at random to cover the page, then pop
// out to reveal the next one.
// Sits under the nav (z-50) so the nav itself never breaks up on click.

const TILE = 56;
const COVER_MS = 220;
const HOLD_MS = 120;
const REVEAL_MS = 320;

type Phase = 'idle' | 'cover' | 'reveal';

export default function PixelWipe() {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);
  const [phase, setPhase] = useState<Phase>('idle');
  const [run, setRun] = useState(0);

  useEffect(() => {
    // compare paths rather than a first-run flag, so StrictMode's double effect doesn't wipe on load
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    if (prefersReducedMotion()) return;
    setRun(r => r + 1);
    setPhase('cover');
    const t1 = setTimeout(() => setPhase('reveal'), COVER_MS + HOLD_MS);
    const t2 = setTimeout(() => setPhase('idle'), COVER_MS + HOLD_MS + REVEAL_MS + 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  // fresh random order per run, sized to the viewport
  const tiles = useMemo(() => {
    if (typeof window === 'undefined') return { cols: 0, rows: 0, cover: [], reveal: [] };
    const { cols, rows } = coverGrid(TILE);
    const n = cols * rows;
    return {
      cols,
      rows,
      cover: Array.from({ length: n }, () => Math.random() * COVER_MS),
      reveal: Array.from({ length: n }, () => Math.random() * REVEAL_MS),
    };
  }, [run]);

  // two-step mount so the cover transition starts from opacity 0
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (phase !== 'cover') {
      if (phase === 'idle') setArmed(false);
      return;
    }
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [phase]);

  if (phase === 'idle') return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[45] grid overflow-hidden pointer-events-none"
      style={{ gridTemplateColumns: `repeat(${tiles.cols}, ${TILE}px)`, gridAutoRows: `${TILE}px` }}
    >
      {tiles.cover.map((d, i) => {
        const on = phase === 'cover' && armed;
        return (
          <span
            key={i}
            className="bg-[var(--bg-primary)] -m-px"
            style={{
              opacity: on ? 1 : 0,
              transition: `opacity 60ms steps(1) ${phase === 'cover' ? d : tiles.reveal[i]}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
