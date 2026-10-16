// Small 1-bit dithering toolkit (ordered + Atkinson) for the pixel-print look.

// 8x8 Bayer matrix, normalised to (0, 1)
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
].map(v => (v + 0.5) / 64);

export function bayerAt(x: number, y: number): number {
  return BAYER8[(y & 7) * 8 + (x & 7)];
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

/** Cover-fit an image into a w×h grid and return per-cell luminance (0 = black, 1 = white), contrast-stretched. */
export function sampleLuma(img: HTMLImageElement, w: number, h: number, focusY = 0.5, contrast = 1): Float32Array {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (w - dw) / 2, (h - dh) * focusY, dw, dh);
  const data = ctx.getImageData(0, 0, w, h).data;

  const out = new Float32Array(w * h);
  let min = 1;
  let max = 0;
  for (let i = 0; i < out.length; i++) {
    const l = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
    out[i] = l;
    if (l < min) min = l;
    if (l > max) max = l;
  }
  const range = max - min || 1;
  for (let i = 0; i < out.length; i++) {
    const n = (out[i] - min) / range;
    out[i] = contrast === 1 ? n : Math.min(1, Math.max(0, (n - 0.5) * contrast + 0.5));
  }
  return out;
}

/** Atkinson error diffusion. Returns 1 where ink (dark) should be drawn. */
export function atkinson(luma: Float32Array, w: number, h: number): Uint8Array {
  const buf = Float32Array.from(luma);
  const ink = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = buf[i];
      const val = old < 0.5 ? 0 : 1;
      ink[i] = val === 0 ? 1 : 0;
      const err = (old - val) / 8;
      if (x + 1 < w) buf[i + 1] += err;
      if (x + 2 < w) buf[i + 2] += err;
      if (y + 1 < h) {
        if (x > 0) buf[i + w - 1] += err;
        buf[i + w] += err;
        if (x + 1 < w) buf[i + w + 1] += err;
      }
      if (y + 2 < h) buf[i + 2 * w] += err;
    }
  }
  return ink;
}

/** Paint a 1-bit mask into a canvas at native resolution (scale up with `image-rendering: pixelated`). */
export function paintMask(
  ctx: CanvasRenderingContext2D,
  mask: Uint8Array,
  w: number,
  h: number,
  ink: [number, number, number, number],
  paper: [number, number, number, number] | null,
) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < mask.length; i++) {
    const c = mask[i] ? ink : paper;
    if (!c) continue;
    d[i * 4] = c[0];
    d[i * 4 + 1] = c[1];
    d[i * 4 + 2] = c[2];
    d[i * 4 + 3] = c[3];
  }
  ctx.putImageData(img, 0, 0);
}

/** Resolve any CSS color (including var(--x)) to RGBA bytes. */
export function resolveColor(el: Element, cssColor: string, alpha = 1): [number, number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = cssColor;
  probe.style.display = 'none';
  el.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  const m = rgb.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [m[0], m[1], m[2], Math.round((m[3] ?? 1) * alpha * 255)];
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
