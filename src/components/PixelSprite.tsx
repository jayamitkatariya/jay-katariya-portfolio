import { useEffect, useMemo, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/dither';

interface PixelSpriteProps {
  /** each frame is a grid of strings: `#` ink (currentColor), `o` accent, `.` empty */
  frames: string[][];
  /** fixed width/height in px; omit to fill the parent (size the parent with classes) */
  size?: number;
  fps?: number;
  /** color for `o` pixels */
  accent?: string;
  className?: string;
}

// Frame-by-frame pixel sprite, drawn as SVG rects like PixelIcon. Only ticks
// while on screen, and holds frame 0 under prefers-reduced-motion.
export default function PixelSprite({ frames, size, fps = 6, accent = '#f59e0b', className = '' }: PixelSpriteProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [frame, setFrame] = useState(0);
  const [visible, setVisible] = useState(false);

  const rects = useMemo(
    () =>
      frames.map(grid => {
        const out: { x: number; y: number; ch: string }[] = [];
        grid.forEach((row, y) =>
          [...row].forEach((ch, x) => {
            if (ch !== '.') out.push({ x, y, ch });
          }),
        );
        return out;
      }),
    [frames],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || prefersReducedMotion()) return;
    const id = window.setInterval(() => setFrame(f => (f + 1) % frames.length), 1000 / fps);
    return () => window.clearInterval(id);
  }, [visible, fps, frames.length]);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${frames[0][0].length} ${frames[0].length}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`pointer-events-none select-none ${size ? '' : 'w-full h-full'} ${className}`}
    >
      {rects[frame].map(p => (
        <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width={1} height={1} fill={p.ch === 'o' ? accent : 'currentColor'} />
      ))}
    </svg>
  );
}
