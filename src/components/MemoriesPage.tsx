import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { motion, AnimatePresence, useIsPresent } from 'motion/react';
import { Pause, Play, Shuffle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AchievementContext } from '../hooks/useAchievements';
import { prefersReducedMotion } from '../lib/dither';
import DitheredPhoto from './DitheredPhoto';
import PageHeader from './PageHeader';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const TOTAL = 68;

// Pre-computed aspect ratios (width / height) via sips
const AR: Record<number, number> = {
  1:.461,2:1.27,3:.75,4:1.501,5:.75,6:.75,7:2.266,8:1.333,9:.75,10:.75,
  11:1.333,12:1.333,13:.75,14:1.333,15:1.198,16:.562,17:.75,18:1.333,19:1.333,20:1.333,
  21:.75,22:1.333,23:1.333,24:.75,25:1.333,26:.562,27:.75,28:1.333,29:.75,30:1.333,
  31:1.333,32:1.333,33:.562,34:.562,35:.562,36:1.778,37:.562,38:.75,39:1.538,40:1.333,
  41:.75,42:.75,43:1.333,44:.562,45:.562,46:.562,47:1.333,48:1.333,49:1.333,50:1.038,
  51:.562,52:1.333,53:1.333,54:1.333,55:.75,56:1.333,57:1.333,58:1.333,59:1.071,60:.75,
  61:.75,62:1.333,63:.75,64:.562,65:1.333,66:1.333,67:.608,68:1.333,
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

  // tall phones need more, shorter rows, or every tile is stretched and cropped
  const maxRows = ch / cw > 1.6 ? 7 : 5;
  for (let r = 2; r <= maxRows; r++) {
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

const breakpointFor = (w: number) => (w < 640 ? 'sm' : w < 1024 ? 'md' : 'lg');

function useBreakpoint() {
  // read up front, so phones don't lay out with the desktop gap first and then jump
  const [bp, setBp] = useState<'sm' | 'md' | 'lg'>(() => breakpointFor(window.innerWidth));
  useEffect(() => {
    const check = () => setBp(breakpointFor(window.innerWidth));
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return bp;
}

// matches the lightbox photo's max-h classes
const lightboxMaxH = () => window.innerHeight - (window.innerHeight <= 500 ? 72 : 128);

const EASE = [0.23, 1, 0.32, 1] as const;
const SWAP_MS = 5000;
const SWAP_COUNT = 2;
const HEROES = new Set([1, 7]); // fixed so the layout stays stable between swaps
const src = (n: number) => `/memories/memory-${n}.webp`;
// 640px-long-edge copies (~35KB vs ~160KB). Tiles rarely pass ~300 CSS px, so the
// originals are only worth it for the lightbox and the odd big tile on a retina screen.
const thumb = (n: number) => `/memories/thumbs/memory-${n}.webp`;
const tileSrc = (n: number, size: number) => (size * Math.min(window.devicePixelRatio || 1, 2) > 700 ? src(n) : thumb(n));
const label = (n: number) => `№ ${String(n).padStart(3, '0')}`;

function preload(urls: string[]) {
  for (const url of urls) {
    const img = new Image();
    img.src = url;
  }
}

/** One photo inside a tile: appears as a 1-bit print, then develops into color. */
function PhotoLayer({ url, developDelay, still }: { url: string; developDelay: number; still: boolean }) {
  const [printed, setPrinted] = useState(still);
  const [developed, setDeveloped] = useState(still);

  useEffect(() => {
    if (still) return;
    // develop once the print is on screen; safety net if the image never loads
    const t = setTimeout(() => setDeveloped(true), printed ? developDelay : developDelay + 2500);
    return () => clearTimeout(t);
  }, [printed, developDelay, still]);

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.25 }}
    >
      <img
        src={url}
        alt=""
        draggable={false}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover select-none"
      />
      {!still && (
        <DitheredPhoto
          src={url}
          pixel={1.8}
          onReady={() => setPrinted(true)}
          className={`transition-opacity duration-700 ease-out ${developed ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
    </motion.div>
  );
}

interface TileProps {
  item: { photoNum: number; x: number; y: number; w: number; h: number };
  enterDelay: number;
  still: boolean;
  onOpen: (photoNum: number, rect: DOMRect, el: HTMLElement) => void;
}

function MemoryTile({ item, enterDelay, still, onOpen }: TileProps) {
  const open = (el: HTMLElement) => onOpen(item.photoNum, el.getBoundingClientRect(), el);
  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`open memory ${item.photoNum}`}
      initial={{ opacity: 0, x: item.x, y: item.y, width: item.w, height: item.h }}
      animate={{ opacity: 1, x: item.x, y: item.y, width: item.w, height: item.h }}
      transition={{
        opacity: { duration: 0.01, delay: enterDelay / 1000 },
        default: { type: 'spring', stiffness: 140, damping: 24 },
      }}
      onClick={e => open(e.currentTarget)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(e.currentTarget);
        }
      }}
      className="absolute left-0 top-0 group cursor-pointer rounded-md sm:rounded-lg overflow-hidden bg-[var(--bg-tertiary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
    >
      <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]">
        <AnimatePresence initial={false}>
          <PhotoLayer key={item.photoNum} url={tileSrc(item.photoNum, Math.max(item.w, item.h))} developDelay={enterDelay + 650} still={still} />
        </AnimatePresence>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <span className="absolute left-2 bottom-1.5 sm:left-2.5 sm:bottom-2 font-mono text-[9px] sm:text-[10px] tracking-widest text-white/90 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
        {label(item.photoNum)}
      </span>
    </motion.div>
  );
}

export default function MemoriesPage() {
  const bp = useBreakpoint();
  const gap = bp === 'sm' ? 3 : bp === 'md' ? 5 : 6;
  const containerRef = useRef<HTMLDivElement>(null);
  const { w: cw, h: ch } = useContainerSize(containerRef);
  const achievementCtx = useContext(AchievementContext);
  const [still] = useState(prefersReducedMotion);

  const { numRows, numTiles } = useMemo(
    () => (cw > 0 && ch > 0 ? computeGridParams(cw, ch, gap) : { numRows: 3, numTiles: 18 }),
    [cw, ch, gap],
  );

  const [photos, setPhotos] = useState<number[]>(() => MASTER.slice(0, 24));
  const nextPick = useRef(24); // rotating pointer into MASTER for fresh photos

  // Match tile count to the viewport
  useEffect(() => {
    setPhotos(prev => {
      if (prev.length === numTiles) return prev;
      if (prev.length > numTiles) return prev.slice(0, numTiles);
      const used = new Set(prev);
      const result = [...prev];
      for (const n of MASTER) {
        if (result.length >= numTiles) break;
        if (!used.has(n)) { result.push(n); used.add(n); }
      }
      return result;
    });
  }, [numTiles]);

  /** Replace `count` random tiles in place with photos not currently shown. */
  // computed outside the state updater: it advances nextPick and preloads, which must happen once
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const swap = useCallback((count: number) => {
    const prev = photosRef.current;
    const used = new Set(prev);
    const next = [...prev];
    const slots = shuffle([...prev.keys()], Date.now() % 99991).slice(0, count);
    for (const slot of slots) {
      for (let a = 0; a < TOTAL; a++) {
        const cand = MASTER[nextPick.current++ % TOTAL];
        if (!used.has(cand)) { used.delete(next[slot]); next[slot] = cand; used.add(cand); break; }
      }
    }
    // warm the cache for the next round
    preload([0, 1, 2].map(i => thumb(MASTER[(nextPick.current + i) % TOTAL])));
    photosRef.current = next;
    setPhotos(next);
  }, []);

  // ── Autoplay: pausable, and pauses itself on hover / hidden tab / lightbox ──
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [lbPhoto, setLbPhoto] = useState<number | null>(null);
  // Release the lock (and drop the lightbox) as soon as the page starts leaving: otherwise the
  // unlock's scroll restore lands on the incoming page, after App has scrolled it to the top.
  const isPresent = useIsPresent();
  const lbOpen = lbPhoto !== null && isPresent;
  useBodyScrollLock(lbOpen);
  const [tabHidden, setTabHidden] = useState(false);
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  const playing = !still && !userPaused && !hovering && !tabHidden && lbPhoto === null;

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => swap(SWAP_COUNT), SWAP_MS);
    return () => clearInterval(iv);
  }, [playing, swap]);

  const packed = useMemo(() => packImages(photos, cw, ch, gap, numRows, HEROES), [photos, cw, ch, gap, numRows]);

  // Entrance: prints appear in a diagonal sweep, then develop in the same order.
  // Only the first layout gets the sweep; later swaps develop immediately.
  const entered = useRef(false);
  useEffect(() => {
    if (packed.length && !entered.current) {
      const t = setTimeout(() => (entered.current = true), 2500);
      return () => clearTimeout(t);
    }
  }, [packed.length]);
  const delayFor = (x: number, y: number) =>
    entered.current || still ? 0 : Math.round(((x + y) / Math.max(1, cw + ch)) * 900);

  // ── Lightbox ──
  const [navDir, setNavDir] = useState(0);
  const originRef = useRef<{ photo: number; rect: DOMRect } | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const openLb = useCallback((p: number, rect: DOMRect, el: HTMLElement) => {
    originRef.current = { photo: p, rect };
    returnFocusRef.current = el;
    setNavDir(0);
    setLbPhoto(p);
    achievementCtx?.unlock('photographer');
  }, [achievementCtx]);

  const closeLb = useCallback(() => {
    setLbPhoto(null);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  const navLb = useCallback((dir: 1 | -1) => {
    setNavDir(dir);
    setLbPhoto(cur => (cur === null ? cur : MASTER[(MASTER.indexOf(cur) + dir + TOTAL) % TOTAL]));
  }, []);

  useEffect(() => {
    if (lbPhoto === null) return;
    closeBtnRef.current?.focus();
    const i = MASTER.indexOf(lbPhoto);
    preload([src(MASTER[(i + 1) % TOTAL]), src(MASTER[(i - 1 + TOTAL) % TOTAL])]);
  }, [lbPhoto]);

  useEffect(() => {
    if (lbPhoto === null) return;
    const onKey = (e: KeyboardEvent) => {
      // page shortcuts (1–4, ?) would navigate or open a panel underneath the lightbox
      if (!e.metaKey && !e.ctrlKey && !e.altKey && /^[1-4?]$/.test(e.key)) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowRight') navLb(1);
      else if (e.key === 'ArrowLeft') navLb(-1);
      else if (e.key === 'Tab' && dialogRef.current) {
        // keep focus inside the dialog
        const buttons = [...dialogRef.current.querySelectorAll<HTMLElement>('button')];
        if (!buttons.length) return;
        const i = buttons.indexOf(document.activeElement as HTMLElement);
        const next = e.shiftKey ? (i <= 0 ? buttons.length - 1 : i - 1) : (i + 1) % buttons.length;
        e.preventDefault();
        buttons[next].focus();
      }
    };
    // capture phase, so this runs before App's global shortcut listener
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [lbPhoto, closeLb, navLb]);

  // Zoom from / back to the tile the photo was opened from
  const zoomFrom = (photo: number) => {
    const o = originRef.current;
    if (!o || o.photo !== photo || navDir !== 0) return { opacity: 0, x: navDir * 60, scale: 1, y: 0 };
    const r = o.rect;
    return {
      opacity: 0.6,
      x: r.left + r.width / 2 - window.innerWidth / 2,
      y: r.top + r.height / 2 - window.innerHeight / 2,
      scale: Math.max(0.15, r.height / lightboxMaxH()),
    };
  };

  return (
    <main className="h-[100svh] flex flex-col overflow-hidden">
      <PageHeader
        title="memories"
        icon="camera"
        iconColor="text-pink-500"
        className="shrink-0 w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 md:pt-28 short:pt-16 pb-4 sm:pb-5 short:pb-2"
      >
        {!still && (
          <div className="flex items-center gap-1 font-mono text-[11px] tracking-wider text-[var(--text-tertiary)]">
            <button
              onClick={() => setUserPaused(p => !p)}
              aria-pressed={userPaused}
              className="flex items-center gap-1.5 px-3 py-1.5 pointer-coarse:py-3 rounded-full hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              {userPaused ? <Play size={12} /> : <Pause size={12} />}
              {userPaused ? 'play' : 'pause'}
            </button>
            <button
              onClick={() => swap(Math.max(3, Math.floor(photos.length * 0.3)))}
              className="flex items-center gap-1.5 px-3 py-1.5 pointer-coarse:py-3 rounded-full hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Shuffle size={12} /> shuffle
            </button>
            <span className="pl-2 text-[var(--text-muted)]" aria-live="off">
              {photos.length} / {TOTAL}
            </span>
          </div>
        )}
      </PageHeader>

      <div className="flex-1 min-h-0 w-full max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-6 md:px-8 pb-3 sm:pb-5">
        <div
          className="relative h-full rounded-xl sm:rounded-2xl border border-[var(--border-primary)] p-1 sm:p-1.5 md:p-2"
          // mouse only: a tap fires emulated mouse events and would leave autoplay paused
          onPointerEnter={e => e.pointerType === 'mouse' && setHovering(true)}
          onPointerLeave={e => e.pointerType === 'mouse' && setHovering(false)}
        >
          <div ref={containerRef} className="relative w-full h-full">
            {packed.map((item, slot) => (
              <MemoryTile
                key={slot}
                item={item}
                enterDelay={delayFor(item.x, item.y)}
                still={still}
                onOpen={openLb}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lbOpen && (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`memory ${lbPhoto}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.05 } }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            // iOS ignores body overflow:hidden; this stops the page behind from scrolling
            style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
            onClick={closeLb}
            onTouchStart={e => (touchStartX.current = e.touches[0].clientX)}
            onTouchEnd={e => {
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 50) navLb(dx > 0 ? -1 : 1);
            }}
          >
            <div className="absolute inset-0 bg-[#0a0a0a]/92 backdrop-blur-md" />

            <button
              ref={closeBtnRef}
              onClick={closeLb}
              aria-label="close"
              className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] sm:top-[max(1.5rem,env(safe-area-inset-top))] sm:right-[max(1.5rem,env(safe-area-inset-right))] short:top-3 z-20 w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); navLb(-1); }}
              aria-label="previous photo"
              className="absolute left-[max(1rem,env(safe-area-inset-left))] sm:left-[max(1.5rem,env(safe-area-inset-left))] max-sm:bottom-[calc(0.25rem+env(safe-area-inset-bottom))] z-20 w-11 h-11 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); navLb(1); }}
              aria-label="next photo"
              className="absolute right-[max(1rem,env(safe-area-inset-right))] sm:right-[max(1.5rem,env(safe-area-inset-right))] max-sm:bottom-[calc(0.25rem+env(safe-area-inset-bottom))] z-20 w-11 h-11 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={24} strokeWidth={1.5} />
            </button>

            <AnimatePresence mode="popLayout" initial={true} custom={navDir}>
              <motion.img
                key={lbPhoto}
                src={src(lbPhoto)}
                alt={`memory ${lbPhoto}`}
                draggable={false}
                // the full-size file usually isn't cached yet (tiles use thumbs): known proportions
                // plus the cached thumb underneath, so it zooms in sharpening rather than popping in
                width={Math.round(AR[lbPhoto] * 1000)}
                height={1000}
                style={{ backgroundImage: `url(${thumb(lbPhoto)})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                onClick={e => e.stopPropagation()}
                custom={navDir}
                initial={zoomFrom(lbPhoto)}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                // a variant, so the leaving photo gets the latest direction via AnimatePresence's custom
                variants={{ exit: (d: number) => ({ opacity: 0, x: d * -60, transition: { duration: 0.2 } }) }}
                exit="exit"
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="relative z-10 max-w-[90vw] sm:max-w-[calc(100vw-9rem)] max-h-[calc(100dvh-8rem)] short:max-h-[calc(100dvh-4.5rem)] object-contain rounded-lg select-none shadow-2xl"
              />
            </AnimatePresence>

            <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] short:bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 font-mono text-[10px] sm:text-xs text-white/50 tracking-widest z-10">
              <span className="text-white/80">{label(lbPhoto)}</span>
              <span>·</span>
              <span>{MASTER.indexOf(lbPhoto) + 1} / {TOTAL}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
