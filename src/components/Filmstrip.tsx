import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import DitheredPhoto from './DitheredPhoto';
import { filmstripPhotos } from '../data/home';
import { places } from '../data/profile';

// Upright prints in their true orientation. Drag to browse; hover (or tap) a
// print and it develops from 1-bit into color.

const LIFT = [0, 9, 4, 13, 6, 0, 10, 3, 8, 2];
const COUNTRY_COUNT = new Set(places.map((place) => place.country)).size;

export default function Filmstrip() {
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, left: 0, moved: false });
  const [developed, setDeveloped] = useState<number | null>(null);
  // the entrance stagger is for the first reveal only; prints scrolled to later arrive at once
  const [staggerDone, setStaggerDone] = useState(false);
  const staggerTimer = useRef(0);
  useEffect(() => () => clearTimeout(staggerTimer.current), []);
  const onFirstReveal = () => {
    if (staggerDone || staggerTimer.current) return;
    staggerTimer.current = window.setTimeout(() => setStaggerDone(true), 600);
  };
  const toggle = (n: number) => setDeveloped((d) => (d === n ? null : n));

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = strip.current;
    if (!el) return;
    drag.current = { down: true, startX: e.clientX, left: el.scrollLeft, moved: false };
    // mandatory snapping fights a mouse drag frame by frame; let it snap once on release
    el.style.scrollSnapType = 'none';
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.down) return;
    const el = strip.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.left - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.down) return;
    drag.current.down = false;
    const el = strip.current;
    if (!el) return;
    el.style.scrollSnapType = '';
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  return (
    <section id="life" className="relative pb-10 pt-10 sm:pb-14 sm:pt-14 md:pb-16 md:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 xl:max-w-7xl">
        <div className="flex items-baseline justify-between gap-4 font-mono text-[10px] tracking-[0.22em] text-[var(--text-tertiary)]">
          <h2 className="font-mono text-[9px] font-normal tracking-[0.22em] sm:text-[10px]">02 / off the clock</h2>
          <Link to="/memories" className="tap-target group flex items-baseline gap-2 pointer-coarse:-my-2 pointer-coarse:py-2 transition-colors duration-300 hover:text-[var(--text-primary)]">
            <span className="hidden sm:inline">68 frames · {COUNTRY_COUNT} countries</span>
            <span className="sm:hidden">68 frames</span>
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-7 max-w-6xl px-4 sm:px-6 md:px-8 xl:max-w-7xl">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--bg-primary)] to-transparent sm:w-16" />

        <div
          ref={strip}
          role="group"
          aria-label="photo strip"
          // a scroll container is keyboard-focusable in chromium anyway; make that explicit
          // (and not hidden from the accessibility tree) so the arrow keys reach it everywhere
          tabIndex={0}
          data-cursor-hover
          data-cursor-label="drag"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="filmstrip flex cursor-grab snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-8 pt-5 active:cursor-grabbing sm:gap-5"
        >
          {filmstripPhotos.map((photo, i) => (
            <div
              key={photo.n}
              className="shrink-0 snap-start [--photo-h:clamp(148px,18vw,228px)]"
            >
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                onViewportEnter={onFirstReveal}
                transition={{ duration: 0.5, delay: staggerDone ? 0 : i * 0.035, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.div
                  style={{ y: LIFT[i] }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={developed === photo.n}
                  aria-label={`develop photo ${photo.n} into color`}
                  onClick={() => {
                    if (drag.current.moved) return;
                    toggle(photo.n);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    toggle(photo.n);
                  }}
                  className="group/polaroid relative w-fit select-none bg-[#f6f4ee] p-2 pb-8 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_14px_30px_-12px_rgba(0,0,0,0.35)] transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_26px_44px_-16px_rgba(0,0,0,0.42)] sm:p-2.5 sm:pb-10"
                >
                  <div
                    className="relative overflow-hidden bg-[#e9e6de]"
                    style={{ width: `calc(var(--photo-h) * ${photo.ar})`, height: 'var(--photo-h)' }}
                  >
                    <img
                      src={`/memories/thumbs/memory-${photo.n}.webp`}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <DitheredPhoto
                      src={`/memories/thumbs/memory-${photo.n}.webp`}
                      className={`transition-opacity duration-500 ease-out group-hover/polaroid:opacity-0 ${
                        developed === photo.n ? 'opacity-0' : ''
                      }`}
                    />
                  </div>
                  <span className="absolute bottom-2 left-3 font-mono text-[8px] tracking-widest text-[#736e63] sm:bottom-3 sm:text-[9px]">
                    № {String(photo.n).padStart(3, '0')}
                  </span>
                </motion.div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
