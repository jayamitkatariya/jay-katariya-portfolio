import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AchievementContext } from '../hooks/useAchievements';

const TOTAL = 65;

// Pre-computed aspect ratios (width / height) via ffprobe
const AR: Record<number, number> = {
  1:.462,2:.751,3:.562,4:1.5,5:.802,6:.751,7:.751,8:.751,9:1.331,10:1.331,
  11:1.331,12:.751,13:1.197,14:.751,15:.751,16:.751,17:.562,18:.751,19:.751,
  20:.751,21:1.331,22:1.331,23:.751,24:.751,25:1.331,26:.751,27:.751,28:.751,
  29:1.331,30:.751,31:1.331,32:.751,33:1.331,34:1.536,35:.751,36:1.331,
  37:.751,38:.751,39:1.037,40:1.331,41:1.331,42:1.331,43:.751,44:.751,
  45:.751,46:.751,47:.751,48:.751,49:.751,50:.751,51:.562,52:.751,53:.751,
  54:.751,55:.562,56:1.331,57:.751,58:.751,59:1.331,60:.562,61:.562,
  62:1.779,63:.562,64:1.331,65:1.5,
};

const AVG_AR = Object.values(AR).reduce((a, b) => a + b, 0) / TOTAL;

function shuffle(arr: number[], seed: number): number[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const ALL = Array.from({ length: TOTAL }, (_, i) => i + 1);
const MASTER = shuffle(ALL, 42);

/**
 * Find numRows + numTiles that minimize |scale - 1| so images aren't cropped.
 * scale = containerH / (numRows * rowHeight + gaps)
 * rowHeight ≈ containerW / (tilesPerRow * AVG_AR)
 */
function computeGridParams(cw: number, ch: number, gap: number) {
  let bestRows = 3;
  let bestTpr = 6;
  let bestDiff = Infinity;

  for (let r = 2; r <= 5; r++) {
    const tpr = Math.max(3, Math.round((r * cw) / (ch * AVG_AR)));
    const total = r * tpr;
    if (total < 6 || total > 45) continue;
    const rowH = cw / (tpr * AVG_AR);
    const totalH = r * rowH + (r - 1) * gap;
    const diff = Math.abs(ch / totalH - 1);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestRows = r;
      bestTpr = tpr;
    }
  }

  return { numRows: bestRows, numTiles: bestRows * bestTpr };
}

/** Pack photos into justified rows filling containerW × containerH */
function packImages(
  photos: number[],
  containerW: number,
  containerH: number,
  gap: number,
  numRows: number,
  heroSet: Set<number>,
): Array<{ photoNum: number; x: number; y: number; w: number; h: number }> {
  if (containerW <= 0 || containerH <= 0 || photos.length === 0) return [];

  const HERO_SCALE = 1.8;
  const ratios = photos.map((p, i) =>
    (AR[p] || 0.75) * (heroSet.has(i) ? HERO_SCALE : 1),
  );

  const totalRatio = ratios.reduce((a, b) => a + b, 0);
  const target = totalRatio / numRows;

  // Partition into rows by distributing aspect-ratio sums evenly
  const rows: number[][] = [];
  let cur: number[] = [];
  let sum = 0;
  for (let i = 0; i < photos.length; i++) {
    cur.push(i);
    sum += ratios[i];
    const remaining = photos.length - i - 1;
    const rowsLeft = numRows - rows.length - 1;
    if (rowsLeft > 0 && remaining >= rowsLeft && sum >= target) {
      rows.push(cur);
      cur = [];
      sum = 0;
    }
  }
  if (cur.length > 0) rows.push(cur);

  // Natural row heights
  const rowData = rows.map((row) => {
    const gapsW = Math.max(0, row.length - 1) * gap;
    const rrs = row.reduce((s, idx) => s + ratios[idx], 0);
    return { indices: row, naturalH: rrs > 0 ? (containerW - gapsW) / rrs : 100 };
  });

  // Scale all rows uniformly to fill containerH
  const totalGapH = Math.max(0, rowData.length - 1) * gap;
  const availH = containerH - totalGapH;
  const totalNatH = rowData.reduce((s, r) => s + r.naturalH, 0);
  const scale = totalNatH > 0 ? availH / totalNatH : 1;

  const result: Array<{ photoNum: number; x: number; y: number; w: number; h: number }> = [];
  let y = 0;

  for (const { indices, naturalH } of rowData) {
    const rowH = naturalH * scale;
    const rrs = indices.reduce((s, idx) => s + ratios[idx], 0);
    const gapsW = Math.max(0, indices.length - 1) * gap;
    const availW = containerW - gapsW;
    let x = 0;

    for (const idx of indices) {
      const imgW = rrs > 0 ? (ratios[idx] / rrs) * availW : availW / indices.length;
      result.push({ photoNum: photos[idx], x, y, w: imgW, h: rowH });
      x += imgW + gap;
    }
    y += rowH + gap;
  }

  return result;
}

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function useBreakpoint() {
  const [bp, setBp] = useState<'sm' | 'md' | 'lg'>('lg');
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? 'sm' : w < 1024 ? 'md' : 'lg');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return bp;
}

export default function MemoriesPage() {
  const bp = useBreakpoint();
  const gap = bp === 'sm' ? 3 : bp === 'md' ? 5 : 6;
  const containerRef = useRef<HTMLDivElement>(null);
  const { w: cw, h: ch } = useContainerSize(containerRef);
  const hasMounted = useRef(false);
  const cycleRef = useRef(0);
  const lbOpenRef = useRef(false);
  const touchStartX = useRef(0);
  const achievementCtx = useContext(AchievementContext);

  // Dynamic grid params: picks numRows/numTiles so scale ≈ 1 (minimal crop)
  const { numRows, numTiles } = useMemo(
    () => (cw > 0 && ch > 0 ? computeGridParams(cw, ch, gap) : { numRows: 3, numTiles: 18 }),
    [cw, ch, gap],
  );

  const [photos, setPhotos] = useState<number[]>(() => MASTER.slice(0, 24));
  const [heroes, setHeroes] = useState<Set<number>>(() => new Set([1, 7]));

  // Clean up body overflow on unmount (e.g. navigating away with lightbox open)
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Preload all 65 images (4.4 MB total)
  useEffect(() => {
    ALL.forEach((n) => {
      const img = new Image();
      img.src = `/memories/memory-${n}.webp`;
    });
  }, []);

  // Adjust tile count when viewport changes
  useEffect(() => {
    setPhotos((prev) => {
      if (prev.length === numTiles) return prev;
      if (prev.length > numTiles) return prev.slice(0, numTiles);
      const used = new Set(prev);
      const result = [...prev];
      for (const n of MASTER) {
        if (result.length >= numTiles) break;
        if (!used.has(n)) {
          result.push(n);
          used.add(n);
        }
      }
      return result;
    });
  }, [numTiles]);

  // Mark mounted after stagger entrance
  useEffect(() => {
    const t = setTimeout(() => {
      hasMounted.current = true;
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  // Cycle: reshuffle ~30% of images + reorder layout every 4s
  // Skip auto-cycling if user prefers reduced motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let iv: ReturnType<typeof setInterval>;
    const delay = hasMounted.current ? 0 : 2500;

    const timeout = setTimeout(() => {
      iv = setInterval(() => {
        if (lbOpenRef.current) return; // Pause cycling while viewing a photo

        cycleRef.current++;
        const swapCount = Math.max(2, Math.floor(numTiles * 0.3));

        setPhotos((prev) => {
          // Remove random swapCount photos
          const idxs = [...Array(prev.length).keys()];
          const shuffledIdxs = shuffle(idxs, Date.now() % 99999);
          const removeSet = new Set(shuffledIdxs.slice(0, swapCount));
          const kept = prev.filter((_, i) => !removeSet.has(i));
          const used = new Set(kept);

          // Add new photos
          const result = [...kept];
          let a = 0;
          while (result.length < numTiles && a < 300) {
            const c = MASTER[(cycleRef.current * 7 + a) % TOTAL];
            if (!used.has(c)) {
              result.push(c);
              used.add(c);
            }
            a++;
          }

          // Reshuffle arrangement so tile positions change
          return shuffle(result, cycleRef.current * 31);
        });

        // Spread heroes across different halves so they land in different rows
        const half = Math.floor(numTiles / 2);
        const h1 = Math.floor(Math.random() * half);
        const h2 = half + Math.floor(Math.random() * (numTiles - half));
        setHeroes(new Set([h1, h2]));
      }, 4000);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (iv) clearInterval(iv);
    };
  }, [numTiles]);

  const packed = useMemo(
    () => packImages(photos, cw, ch, gap, numRows, heroes),
    [photos, cw, ch, gap, numRows, heroes],
  );

  // ── Lightbox ──
  const [lbPhoto, setLbPhoto] = useState<number | null>(null);
  const [navDir, setNavDir] = useState(0);

  // Keep ref in sync so cycling interval can read it
  useEffect(() => { lbOpenRef.current = lbPhoto !== null; }, [lbPhoto]);

  const openLb = useCallback((p: number) => {
    setNavDir(0);
    setLbPhoto(p);
    document.body.style.overflow = 'hidden';
    achievementCtx?.unlock('photographer');
  }, [achievementCtx]);

  const closeLb = useCallback(() => {
    setLbPhoto(null);
    document.body.style.overflow = '';
  }, []);

  const navLb = useCallback(
    (dir: 1 | -1) => {
      if (lbPhoto === null) return;
      setNavDir(dir);
      const idx = MASTER.indexOf(lbPhoto);
      setLbPhoto(MASTER[(idx + dir + MASTER.length) % MASTER.length]);
    },
    [lbPhoto],
  );

  useEffect(() => {
    if (lbPhoto === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowRight') navLb(1);
      else if (e.key === 'ArrowLeft') navLb(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lbPhoto, closeLb, navLb]);

  // Touch swipe for mobile lightbox navigation
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > 50) navLb(dx > 0 ? -1 : 1);
    },
    [navLb],
  );

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* ── Title ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
        className="shrink-0 pt-16 sm:pt-20 md:pt-24 pb-2 sm:pb-3 md:pb-3 text-center px-4"
      >
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-medium tracking-tight text-[var(--text-primary)] mb-1">
          memories
        </h1>
        <p className="text-[var(--text-tertiary)] font-light text-xs sm:text-sm md:text-base tracking-wide">
          moments worth remembering
        </p>
      </motion.div>

      {/* ── Grid Frame ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className="flex-1 min-h-0 px-2 sm:px-3 md:px-5 lg:px-8 pb-2 sm:pb-3 md:pb-4"
      >
        <div className="relative h-full max-w-[1400px] mx-auto group/frame">
          {/* Ambient glow — dual layer */}
          <div className="absolute -inset-1 sm:-inset-1.5 bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#f093fb] rounded-2xl sm:rounded-3xl blur-xl opacity-20 group-hover/frame:opacity-35 transition-opacity duration-700 animate-gradient-xy pointer-events-none" />
          <div
            className="absolute -inset-1 sm:-inset-1.5 bg-gradient-to-l from-[#f5576c] via-[#f093fb] to-[#4facfe] rounded-2xl sm:rounded-3xl blur-2xl opacity-10 group-hover/frame:opacity-20 transition-opacity duration-700 animate-gradient-xy pointer-events-none"
            style={{ animationDirection: 'reverse', animationDuration: '4s' }}
          />

          {/* White container */}
          <div className="relative z-10 h-full rounded-xl sm:rounded-2xl md:rounded-3xl bg-[var(--bg-primary)] p-1 sm:p-1.5 md:p-2 overflow-hidden">
            <div ref={containerRef} className="relative w-full h-full">
              <AnimatePresence>
                {packed.map((item, i) => (
                  <motion.div
                    key={item.photoNum}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      left: item.x,
                      top: item.y,
                      width: item.w,
                      height: item.h,
                    }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{
                      opacity: {
                        duration: 0.5,
                        delay: hasMounted.current ? 0 : i * 0.04,
                        ease: [0.23, 1, 0.32, 1],
                      },
                      scale: {
                        duration: 0.5,
                        delay: hasMounted.current ? 0 : i * 0.04,
                        ease: [0.23, 1, 0.32, 1],
                      },
                      left: { type: 'spring', stiffness: 120, damping: 20 },
                      top: { type: 'spring', stiffness: 120, damping: 20 },
                      width: { type: 'spring', stiffness: 120, damping: 20 },
                      height: { type: 'spring', stiffness: 120, damping: 20 },
                    }}
                    className="absolute group cursor-pointer"
                    style={{ willChange: 'transform, opacity' }}
                    onClick={() => openLb(item.photoNum)}
                  >
                    {/* Per-tile hover glow */}
                    <div className="absolute -inset-[2px] bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#f093fb] rounded-lg sm:rounded-xl md:rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500 animate-gradient-xy" />

                    <div className="relative z-10 w-full h-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                      <img
                        src={`/memories/memory-${item.photoNum}.webp`}
                        alt={`memory ${item.photoNum}`}
                        draggable={false}
                        className="w-full h-full object-cover select-none"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lbPhoto !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={closeLb}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <motion.div
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <button
              onClick={closeLb}
              aria-label="Close lightbox"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navLb(-1); }}
              aria-label="Previous photo"
              className="absolute left-2 sm:left-4 md:left-8 z-20 w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navLb(1); }}
              aria-label="Next photo"
              className="absolute right-2 sm:right-4 md:right-8 z-20 w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <motion.div
              className="relative max-w-[90vw] max-h-[80vh] sm:max-h-[85vh] z-10"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#f093fb] rounded-xl sm:rounded-2xl blur-xl opacity-40 animate-gradient-xy" />
              <div
                className="absolute -inset-1 bg-gradient-to-l from-[#f5576c] via-[#f093fb] to-[#4facfe] rounded-xl sm:rounded-2xl blur-2xl opacity-25 animate-gradient-xy"
                style={{ animationDirection: 'reverse', animationDuration: '4s' }}
              />

              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={lbPhoto}
                  src={`/memories/memory-${lbPhoto}.webp`}
                  alt={`memory ${lbPhoto}`}
                  initial={{ opacity: 0, x: navDir * 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: navDir * -50 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  draggable={false}
                  className="relative z-10 max-w-[90vw] max-h-[80vh] sm:max-h-[85vh] object-contain rounded-xl sm:rounded-2xl select-none"
                />
              </AnimatePresence>
            </motion.div>

            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] sm:text-xs text-white/40 tracking-widest z-10">
              {MASTER.indexOf(lbPhoto) + 1} / {TOTAL}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
