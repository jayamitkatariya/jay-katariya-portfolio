import QRCode from 'qrcode';
import { bayerAt } from '../../lib/dither';
import { CARD } from './badgeRig';

// Artwork for the portfolio ID badge, drawn in 2D so the same image can be a
// WebGL texture (3D badge) or a plain <img> (static fallback).

// roundRect landed in Safari 16 / Chrome 99 / Firefox 112; older browsers would
// throw mid-draw and leave the badge hero empty.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x: number, y: number, w: number, h: number, radii?: number | DOMPointInit | (number | DOMPointInit)[]) {
    const r0 = Array.isArray(radii) ? radii[0] : radii;
    const r = Math.max(0, Math.min(typeof r0 === 'number' ? r0 : 0, w / 2, h / 2));
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

export const CARD_W = 1024;
export const CARD_H = 1440; // 1.6 : 2.25 — matches the 3D card's proportions

const PAPER = '#f4f2ed';
const INK = '#141414';
const MUTED = '#8a867c';
const RULE = '#e0dcd3';
const ACCENT = '#4f46e5'; // the site's dither indigo
const LIVE = '#10b981';
const SITE = 'https://jaykatariya.com';
const M = 72; // outer margin

// Holographic seal, in canvas px — the 3D card lays a foil disc exactly here
export const SEAL = { x: 452, y: 728, r: 64 };

const PHOTO = { x: M, y: 244, w: 400, h: 500, r: 18 };
const PANEL_Y = 1064; // top of the ink panel

const STAR = ['...##...', '...##...', '########', '.######.', '..####..', '.######.', '.##..##.', '##....##'];

const mono = (size: number, weight = 400) => `${weight} ${size}px "JetBrains Mono", monospace`;
const sans = (size: number, weight = 500) => `${weight} ${size}px Inter, sans-serif`;

async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load(sans(120)),
      document.fonts.load(sans(40, 400)),
      document.fonts.load(mono(30)),
      document.fonts.load(mono(30, 500)),
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

// canvas letterSpacing is newer than the TS DOM lib in some setups; ignored where unsupported
function track(g: CanvasRenderingContext2D, px: number) {
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`;
}

function pixelStar(g: CanvasRenderingContext2D, x: number, y: number, cell: number, color: string) {
  g.fillStyle = color;
  STAR.forEach((row, r) => [...row].forEach((ch, c) => ch === '#' && g.fillRect(x + c * cell, y + r * cell, cell, cell)));
}

// fine paper tooth so large flat areas don't read as a flat UI rectangle
function grain(g: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
  const img = g.getImageData(0, 0, w, h);
  const rand = seeded(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * amount;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

// Passport-style guilloche: interleaved sine ribbons, printed just above the paper tone
function guilloche(g: CanvasRenderingContext2D, top: number, bottom: number) {
  g.save();
  g.strokeStyle = '#e6e2d8';
  g.lineWidth = 1.4;
  const mid = (top + bottom) / 2;
  const amp = (bottom - top) / 2 - 6;
  for (let k = 0; k < 16; k++) {
    const phase = (k / 16) * Math.PI * 2;
    g.beginPath();
    for (let x = 0; x <= CARD_W; x += 4) {
      const t = x / CARD_W;
      const y = mid + amp * Math.sin(t * Math.PI * 5 + phase) * (0.55 + 0.45 * Math.cos(t * Math.PI * 2 + phase * 0.5));
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}

/** Duotone the scan (ink → paper) so it sits in the card's palette and hides the scan's security print. */
function photoDuotone(photo: HTMLImageElement, w: number, h: number) {
  const [c, g] = canvas(w, h);
  // cover-crop the square scan to a portrait frame, biased a touch upward to keep the face centered
  const s = Math.max(w / photo.width, h / photo.height);
  const sw = w / s;
  const sh = h / s;
  g.filter = 'blur(1.2px)'; // melts the scan's print texture; no-op where canvas filters are unsupported
  g.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) * 0.4, sw, sh, 0, 0, w, h);
  g.filter = 'none';
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const lo = [34, 32, 30];
  const hi = [236, 233, 226];
  for (let i = 0; i < d.length; i += 4) {
    let l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    l = Math.min(1, Math.max(0, (l - 0.08) / 0.84)); // levels
    l = 0.6 * l + 0.4 * l * l * (3 - 2 * l); // a soft S-curve
    for (let k = 0; k < 3; k++) d[i + k] = lo[k] + (hi[k] - lo[k]) * l;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Pastel foil: a conic rainbow with pressed rings. Rotating it reads as a hologram catching the light. */
export function drawHolo(size = 256): HTMLCanvasElement {
  const [c, g] = canvas(size, size);
  const h = size / 2;
  // linear fallback where conic gradients aren't supported (Safari < 16.1)
  const conic = typeof g.createConicGradient === 'function' ? g.createConicGradient(0, h, h) : g.createLinearGradient(0, 0, size, size);
  ['#ffc8e4', '#c4d2ff', '#b2f1e2', '#fff1a8', '#ffd3b8', '#e1c8ff', '#ffc8e4'].forEach((col, i, a) =>
    conic.addColorStop(i / (a.length - 1), col),
  );
  g.fillStyle = conic;
  g.fillRect(0, 0, size, size);
  const pearl = g.createRadialGradient(h, h, 0, h, h, h);
  pearl.addColorStop(0, 'rgba(255,255,255,0.75)');
  pearl.addColorStop(0.45, 'rgba(255,255,255,0.1)');
  pearl.addColorStop(1, 'rgba(255,255,255,0.35)');
  g.fillStyle = pearl;
  g.fillRect(0, 0, size, size);
  g.strokeStyle = 'rgba(255,255,255,0.45)';
  g.lineWidth = 1;
  for (let r = 4; r < h; r += 5) {
    g.beginPath();
    g.arc(h, h, r, 0, Math.PI * 2);
    g.stroke();
  }
  return c;
}

/** The seal's printed layer (transparent background): rim, circular legend and a pixel star. */
export function drawSealInk(size = 256): HTMLCanvasElement {
  const [c, g] = canvas(size, size);
  const h = size / 2;
  g.strokeStyle = 'rgba(20,20,20,0.55)';
  g.lineWidth = size * 0.012;
  g.beginPath();
  g.arc(h, h, h * 0.93, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(h, h, h * 0.56, 0, Math.PI * 2);
  g.stroke();

  const legend = 'VERIFIED · BUILDER · 2026 · ';
  g.fillStyle = 'rgba(20,20,20,0.7)';
  g.font = mono(size * 0.085, 500);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const step = (Math.PI * 2) / legend.length;
  [...legend].forEach((ch, i) => {
    g.save();
    g.translate(h, h);
    g.rotate(i * step - Math.PI / 2 + step / 2);
    g.translate(0, -h * 0.745);
    g.fillText(ch, 0, 0);
    g.restore();
  });
  const cell = Math.round(size * 0.04);
  pixelStar(g, h - cell * 4, h - cell * 4, cell, 'rgba(20,20,20,0.8)');
  return c;
}

export async function drawCardFront(projectCount: number): Promise<HTMLCanvasElement> {
  const [, photo] = await Promise.all([fontsReady(), loadImage('/idpic.jpg')]);
  const [c, g] = canvas(CARD_W, CARD_H);

  g.fillStyle = PAPER;
  g.fillRect(0, 0, CARD_W, CARD_H);
  guilloche(g, 790, 1030);

  // header
  pixelStar(g, M, 124, 4, ACCENT);
  g.fillStyle = INK;
  g.font = mono(28, 500);
  track(g, 5);
  g.fillText('PORTFOLIO PASS', M + 52, 154);
  g.fillStyle = MUTED;
  g.font = mono(26);
  track(g, 2);
  g.textAlign = 'right';
  g.fillText(`№ ${String(projectCount).padStart(4, '0')}`, CARD_W - M, 154);
  g.textAlign = 'left';
  track(g, 0);
  g.fillStyle = RULE;
  g.fillRect(M, 196, CARD_W - M * 2, 2);

  // photo: duotoned scan, or a dither + monogram block if it fails to load
  g.save();
  g.beginPath();
  g.roundRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r);
  g.clip();
  if (photo) {
    g.drawImage(photoDuotone(photo, PHOTO.w, PHOTO.h), PHOTO.x, PHOTO.y);
  } else {
    g.fillStyle = '#e8e5de';
    g.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
    g.fillStyle = '#cfcabe';
    for (let y = 0; y < PHOTO.h / 4; y++)
      for (let x = 0; x < PHOTO.w / 4; x++)
        if ((y / (PHOTO.h / 4)) * 0.6 > bayerAt(x, y)) g.fillRect(PHOTO.x + x * 4, PHOTO.y + y * 4, 4, 4);
    g.fillStyle = INK;
    g.font = mono(150, 500);
    g.textAlign = 'center';
    g.fillText('jk.', PHOTO.x + PHOTO.w / 2, PHOTO.y + PHOTO.h / 2 + 50);
    g.textAlign = 'left';
  }
  g.restore();
  g.strokeStyle = 'rgba(20,20,20,0.12)';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(PHOTO.x + 1, PHOTO.y + 1, PHOTO.w - 2, PHOTO.h - 2, PHOTO.r - 1);
  g.stroke();

  // fields
  const FX = PHOTO.x + PHOTO.w + 56;
  const fields: [string, string][] = [
    ['role', 'builder'],
    ['school', 'purdue · ibe'],
    ['projects', String(projectCount).padStart(2, '0')],
    ['status', 'building'],
  ];
  fields.forEach(([label, value], i) => {
    const y = PHOTO.y + 30 + i * 124;
    g.fillStyle = MUTED;
    g.font = mono(20, 500);
    track(g, 4);
    g.fillText(label.toUpperCase(), FX, y);
    track(g, -0.5);
    g.fillStyle = INK;
    g.font = sans(40, 400);
    let vx = FX;
    if (label === 'status') {
      g.fillStyle = 'rgba(16,185,129,0.18)';
      g.beginPath();
      g.arc(FX + 10, y + 38, 15, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = LIVE;
      g.beginPath();
      g.arc(FX + 10, y + 38, 8, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = INK;
      vx += 38;
    }
    g.fillText(value, vx, y + 52);
  });
  track(g, 0);

  // seal, printed (the 3D card overlays a live foil disc on the same spot)
  g.save();
  g.beginPath();
  g.arc(SEAL.x, SEAL.y, SEAL.r, 0, Math.PI * 2);
  g.clip();
  g.drawImage(drawHolo(), SEAL.x - SEAL.r, SEAL.y - SEAL.r, SEAL.r * 2, SEAL.r * 2);
  g.drawImage(drawSealInk(), SEAL.x - SEAL.r, SEAL.y - SEAL.r, SEAL.r * 2, SEAL.r * 2);
  g.restore();

  // name, fitted to the measure
  g.fillStyle = INK;
  let size = 132;
  track(g, -5);
  g.font = sans(size);
  while (g.measureText('jay katariya').width > CARD_W - M * 2 && size > 80) g.font = sans((size -= 4));
  g.fillText('jay katariya', M - 4, 912);
  track(g, 0);
  g.fillStyle = MUTED;
  g.font = mono(26);
  g.fillText('integrated business & engineering', M, 970);
  g.fillText('purdue university', M, 1010);

  grain(g, CARD_W, PANEL_Y, 10, 7);

  // ink panel with a dither rising from the bottom edge
  g.fillStyle = INK;
  g.fillRect(0, PANEL_Y, CARD_W, CARD_H - PANEL_Y);
  g.fillStyle = '#242424';
  const P = 6;
  const rows = (CARD_H - PANEL_Y) / P;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < CARD_W / P; x++) if ((y / rows) ** 1.6 * 0.85 > bayerAt(x, y)) g.fillRect(x * P, PANEL_Y + y * P, P, P);

  g.fillStyle = PAPER;
  g.font = sans(38, 500);
  track(g, -1);
  g.fillText('jaykatariya.com', M, 1150);
  track(g, 3);
  g.fillStyle = MUTED;
  g.font = mono(20, 500);
  g.fillText('SCAN TO VISIT  →', M, 1192);

  // machine-readable zone, for the bit
  g.fillStyle = '#cfcabf';
  g.font = mono(27, 500);
  track(g, 3);
  g.fillText('PP<JK<<KATARIYA<<JAY<<<<<<<', M, 1318);
  g.fillText(`${String(projectCount).padStart(4, '0')}<BUILDER<PURDUE<IBE<<26`, M, 1362);
  track(g, 0);

  // QR to the site, on a paper tile
  const TILE = 224;
  const TX = CARD_W - M - TILE;
  const TY = 1140;
  g.fillStyle = PAPER;
  g.beginPath();
  g.roundRect(TX, TY, TILE, TILE, 16);
  g.fill();
  const qr = QRCode.create(SITE, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const pad = 18;
  const m = (TILE - pad * 2) / n;
  g.fillStyle = INK;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      // BitMatrix.get is (row, col): (x, y) would draw the code mirrored on its diagonal
      if (qr.modules.get(y, x)) g.fillRect(TX + pad + x * m, TY + pad + y * m, Math.ceil(m), Math.ceil(m));

  // hairline just inside the die-cut, so the card's edge holds against a white page
  const R = (CARD.r / CARD.w) * CARD_W;
  g.strokeStyle = 'rgba(20,20,20,0.10)';
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(1.5, 1.5, CARD_W - 3, CARD_H - 3, R);
  g.stroke();

  return c;
}

export async function drawCardBack(): Promise<HTMLCanvasElement> {
  await fontsReady();
  const [c, g] = canvas(CARD_W, CARD_H);
  g.fillStyle = INK;
  g.fillRect(0, 0, CARD_W, CARD_H);

  // ordered-dither gradient rising from the bottom
  g.fillStyle = '#262626';
  const P = 8;
  for (let y = 0; y < CARD_H / P; y++)
    for (let x = 0; x < CARD_W / P; x++) if ((y / (CARD_H / P)) ** 1.4 > bayerAt(x, y)) g.fillRect(x * P, y * P, P, P);

  g.textAlign = 'center';
  g.fillStyle = MUTED;
  g.font = mono(20, 500);
  track(g, 5);
  g.fillText('PORTFOLIO PASS · 2026', CARD_W / 2, 170);

  pixelStar(g, CARD_W / 2 - 24, 520, 6, ACCENT);
  g.fillStyle = PAPER;
  g.font = mono(170, 500);
  track(g, -4);
  g.fillText('jk.', CARD_W / 2, 760);
  track(g, 1);
  g.fillStyle = '#b5b1a7';
  g.font = mono(28);
  g.fillText('if found, say hi', CARD_W / 2, 850);
  g.fillStyle = PAPER;
  g.fillText('jkatariy@purdue.edu', CARD_W / 2, 896);

  g.fillStyle = '#8a867c';
  g.font = mono(20);
  track(g, 0);
  ['this pass grants access to side projects,', 'late-night ideas & unsolicited product opinions.', 'non-transferable. mostly.'].forEach((line, i) =>
    g.fillText(line, CARD_W / 2, 1250 + i * 34),
  );
  return c;
}

export function drawStrap(): HTMLCanvasElement {
  const [c, g] = canvas(1024, 64);
  g.fillStyle = '#111111';
  g.fillRect(0, 0, c.width, c.height);
  // woven texture + stitched edges
  g.fillStyle = 'rgba(255,255,255,0.035)';
  for (let x = 0; x < c.width; x += 3) g.fillRect(x, 0, 1, c.height);
  g.fillStyle = '#4a4a4a'; // stitching also keeps the strap's edges legible on a dark page
  for (let x = 0; x < c.width; x += 10) {
    g.fillRect(x, 5, 6, 2);
    g.fillRect(x, c.height - 7, 6, 2);
  }
  g.fillStyle = '#e8e5de';
  g.font = mono(22, 500);
  track(g, 4);
  g.textBaseline = 'middle';
  const unit = 'JAY KATARIYA  ✦  PORTFOLIO  ✦  ';
  const w = g.measureText(unit).width;
  for (let x = 14; x < c.width; x += w) g.fillText(unit, x, c.height / 2 + 1);
  return c;
}
