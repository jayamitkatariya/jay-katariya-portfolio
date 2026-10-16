import { useEffect, useMemo, useRef, useState } from 'react';
import TextScramble from './TextScramble';

// 8×8 pixel sprites, drawn in pixel-by-pixel when the heading scrolls into view
const SPRITES = {
  smile: [
    '..####..',
    '.#....#.',
    '#.#..#.#',
    '#......#',
    '#.#..#.#',
    '#..##..#',
    '.#....#.',
    '..####..',
  ],
  bolt: [
    '....###.',
    '...###..',
    '..###...',
    '.######.',
    '...###..',
    '..###...',
    '.###....',
    '.##.....',
  ],
  hourglass: [
    '########',
    '.#....#.',
    '..#..#..',
    '...##...',
    '...##...',
    '..#..#..',
    '.#.##.#.',
    '########',
  ],
  trophy: [
    '########',
    '#.####.#',
    '#.####.#',
    '.######.',
    '..####..',
    '...##...',
    '..####..',
    '.######.',
  ],
  heart: [
    '........',
    '.##..##.',
    '########',
    '########',
    '.######.',
    '..####..',
    '...##...',
    '........',
  ],
  camera: [
    '........',
    '..##....',
    '########',
    '#..##..#',
    '#.#..#.#',
    '#.#..#.#',
    '#..##..#',
    '########',
  ],
  globe: [
    '..####..',
    '.#.##.#.',
    '#..##..#',
    '########',
    '#..##..#',
    '#..##..#',
    '.#.##.#.',
    '..####..',
  ],
  arrow: [
    '........',
    '..#.....',
    '..##....',
    '..###...',
    '..####..',
    '..###...',
    '..##....',
    '..#.....',
  ],
  star: [
    '...##...',
    '...##...',
    '########',
    '.######.',
    '..####..',
    '.######.',
    '.##..##.',
    '##....##',
  ],
  book: [
    '........',
    '###..###',
    '#..##..#',
    '#..##..#',
    '#..##..#',
    '#..##..#',
    '########',
    '........',
  ],
  crown: [
    '........',
    '#..##..#',
    '##.##.##',
    '########',
    '########',
    '#.#..#.#',
    '########',
    '........',
  ],
  cap: [
    '........',
    '...##...',
    '.######.',
    '########',
    '.######.',
    '.#....#.',
    '.######.',
    '......#.',
  ],
  medal: [
    '##....##',
    '.##..##.',
    '..####..',
    '..####..',
    '.#....#.',
    '.#.##.#.',
    '.#....#.',
    '..####..',
  ],
  mail: [
    '........',
    '########',
    '##....##',
    '#.#..#.#',
    '#..##..#',
    '#......#',
    '########',
    '........',
  ],
} as const;

export type SpriteName = keyof typeof SPRITES;

export function PixelIcon({
  name,
  size = 18,
  className = '',
  instant = false,
}: {
  name: SpriteName;
  size?: number;
  className?: string;
  /** skip the pixel-by-pixel draw-in */
  instant?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [shown, setShown] = useState(instant);

  const pixels = useMemo(() => {
    const out: { x: number; y: number; delay: number }[] = [];
    SPRITES[name].forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === '#') out.push({ x, y, delay: (x + y) * 28 + Math.random() * 90 });
      }),
    );
    return out;
  }, [name]);

  useEffect(() => {
    const el = ref.current;
    if (!el || instant) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [instant]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 8 8"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {pixels.map(p => (
        <rect
          key={`${p.x}-${p.y}`}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          fill="currentColor"
          style={{
            opacity: shown ? 1 : 0,
            transition: `opacity 60ms steps(1) ${p.delay}ms`,
          }}
        />
      ))}
    </svg>
  );
}

interface SectionHeadingProps {
  text: string;
  icon: SpriteName;
  /** tailwind text color class, e.g. "text-blue-500" */
  color: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeading({ text, icon, color, align = 'left', className = '' }: SectionHeadingProps) {
  return (
    <h2
      className={`group/heading flex items-center gap-3 text-xl sm:text-2xl xl:text-3xl font-medium tracking-tight mb-4 sm:mb-5 md:mb-6 ${color} ${
        align === 'center' ? 'justify-center' : ''
      } ${className}`}
    >
      <PixelIcon name={icon} className="shrink-0 transition-transform duration-300 group-hover/heading:-rotate-12 group-hover/heading:scale-110" />
      <TextScramble text={text} />
    </h2>
  );
}
