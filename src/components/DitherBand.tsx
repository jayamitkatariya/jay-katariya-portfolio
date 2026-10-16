import { useEffect, useRef } from 'react';
import { bayerAt, loadImage, resolveColor, sampleLuma, prefersReducedMotion } from '../lib/dither';
import { CURSOR_W, FONT_ROWS, layoutPixelText, type PixelText } from '../lib/pixelFont';

// Ordered-dither duotone render of a photo. The image "develops" as it enters
// the viewport, and its density thins out toward the top/bottom edges so it
// dissolves into the page instead of ending on a hard line. Optional text is
// typed into the dot grid in a pixel font, terminal-style, with a blinking cursor.

interface DitherBandProps {
  src: string;
  color: string; // any css color, may be var(--x)
  pixel?: number;
  focusY?: number;
  isDark: boolean;
  text?: string;
  className?: string;
}

const PAD = 1; // font pixels of plate around the text
const TYPE_DELAY = 650;
const TYPE_STEP = 95;
const BLINK = 530;

// font-pixel layers
const PLATE = 1;
const GLYPH = 2;
const CURSOR = 3;

export default function DitherBand({ src, color, pixel = 3, focusY = 0.5, isDark, text, className = '' }: DitherBandProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const buf = document.createElement('canvas');
    const bctx = buf.getContext('2d')!;
    const reduced = prefersReducedMotion();
    let cancelled = false;
    let raf = 0;
    let blinkTimer = 0;
    let visible = false;
    let luma: Float32Array | null = null;
    let w = 0;
    let h = 0;
    let cell = 1; // device pixels per dither cell, always an integer so dots stay even
    let reveal = reduced ? 1 : 0;
    let typed = reduced ? Infinity : 0;
    let cursorShown = reduced; // the cursor's slot is cut out of the photo
    let cursorOn = reduced; // …and blinks its fill inside that slot, so the knockout never flickers
    let typeEndAt = 0;
    let started = reduced;
    const ink = resolveColor(canvas, color);

    const word: PixelText | null = text ? layoutPixelText(text) : null;
    const gridCols = word ? word.cols + 1 + CURSOR_W + PAD * 2 : 0;
    const gridRows = FONT_ROWS + PAD * 2;
    const layers = new Uint8Array(gridCols * gridRows);
    let scale = 0;
    let ox = 0;
    let oy = 0;

    // Compose the plate, the glyphs typed so far and the cursor slot
    const buildLayers = () => {
      if (!word) return;
      layers.fill(0);
      const n = word.charStarts.length - 1;
      const shownCols = typed >= n ? word.cols : word.charStarts[Math.min(typed, n)] - 1;
      if (!cursorShown) return;
      // a notched-corner plate knocked out of the photo, growing with the cursor like a terminal line
      const at = word.charStarts[Math.min(typed, n)];
      const right = at + CURSOR_W + PAD * 2 - 1;
      const bottom = gridRows - 1;
      for (let r = 0; r <= bottom; r++) {
        for (let c = 0; c <= right; c++) {
          const corner = (r === 0 || r === bottom) && (c === 0 || c === right);
          if (!corner) layers[r * gridCols + c] = PLATE;
        }
      }
      const stamp = (c: number, r: number, v: number) => { layers[(r + PAD) * gridCols + c + PAD] = v; };
      for (let r = 0; r < FONT_ROWS; r++) {
        for (let c = 0; c < shownCols; c++) if (word.bits[r * word.cols + c]) stamp(c, r, GLYPH);
        for (let c = 0; c < CURSOR_W; c++) stamp(at + c, r, CURSOR);
      }
    };

    const render = () => {
      if (!luma) return;
      buildLayers();
      const img = bctx.createImageData(w, h);
      const d = img.data;
      // map reveal 0→1 onto a threshold bias so the image builds up from sparse dots
      const bias = (1 - reveal) * 0.9;
      const led = scale >= 4 ? 1 : 0; // gutter between font pixels → LED-matrix look
      for (let y = 0; y < h; y++) {
        const t = y / (h - 1);
        // soft envelope: dissolve in over top 30%, out over bottom 50%
        const env = Math.min(1, t / 0.3, Math.pow((1 - t) / 0.5, 1.6));
        const gy = y - oy;
        const fy = scale ? Math.floor(gy / scale) : -1;
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          let on: boolean;
          const gx = x - ox;
          const fx = scale ? Math.floor(gx / scale) : -1;
          const layer = fx >= 0 && fy >= 0 && fx < gridCols && fy < gridRows ? layers[fy * gridCols + fx] : 0;
          if (layer === GLYPH || (layer === CURSOR && cursorOn)) {
            on = gx - fx * scale < scale - led && gy - fy * scale < scale - led;
          } else if (layer === PLATE || layer === CURSOR) {
            on = false;
          } else {
            // ink where the photo is dark on a light page, where it's bright on a dark page
            const tone = isDark ? luma[i] : (1 - luma[i]) * 0.8;
            on = tone * env - bias > bayerAt(x, y);
          }
          if (on) {
            d[i * 4] = ink[0];
            d[i * 4 + 1] = ink[1];
            d[i * 4 + 2] = ink[2];
            d[i * 4 + 3] = ink[3];
          }
        }
      }
      bctx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, w * cell, h * cell);
    };

    const blink = () => {
      clearTimeout(blinkTimer);
      if (!word || reduced || !visible || typed < word.charStarts.length - 1) return;
      const now = performance.now();
      cursorOn = Math.floor((now - typeEndAt) / BLINK) % 2 === 0;
      render();
      blinkTimer = window.setTimeout(blink, BLINK - ((now - typeEndAt) % BLINK));
    };

    const animateIn = () => {
      const start = performance.now();
      const n = word ? word.charStarts.length - 1 : 0;
      const tick = (now: number) => {
        const t = now - start;
        const p = Math.min(1, t / 1400);
        reveal = 1 - Math.pow(1 - p, 3);
        if (word) {
          cursorShown = cursorOn = t > TYPE_DELAY - 250;
          typed = Math.max(0, Math.min(n, Math.floor((t - TYPE_DELAY) / TYPE_STEP)));
        }
        render();
        if (p < 1 || typed < n) {
          raf = requestAnimationFrame(tick);
        } else {
          typeEndAt = now;
          blink();
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const setup = async () => {
      const img = await loadImage(src).catch(() => null);
      if (!img || cancelled) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      cell = Math.max(1, Math.round(pixel * dpr));
      w = Math.max(16, Math.ceil(canvas.width / cell));
      h = Math.max(16, Math.ceil(canvas.height / cell));
      buf.width = w;
      buf.height = h;
      luma = sampleLuma(img, w, h, focusY, isDark ? 1.5 : 1.15);
      if (word) {
        const fit = Math.min((w * 0.7) / (gridCols - PAD * 2), (h * 0.36) / FONT_ROWS);
        scale = Math.max(2, Math.floor(fit));
        ox = Math.floor((w - gridCols * scale) / 2);
        oy = Math.round(h * 0.42 - (gridRows * scale) / 2);
      }
      render();
    };

    setup();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !started) {
        started = true;
        animateIn();
      } else {
        blink();
      }
    }, { threshold: 0.25 });
    io.observe(canvas);

    let lastW = canvas.clientWidth;
    const ro = new ResizeObserver(() => {
      if (Math.abs(canvas.clientWidth - lastW) < 4) return;
      lastW = canvas.clientWidth;
      setup();
    });
    ro.observe(canvas);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(blinkTimer);
      io.disconnect();
      ro.disconnect();
    };
  }, [src, color, pixel, focusY, isDark, text]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block w-full ${className}`} />;
}
