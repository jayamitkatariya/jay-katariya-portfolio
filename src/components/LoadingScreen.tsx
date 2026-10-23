import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { usePresence } from 'motion/react';
import { bayerAt, prefersReducedMotion, resolveColor } from '../lib/dither';
import { coverGrid } from '../lib/tileGrid';
import LoaderBadge from './LoaderBadge';

// The ID badge drops in on its lanyard while one word types terminal-style beneath it.
// On the way out the badge is yanked back up and the cover "develops" away in
// ordered-dither order — cells drop out by their 8x8 Bayer threshold (nudged so it
// opens from the centre), the same pattern the dithered photos are printed with.

const GREETING = 'namaste';
// ~1.1s on the badge, ~1.55s until the page is fully open: a first impression, not a wait
const TYPE_START = 380; // as the badge catches on its strap
const CHAR_MS = 45;
const HOLD_MS = 420;
const TYPE_END = TYPE_START + GREETING.length * CHAR_MS;
const READY_MS = TYPE_END + HOLD_MS;
const TILE = 24;
const DISSOLVE_MS = 450;
const RADIAL = 0.25; // share of each cell's threshold that comes from distance to centre

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [typed, setTyped] = useState(0);
  const stableOnComplete = useCallback(onComplete, []);
  const completedRef = useRef(false);
  const [isPresent, safeToRemove] = usePresence();
  const [reduced] = useState(prefersReducedMotion);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // cell order for the dissolve, filled in when the cover is painted
  const cellsRef = useRef<{ cols: number; order: Uint32Array; thresholds: Float32Array; dpr: number } | null>(null);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    stableOnComplete();
  }, [stableOnComplete]);

  // Paint the cover before first paint, so the page never flashes through
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { cols, rows } = coverGrid(TILE);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cols * TILE * dpr);
    canvas.height = Math.round(rows * TILE * dpr);
    canvas.style.width = `${cols * TILE}px`;
    canvas.style.height = `${rows * TILE}px`;
    const [r, g, b] = resolveColor(canvas, 'var(--bg-primary)');
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = window.innerWidth / 2 / TILE;
    const cy = window.innerHeight / 2 / TILE;
    const maxDist = Math.hypot(cx, cy) || 1;
    const n = cols * rows;
    const thresholds = new Float32Array(n);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dist = Math.min(Math.hypot(col + 0.5 - cx, row + 0.5 - cy) / maxDist, 1);
        thresholds[row * cols + col] = bayerAt(col, row) * (1 - RADIAL) + dist * RADIAL;
      }
    }
    const order = Uint32Array.from({ length: n }, (_, i) => i).sort((a, b) => thresholds[a] - thresholds[b]);
    cellsRef.current = { cols, order, thresholds, dpr };
  }, []);

  // Type the greeting, hold a beat, then hand over to the page
  useEffect(() => {
    if (reduced) {
      setTyped(GREETING.length);
      // long enough to actually see the badge
      const timer = setTimeout(finish, 700);
      return () => clearTimeout(timer);
    }

    let raf = 0;
    let startTime: number | null = null;
    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      if (elapsed >= READY_MS) {
        setTyped(GREETING.length);
        finish();
        return;
      }
      setTyped(Math.min(Math.max(Math.floor((elapsed - TYPE_START) / CHAR_MS) + 1, 0), GREETING.length));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // safety net: finish even if rAF stalls (hidden tab, throttling)
    const fallback = setTimeout(finish, READY_MS + 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [finish, reduced]);

  // Exit: eat the cover away cell by cell, in threshold order
  useEffect(() => {
    if (isPresent) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const cells = cellsRef.current;
    if (!canvas || !ctx || !cells || prefersReducedMotion()) {
      safeToRemove?.();
      return;
    }

    const { cols, order, thresholds, dpr } = cells;
    let next = 0;
    let raf = 0;
    let startTime: number | null = null;
    const clearUpTo = (t: number) => {
      while (next < order.length && thresholds[order[next]] < t) {
        const i = order[next++];
        const col = i % cols;
        const row = (i - col) / cols;
        // device-pixel edges, so fractional dpr doesn't leave seams between cleared cells
        const x0 = Math.round(col * TILE * dpr);
        const y0 = Math.round(row * TILE * dpr);
        ctx.clearRect(x0, y0, Math.round((col + 1) * TILE * dpr) - x0, Math.round((row + 1) * TILE * dpr) - y0);
      }
    };
    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const p = Math.min((now - startTime) / DISSOLVE_MS, 1);
      clearUpTo(easeInOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else safeToRemove?.();
    };
    raf = requestAnimationFrame(tick);
    const fallback = setTimeout(() => safeToRemove?.(), DISSOLVE_MS + 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [isPresent, safeToRemove]);

  const done = typed >= GREETING.length;

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" role="status">
      <span className="sr-only">loading</span>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute top-0 left-0" />

      {/* outside the fading layer: it leaves by being yanked up, over the dissolve */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <LoaderBadge present={isPresent} reduced={reduced} />
      </div>

      {/* hidden from the live region, or screen readers read out every typed frame */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[max(12svh,calc(env(safe-area-inset-bottom)+48px))] flex justify-center pointer-events-none"
        style={{ opacity: isPresent ? 1 : 0, transition: 'opacity 120ms ease-out' }}
      >
        <span className="font-mono text-base sm:text-lg tracking-[0.35em] pl-[0.35em] text-[var(--text-secondary)] select-none whitespace-pre">
          {GREETING.slice(0, typed)}
          {/* solid while typing, blinks once it's waiting — like a real prompt */}
          <span className={`text-[var(--dither-ink)] ${done ? 'animate-pixel-blink' : ''}`}>▌</span>
          {/* reserve the untyped width so the word doesn't drift as it types */}
          <span className="invisible">{GREETING.slice(typed)}</span>
        </span>
      </div>
    </div>
  );
}
