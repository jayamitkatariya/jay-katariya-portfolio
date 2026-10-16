import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/dither';

// Conway's Game of Life layer. Moving the cursor launches gliders that fly
// off in the direction you moved. Each cell carries a lineage age, so a glider
// travels a short arc and dissolves — accents, not residents, over the portrait.

const CELL = 14;
const STEP_MS = 95;
const LIFESPAN = 16; // generations (~1.5s) before a lineage dies out
const PEAK_ALPHA = 0.6;

// Glider heading down-right; flipped per direction when stamped
const GLIDER = [
  [1, 0],
  [2, 1],
  [0, 2], [1, 2], [2, 2],
];

export default function LifeCanvas({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // read per frame, so a theme toggle recolors live gliders instead of wiping them
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    let alive = new Uint8Array(0);
    let next = new Uint8Array(0);
    let age = new Uint16Array(0);
    let nextAge = new Uint16Array(0);
    let glow = new Float32Array(0);
    let dpr = 1;

    let sizedW = -1;
    let sizedH = -1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // mobile URL bars collapsing fire resize with a small height change; keep the gliders
      // alive. Touch only: on desktop the backing store must track the real size or it blurs.
      const sameHeight = window.matchMedia('(pointer: coarse)').matches
        ? Math.abs(rect.height - sizedH) < 160
        : rect.height === sizedH;
      if (Math.round(rect.width) === sizedW && sameHeight) return;
      sizedW = Math.round(rect.width);
      sizedH = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      cols = Math.ceil(rect.width / CELL);
      rows = Math.ceil(rect.height / CELL);
      alive = new Uint8Array(cols * rows);
      next = new Uint8Array(cols * rows);
      age = new Uint16Array(cols * rows);
      nextAge = new Uint16Array(cols * rows);
      glow = new Float32Array(cols * rows);
    };

    const stamp = (cx: number, cy: number, dx: number, dy: number) => {
      const fx = dx < 0 ? -1 : 1;
      const fy = dy < 0 ? -1 : 1;
      for (const [gx, gy] of GLIDER) {
        const x = cx + (gx - 1) * fx;
        const y = cy + (gy - 1) * fy;
        if (x >= 0 && y >= 0 && x < cols && y < rows) {
          alive[y * cols + x] = 1;
          age[y * cols + x] = 0;
        }
      }
      wake();
    };

    const step = () => {
      let population = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let n = 0;
          for (let oy = -1; oy <= 1; oy++) {
            const yy = y + oy;
            if (yy < 0 || yy >= rows) continue;
            for (let ox = -1; ox <= 1; ox++) {
              if (!ox && !oy) continue;
              const xx = x + ox;
              if (xx >= 0 && xx < cols) n += alive[yy * cols + xx];
            }
          }
          const i = y * cols + x;
          let live = alive[i] ? n === 2 || n === 3 : n === 3;
          let a = 0;
          if (live) {
            if (alive[i]) {
              a = age[i] + 1;
            } else {
              // newborn inherits the youngest parent's age
              a = LIFESPAN;
              for (let oy = -1; oy <= 1; oy++) {
                const yy = y + oy;
                if (yy < 0 || yy >= rows) continue;
                for (let ox = -1; ox <= 1; ox++) {
                  const xx = x + ox;
                  if ((ox || oy) && xx >= 0 && xx < cols && alive[yy * cols + xx]) a = Math.min(a, age[yy * cols + xx] + 1);
                }
              }
            }
            if (a >= LIFESPAN) live = false;
          }
          next[i] = live ? 1 : 0;
          nextAge[i] = live ? a : 0;
          population += next[i];
        }
      }
      [alive, next] = [next, alive];
      [age, nextAge] = [nextAge, age];
      return population;
    };

    let raf = 0;
    let running = false;
    let lastStep = 0;
    let visible = true;

    const frame = (now: number) => {
      let population = -1;
      if (now - lastStep > STEP_MS) {
        population = step();
        lastStep = now;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isDarkRef.current ? '#f5f5f5' : '#111111'; // --text-primary
      let lit = 0;
      const size = CELL - 2;
      for (let i = 0; i < glow.length; i++) {
        glow[i] = alive[i] ? PEAK_ALPHA * Math.pow(1 - age[i] / LIFESPAN, 1.5) : glow[i] * 0.8;
        if (glow[i] < 0.02) { glow[i] = 0; continue; }
        lit++;
        ctx.globalAlpha = glow[i];
        ctx.fillRect((i % cols) * CELL + 1, Math.floor(i / cols) * CELL + 1, size, size);
      }
      ctx.globalAlpha = 1;

      if (population === 0 && lit === 0) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (running || !visible) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    // Cursor → gliders, throttled by distance so a fast swipe makes a flock
    let last: { x: number; y: number } | null = null;
    const onMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        last = null;
        return;
      }
      if (!last) {
        last = { x, y };
        return;
      }
      const dx = x - last.x;
      const dy = y - last.y;
      if (dx * dx + dy * dy < (CELL * 5) ** 2) return;
      stamp(Math.floor(x / CELL), Math.floor(y / CELL), dx, dy);
      last = { x, y };
    };
    const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    // a new swipe starts fresh, not from where the last one lifted off
    const onTouchStart = () => {
      last = null;
    };

    resize();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(canvas);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      io.disconnect();
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
