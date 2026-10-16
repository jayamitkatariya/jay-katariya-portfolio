import { useEffect, useRef } from 'react';
import { loadImage, prefersReducedMotion } from '../lib/dither';

// Small WebPs: they're only sampled on a 7–14px grid, so ~480px wide is plenty
const IMAGE_CONFIGS = [
  { url: "/hero/tajmahal.webp", invert: false },
  { url: "/hero/messi.webp", invert: false },
  { url: "/hero/bezos.webp", invert: false },
  { url: "/hero/jensen.webp", invert: true },
  { url: "/hero/zuck.webp", invert: false },
];

const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

export default function HeroCanvas({ isDark = false }: { isDark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // read by the draw loop, so a theme toggle recolors without restarting the animation
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  // the loop sleeps once everything has settled; a theme toggle wakes it for one repaint
  const wakeRef = useRef<() => void>(() => {});
  useEffect(() => wakeRef.current(), [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // no willReadFrequently: this canvas is only drawn to, and that flag forces CPU rendering
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // reduced motion: cells snap to the image and ignore the pointer, so after one frame it sleeps
    const reduced = prefersReducedMotion();

    let loadedSources: { img: HTMLImageElement; invert: boolean }[] = [];
    let currentImgIndex = 0;
    let currentInverted = false;
    let animationFrameId: number;
    let intervalId: ReturnType<typeof setInterval>;
    let running = false;
    let inView = true;
    let disposed = false;
    let mouse = { x: -1000, y: -1000 };
    // logical (CSS px) size; the backing store is scaled by dpr for crisp squares
    let W = 0;
    let H = 0;
    let dpr = 1;

    const handleMouseMove = (e: PointerEvent) => {
      // touch is handled below; a tap's emulated mouse event would leave a permanent hole
      if (e.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      if (!reduced) start();
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      start(); // let pushed cells spring home
    };
    // touch equivalent: a finger dragging across the hero pushes pixels aside.
    // touchmove (not pointermove) keeps firing while the page scrolls under the finger.
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = t.clientX - rect.left;
      mouse.y = t.clientY - rect.top;
      if (!reduced) start();
    };

    window.addEventListener('pointermove', handleMouseMove, { passive: true });
    // mouseleave never fires on window; the root element gets it when the cursor exits
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseLeave, { passive: true });
    window.addEventListener('touchcancel', handleMouseLeave, { passive: true });

    interface GridCell {
      x: number;
      y: number;
      size: number;
      targetSize: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
      // pending image-switch: targetSize becomes nextSize once now >= activateAt
      nextSize: number;
      activateAt: number;
    }

    // Size of each pixel square (smaller = higher res). 10 on a laptop; finer on
    // phones so faces still read, coarser on big screens to keep the cell count sane.
    let step = 10;
    let cols = 0;
    let rows = 0;
    let grid: GridCell[] = [];

    const getTargets = (source: HTMLImageElement, invert: boolean) => {
      if (W === 0 || H === 0) return new Float32Array(cols * rows);

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return new Float32Array(cols * rows);

      offscreen.width = W;
      offscreen.height = H;

      // Fill white background first
      offCtx.fillStyle = '#ffffff';
      offCtx.fillRect(0, 0, W, H);

      if (source.width === 0 || source.height === 0) return new Float32Array(cols * rows);
      // Cover fit: fill the entire viewport with no whitespace gaps
      const scale = Math.max(W / source.width, H / source.height);
      const w = source.width * scale;
      const h = source.height * scale;
      const x = (W - w) / 2;
      // Bias vertical crop toward the bottom (hidden by gradient overlay)
      // so faces/subjects at the top stay visible
      const y = h > H ? -(h - H) * 0.25 : (H - h) / 2;
      offCtx.drawImage(source, x, y, w, h);

      const imgData = offCtx.getImageData(0, 0, W, H).data;
      const rawDarkness = new Float32Array(cols * rows);
      let minDarkness = 255;
      let maxDarkness = 0;

      // First pass: Calculate darkness and find min/max for histogram normalization
      for (let py = 0; py < rows; py++) {
        for (let px = 0; px < cols; px++) {
          const pixelX = px * step + Math.floor(step / 2);
          const pixelY = py * step + Math.floor(step / 2);

          if (pixelX < W && pixelY < H) {
            const i = (pixelY * W + pixelX) * 4;
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];

            const brightness = (r + g + b) / 3;
            const darkness = 255 - brightness;

            rawDarkness[py * cols + px] = darkness;
            if (darkness < minDarkness) minDarkness = darkness;
            if (darkness > maxDarkness) maxDarkness = darkness;
          }
        }
      }

      const targets = new Float32Array(cols * rows);
      const range = maxDarkness - minDarkness || 1;

      // Second pass: Normalize contrast so every image looks perfect
      for (let i = 0; i < rawDarkness.length; i++) {
        // Normalize to 0.0 - 1.0, clamped so padding pixels don't produce NaN
        let normalized = Math.max(0, (rawDarkness[i] - minDarkness) / range);

        // Invert: light areas become visible pixels instead of dark areas
        if (invert) normalized = 1 - normalized;

        // Apply a curve to increase contrast (makes darks darker, lights lighter)
        normalized = Math.pow(normalized, 1.5);

        // Only show pixels above threshold
        if (normalized > 0.15) {
          targets[i] = normalized;
        } else {
          targets[i] = 0;
        }
      }
      
      return targets;
    };

    const switchImage = (index: number) => {
      if (!loadedSources[index]) return;
      currentInverted = loadedSources[index].invert;
      const targets = getTargets(loadedSources[index].img, currentInverted);
      const now = performance.now();

      for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];
        
        // Calculate distance from center for a cool radial wipe effect
        const dx = cell.baseX - W / 2;
        const dy = cell.baseY - H / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Add random noise to the delay for a "digital glitch" feel
        const delay = dist * 0.3 + Math.random() * 200;

        // Max size is 90% of step to leave a tiny grid gap
        cell.nextSize = targets[i] * step * 0.9;
        cell.activateAt = now + delay;
      }
      start();
    };

    const init = () => {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;

      step = Math.min(14, Math.max(7, Math.round(W / 144)));
      cols = Math.ceil(W / step);
      rows = Math.ceil(H / step);
      grid = [];
      currentImgIndex = 0;

      // Initialize grid with random noise so it looks cool immediately
      for (let py = 0; py < rows; py++) {
        for (let px = 0; px < cols; px++) {
          grid.push({
            x: px * step + step / 2,
            y: py * step + step / 2,
            size: Math.random() * step * 0.5, // Start with random noise
            targetSize: 0,
            vx: 0,
            vy: 0,
            baseX: px * step + step / 2,
            baseY: py * step + step / 2,
            nextSize: 0,
            activateAt: 0,
          });
        }
      }
      
      // Start animation loop immediately
      start();

      // Load all images locally - skip any that fail
      const generation = ++initGeneration;
      Promise.all(
        IMAGE_CONFIGS.map(config =>
          loadImage(config.url).then(img => ({ img, invert: config.invert }), () => null)
        )
      ).then(results => {
        // unmounted (or re-inited) while the images were loading
        if (disposed || generation !== initGeneration) return;
        loadedSources = results.filter((r): r is { img: HTMLImageElement; invert: boolean } => r !== null);

        if (loadedSources.length > 0) {
          switchImage(0);
          if (prefersReducedMotion()) return;
          clearInterval(intervalId);
          intervalId = setInterval(() => {
            // not `running`: the loop sleeps between wipes, and the switch is what wakes it
            if (!inView || document.hidden) return;
            currentImgIndex = (currentImgIndex + 1) % loadedSources.length;
            switchImage(currentImgIndex);
          }, 5000);
        }
      });
    };

    const animate = () => {
      if (!running) return;
      const now = performance.now();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const bgColor = isDarkRef.current ? '#0a0a0a' : '#ffffff';
      const fgColor = isDarkRef.current ? '#f5f5f5' : '#111111';
      if (currentInverted) {
        ctx.fillStyle = fgColor;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = bgColor;
      } else {
        ctx.fillStyle = fgColor;
      }

      // anything still in motion, or a wipe still queued, keeps the loop awake
      let busy = false;

      for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];

        if (cell.activateAt) {
          if (reduced || now >= cell.activateAt) {
            cell.targetSize = cell.nextSize;
            cell.activateAt = 0;
          } else {
            busy = true;
          }
        }

        if (reduced) {
          cell.size = cell.targetSize;
        } else {
          const before = cell.size;

          // Mouse interaction (repel and shrink) — cheap bbox reject before sqrt
          const dx = mouse.x - cell.x;
          const dy = mouse.y - cell.y;
          const dist = dx > -80 && dx < 80 && dy > -80 && dy < 80 ? Math.sqrt(dx * dx + dy * dy) : 1e9;

          if (dist < 80) {
            const force = (80 - dist) / 80;
            cell.vx -= (dx / dist) * force * 5;
            cell.vy -= (dy / dist) * force * 5;
            cell.size *= 0.8; // Shrink when hovered
          }

          // Spring back to base grid position
          cell.vx += (cell.baseX - cell.x) * 0.15;
          cell.vy += (cell.baseY - cell.y) * 0.15;

          // Friction
          cell.vx *= 0.8;
          cell.vy *= 0.8;

          cell.x += cell.vx;
          cell.y += cell.vy;

          // Smooth size transition
          cell.size += (cell.targetSize - cell.size) * 0.1;

          // per-frame change, not distance from target: a pointer resting on the hero holds
          // cells at a steady shrunk size, and that should sleep too
          if (!busy && (Math.abs(cell.vx) > 0.01 || Math.abs(cell.vy) > 0.01 || Math.abs(cell.size - before) > 0.02)) busy = true;
        }

        if (cell.size > 0.5) {
          // Draw actual square pixels
          ctx.fillRect(
            cell.x - cell.size / 2, 
            cell.y - cell.size / 2, 
            cell.size, 
            cell.size
          );
        }
      }

      // settled: sleep until the pointer, an image switch, a resize or the theme wakes it
      if (!busy) {
        running = false;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    function start() {
      if (running || !inView || document.hidden) return;
      running = true;
      animationFrameId = requestAnimationFrame(animate);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(animationFrameId);
    }

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start(); else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    let initGeneration = 0;
    wakeRef.current = start;
    init();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        // mobile URL bars collapsing fire resize with a small height change; don't re-noise
        // mid-scroll. Touch only: on desktop a small height change must still resize the
        // backing store, or the old bitmap is stretched and the squares blur.
        const sameHeight = coarsePointer() ? Math.abs(rect.height - H) < 160 : Math.round(rect.height) === H;
        if (Math.round(rect.width) === W && sameHeight) return;
        clearInterval(intervalId);
        stop();
        init();
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('pointermove', handleMouseMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseLeave);
      window.removeEventListener('touchcancel', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(intervalId);
      clearTimeout(resizeTimeout);
      wakeRef.current = () => {};
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-90"
    />
  );
}

