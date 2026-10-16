import { useMemo } from 'react';

// Grid of squares that pop in (random order) when the parent `.group` is
// hovered, filling the button pixel by pixel. Parent needs `relative overflow-hidden group`.

export default function PixelFill({ cols = 18, rows = 5, className = 'bg-[var(--text-primary)]' }: { cols?: number; rows?: number; className?: string }) {
  const delays = useMemo(
    () => Array.from({ length: cols * rows }, (_, i) => (i % cols) * 9 + Math.random() * 140),
    [cols, rows],
  );

  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 grid pointer-events-none"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {delays.map((d, i) => (
        <span
          key={i}
          className={`${className} scale-0 group-hover:scale-[1.08] transition-transform duration-75 [transition-timing-function:steps(2)]`}
          style={{ transitionDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}
