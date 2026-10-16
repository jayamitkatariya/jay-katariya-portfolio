import { Fragment, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { prefersReducedMotion } from '../lib/dither';
import DitheredPhoto from './DitheredPhoto';

// A scattered pile of polaroids: 1-bit dithered until you hover (then they
// "develop" into color), drifting at different speeds as you scroll, draggable.

const PHOTOS = [
  { n: 3, left: 2, top: 8, rot: -7, speed: 1.1 },
  { n: 50, left: 20, top: 34, rot: 5, speed: 0.5 },
  { n: 62, left: 37, top: 2, rot: -3, speed: 1.5 },
  { n: 19, left: 55, top: 30, rot: 8, speed: 0.7 },
  { n: 10, left: 74, top: 6, rot: -5, speed: 1.25 },
  { n: 53, left: 8, top: 60, rot: 4, speed: 0.85 },
  { n: 40, left: 78, top: 54, rot: -9, speed: 1.0 },
];

interface PolaroidProps {
  photo: (typeof PHOTOS)[number];
  index: number;
  progress: MotionValue<number>;
  containerRef: RefObject<HTMLDivElement | null>;
  z: number;
  onLift: () => void;
}

// touch screens: no drag (a swipe that starts on a card must still scroll the page)
// and no hover, so a tap develops the print instead
const isCoarsePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

function Polaroid({ photo, index, progress, containerRef, z, onLift }: PolaroidProps) {
  const still = prefersReducedMotion();
  const [coarse] = useState(isCoarsePointer);
  const [developed, setDeveloped] = useState(false);
  const y = useTransform(progress, [0, 1], still ? [0, 0] : [photo.speed * 90, photo.speed * -90]);
  const drift = useTransform(progress, [0, 1], still ? [0, 0] : [-photo.speed * 3, photo.speed * 3]);
  // the 640px copies: a polaroid is ~250px wide, the originals would be wasted bytes
  const src = `/memories/thumbs/memory-${photo.n}.webp`;

  return (
    <motion.div
      className="absolute w-[var(--card-w)]"
      // left is a fraction of the space remaining after the card, so cards never overflow on narrow screens
      style={{ left: `calc((100% - var(--card-w)) * ${Math.min(photo.left / 80, 1)})`, top: `${photo.top}%`, y, rotate: drift, zIndex: z }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: photo.rot * 2.5, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, rotate: photo.rot, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ type: 'spring', stiffness: 160, damping: 18, delay: index * 0.07 }}
      >
        <motion.div
          drag={!coarse}
          dragConstraints={containerRef}
          dragElastic={0.15}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 22 }}
          onPointerDown={onLift}
          onClick={coarse ? () => setDeveloped(d => !d) : undefined}
          whileHover={{ scale: 1.05, rotate: -photo.rot * 0.8 }}
          whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          data-cursor-hover
          className={`group/polaroid select-none ${coarse ? 'touch-pan-y' : 'cursor-grab touch-none'} bg-[#f6f4ee] p-2 sm:p-2.5 pb-9 sm:pb-11 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_12px_32px_-8px_rgba(0,0,0,0.35)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_24px_48px_-12px_rgba(0,0,0,0.45)] transition-shadow duration-300`}
        >
          <div className="relative aspect-square overflow-hidden bg-[#e9e6de]">
            <img
              src={src}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover object-[50%_35%]"
            />
            <DitheredPhoto src={src} className={`transition-opacity duration-500 ease-out group-hover/polaroid:opacity-0 ${developed ? 'opacity-0' : ''}`} />
          </div>
          <span className="absolute bottom-2.5 sm:bottom-3.5 left-3 font-mono text-[9px] sm:text-[10px] tracking-widest text-[#8a867c]">
            № {String(photo.n).padStart(3, '0')}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function SnapshotPile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
  const [order, setOrder] = useState(() => PHOTOS.map((_, i) => i + 1));
  // re-rank on every lift so z-indexes stay 1..n and never climb over the terminal note (50)
  const lift = (i: number) => {
    setOrder(prev => {
      const stack = prev.map((z, j) => ({ z, j })).sort((a, b) => a.z - b.z).map(s => s.j);
      const ranked = [...stack.filter(j => j !== i), i];
      const next = [...prev];
      ranked.forEach((j, rank) => (next[j] = rank + 1));
      return next;
    });
  };

  return (
    <div ref={containerRef} className="relative h-[520px] sm:h-[600px] md:h-[640px] [--card-w:clamp(128px,19vw,232px)]">
      {PHOTOS.map((p, i) => (
        <Fragment key={p.n}>
          <Polaroid
            photo={p}
            index={i}
            progress={scrollYProgress}
            containerRef={containerRef}
            z={order[i]}
            onLift={() => lift(i)}
          />
        </Fragment>
      ))}

      {/* Terminal-style note tucked into the pile */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 0 }}
        whileInView={{ opacity: 1, y: 0, rotate: -2 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.5 }}
        className="absolute left-[38%] top-[66%] sm:left-[44%] sm:top-[68%] w-[min(260px,56vw)] rounded-lg border border-white/10 bg-[#111] text-[#e5e5e5] shadow-2xl font-mono text-[10px] sm:text-xs"
        style={{ zIndex: 50 }}
      >
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <span className="w-2 h-2 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[#737373]">~/memories</span>
        </div>
        <div className="px-3 py-3 leading-relaxed">
          <p><span className="text-emerald-400">$</span> ls | wc -l</p>
          <p className="text-[#a3a3a3]">68</p>
          <p className="mt-1.5 text-[#a3a3a3]">
            <span className="pointer-coarse:hidden">hover to develop. drag to rearrange.</span>
            <span className="hidden pointer-coarse:inline">tap a print to develop it.</span>
          </p>
          <Link
            to="/memories"
            className="inline-block mt-2.5 pointer-coarse:mt-0 pointer-coarse:py-3 pointer-coarse:-mb-3 text-white underline decoration-white/30 underline-offset-4 hover:decoration-white transition-colors"
          >
            open the full roll →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
