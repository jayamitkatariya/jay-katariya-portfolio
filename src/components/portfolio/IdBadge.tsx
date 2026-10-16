import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { projects } from '../../data/projects';
import { drawCardBack, drawCardFront, drawStrap } from './cardFace';
import { ANCHOR_X, ANCHOR_Y, ATTACH_X, CAMERA, CARD, CLAMP, CLIP_Y, CRIMP, RING, VIEW_H, restCardY } from './badgeRig';
import { prefersReducedMotion } from '../../lib/dither';
import { onAppReady } from '../../lib/appReady';
import ErrorBoundary from '../ErrorBoundary';
import type { Entrance } from './IdBadge3D';

// Lazy so three.js / rapier only download on this route
const load3D = () => import('./IdBadge3D');
const IdBadge3D = lazy(load3D);

// If the 3D badge isn't up by then, show the static card so the hero isn't empty;
// the 3D card then spawns in that exact pose instead of dropping in.
const PLACEHOLDER_DELAY = 900;
// lets the page's fade-in get going before the card drops
const ENTRANCE_DELAY = 250;

// Probe once and release the probe context — browsers cap live WebGL contexts,
// and a leaked probe would evict the badge's real canvas.
let webglSupport: boolean | null = null;
function canUseWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    webglSupport = !!gl;
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

type Textures = { front: HTMLCanvasElement; back: HTMLCanvasElement; strap: HTMLCanvasElement };

/**
 * The badge at rest, drawn in the 3D scene's own world units (SVG y is flipped) and sized to the
 * stage height exactly like the perspective camera, so the static and 3D cards overlap 1:1.
 */
function StaticBadge({ src }: { src: string }) {
  const cy = -(ANCHOR_Y + restCardY()); // card center
  const clipY = cy - CLIP_Y;
  const strapW = 0.12;
  return (
    <svg
      className="absolute left-1/2 top-0 h-full -translate-x-1/2 overflow-visible"
      style={{ aspectRatio: '1 / 1' }}
      viewBox={`${-VIEW_H / 2} ${-VIEW_H / 2 - CAMERA.y} ${VIEW_H} ${VIEW_H}`}
      role="img"
      aria-label="portfolio id badge: jay katariya, integrated business & engineering, purdue university"
    >
      <defs>
        <clipPath id="badge-card">
          <rect x={-CARD.w / 2} y={cy - CARD.h / 2} width={CARD.w} height={CARD.h} rx={CARD.r} />
        </clipPath>
        <clipPath id="badge-stage">
          <rect x={-VIEW_H} y={-VIEW_H / 2 - CAMERA.y} width={VIEW_H * 2} height={VIEW_H * 2} />
        </clipPath>
        <linearGradient id="badge-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset="1" stopColor="#161616" />
        </linearGradient>
        <linearGradient id="badge-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a3a3a0" />
          <stop offset="1" stopColor="#4a4a48" />
        </linearGradient>
      </defs>
      <g clipPath="url(#badge-stage)">
        {[-1, 1].map(s => (
          <line
            key={s}
            x1={s * ANCHOR_X}
            y1={-ANCHOR_Y}
            x2={s * ATTACH_X}
            y2={clipY}
            stroke="#111"
            strokeWidth={strapW}
          />
        ))}
      </g>
      <circle cx={0} cy={cy - RING.y} r={RING.r} fill="none" stroke="url(#badge-ring)" strokeWidth={RING.tube * 2} />
      <rect
        x={-CRIMP.w / 2}
        y={cy - CRIMP.y - CRIMP.h / 2}
        width={CRIMP.w}
        height={CRIMP.h}
        rx={0.02}
        fill="url(#badge-metal)"
      />
      <g style={{ filter: 'drop-shadow(0 0.18px 0.35px rgba(0,0,0,0.22))' }}>
        <image
          href={src}
          x={-CARD.w / 2}
          y={cy - CARD.h / 2}
          width={CARD.w}
          height={CARD.h}
          clipPath="url(#badge-card)"
          preserveAspectRatio="none"
        />
      </g>
      <rect
        x={-CLAMP.w / 2}
        y={cy - CLAMP.y - CLAMP.h / 2}
        width={CLAMP.w}
        height={CLAMP.h}
        rx={0.025}
        fill="url(#badge-metal)"
      />
    </svg>
  );
}

export default function IdBadge({ className = '' }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [textures, setTextures] = useState<Textures | null>(null);
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [use3D, setUse3D] = useState(() => canUseWebGL() && !prefersReducedMotion());
  const [ready3D, setReady3D] = useState(false);
  const [placeholder, setPlaceholder] = useState(!use3D);
  const [active, setActive] = useState(true);
  const [grabbed, setGrabbed] = useState(false);
  const [shown, setShown] = useState(false); // page visible (loading screen gone)
  const [drawFailed, setDrawFailed] = useState(false);
  const fallBackToStatic = () => {
    setUse3D(false);
    setReady3D(false);
    setPlaceholder(true);
  };

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const off = onAppReady(() => (t = setTimeout(() => setShown(true), ENTRANCE_DELAY)));
    return () => {
      off();
      clearTimeout(t);
    };
  }, []);

  // start the 3D chunk now, in parallel with fonts / photo / texture drawing, instead of after them
  useEffect(() => {
    if (use3D) load3D().catch(() => {}); // a real failure surfaces through the lazy import's error boundary
  }, [use3D]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    (async () => {
      try {
        const [front, back] = await Promise.all([drawCardFront(projects.length), drawCardBack()]);
        const strap = drawStrap();
        if (cancelled) return;
        setTextures({ front, back, strap });
        // async encode: a sync toDataURL of the 1024×1440 face blocked the main thread
        // for 100ms+ on phones, right in the middle of the page's entrance
        const blob = await new Promise<Blob | null>(resolve => front.toBlob(resolve, 'image/png'));
        if (cancelled) return;
        objectUrl = blob ? URL.createObjectURL(blob) : '';
        setFrontUrl(objectUrl || front.toDataURL('image/png'));
      } catch (err) {
        console.error('badge artwork failed', err);
        if (!cancelled) setDrawFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  useEffect(() => {
    if (!use3D || ready3D || !shown) return;
    const t = setTimeout(() => setPlaceholder(true), PLACEHOLDER_DELAY);
    return () => clearTimeout(t);
  }, [use3D, ready3D, shown]);

  // Stop rendering when the badge is offscreen or the tab is hidden
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let inView = true;
    const update = () => setActive(inView && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  // read once when the 3D badge mounts: the card spawns where the placeholder is, or drops in
  const entrance: Entrance = placeholder ? 'rest' : 'drop';
  const hint = ready3D && shown && !grabbed;

  return (
    <div ref={stageRef} className={`relative select-none ${className}`}>
      {/* Static badge: a placeholder while 3D loads slowly, or instead of it (no WebGL / reduced motion). */}
      <AnimatePresence>
        {placeholder && !ready3D && frontUrl && (
          <motion.div
            key="static"
            initial={{ opacity: 0, y: use3D ? 0 : -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="absolute inset-0 pointer-events-none"
          >
            <StaticBadge src={frontUrl} />
          </motion.div>
        )}
      </AnimatePresence>

      {drawFailed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 aspect-[1.6/2.25] rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center justify-center font-mono text-2xl font-bold">
            jk.
          </div>
        </div>
      )}

      {use3D && textures && (
        // WebGL / WASM / chunk failures land on the static card instead of blanking the page
        <ErrorBoundary fallback={null} onError={fallBackToStatic}>
          <Suspense fallback={null}>
            <IdBadge3D
              textures={textures}
              entrance={entrance}
              active={active && shown}
              onReady={() => setReady3D(true)}
              onGrab={() => setGrabbed(true)}
              // context evicted (GPU reset, too many contexts): fall back to the static card
              onLost={fallBackToStatic}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {use3D && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: hint ? 1 : 0, y: hint ? 0 : 4 }}
          transition={{ duration: 0.6, delay: hint ? 2.2 : 0 }}
          className="absolute left-1/2 bottom-[4%] lg:bottom-[8%] -translate-x-1/2 flex items-center gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[var(--text-tertiary)] pointer-events-none select-none whitespace-nowrap"
          aria-hidden="true"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
          drag the badge
        </motion.p>
      )}
    </div>
  );
}
