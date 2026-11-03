import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { bayerAt } from '../lib/dither';
import { onAppReady } from '../lib/appReady';

// A living 1-bit city: three skyline layers, a clock tower showing Lafayette
// time, a river of window light, a plane, small stars, a sun/moon that follows
// the theme — and birds. Click the sky and one flies out, lands on a free
// rooftop and stays. Scroll down and the whole flock lifts off; scroll back to
// the top and they swoop home. Every shape is drawn on a grid, so it stays crisp.

export interface CityHandle {
  sendBird: () => void;
}

interface CityCanvasProps {
  isDark: boolean;
  paused: boolean;
  onBirdsChange?: (n: number) => void;
}

const LAFAYETTE = 'America/Indiana/Indianapolis';

type Palette = {
  skyTop: string;
  skyBottom: string;
  glow: string;
  far: string;
  mid: string;
  near: string;
  roof: string;
  edge: string;
  window: string;
  warm: string;
  unlit: string;
  star: string;
  moon: string;
  halo: string;
  river: string;
  bank: string;
  reflect: string;
  bird: string;
  beak: string;
  ink: string;
  paper: string;
};

const paletteFor = (dark: boolean): Palette =>
  dark
    ? {
        skyTop: '#08080d',
        skyBottom: '#171726',
        glow: 'rgba(139,131,242,0.14)',
        far: '#1e1e27',
        mid: '#121218',
        near: '#060609',
        roof: '#1b1b23',
        edge: '#33333e',
        window: '#8b83f2',
        warm: '#f0eee9',
        unlit: '#20202a',
        star: '#f0eee9',
        moon: '#f0eee9',
        halo: '#8b83f2',
        river: '#07070b',
        bank: '#1a1a21',
        reflect: '#8b83f2',
        bird: '#f0eee9',
        beak: '#8b83f2',
        ink: '#0b0b0e',
        paper: '#f0eee9',
      }
    : {
        skyTop: '#faf9f6',
        skyBottom: '#efebe1',
        glow: 'rgba(74,67,196,0.09)',
        far: '#dcd7ca',
        mid: '#b3ada0',
        near: '#1b1a17',
        roof: '#2c2a23',
        edge: '#4c483d',
        window: '#4a43c4',
        warm: '#faf9f6',
        unlit: '#3a372e',
        star: '#767268',
        moon: '#4a43c4',
        halo: '#4a43c4',
        river: '#eae7e0',
        bank: '#c9c4b7',
        reflect: '#4a43c4',
        bird: '#4a43c4',
        beak: '#faf9f6',
        ink: '#1b1a17',
        paper: '#faf9f6',
      };

// The in-between palette: a warm dusk, so the theme change never passes
// through a flat grey. Light -> dusk -> dark, and the same coming back.
const DUSK: Palette = {
  skyTop: '#3a2133',
  skyBottom: '#a86b64',
  glow: 'rgba(255,150,120,0.20)',
  far: '#6b5660',
  mid: '#45333f',
  near: '#160f17',
  roof: '#2b2029',
  edge: '#523b47',
  window: '#b6a4ff',
  warm: '#ffe6c2',
  unlit: '#2a2130',
  star: '#ffe9cf',
  moon: '#ffe8cc',
  halo: '#ffb18f',
  river: '#281720',
  bank: '#4a2f3a',
  reflect: '#ffab8a',
  bird: '#ffe9cf',
  beak: '#9a8df5',
  ink: '#171018',
  paper: '#fff1dc',
};

const parseColor = (value: string): [number, number, number, number] | null => {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const [r, g, b, a] = rgba[1].split(',').map(Number);
    return [r, g, b, a ?? 1];
  }
  return null;
};

const mixColor = (a: string, b: string, t: number) => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return t < 0.5 ? a : b;
  const c = ca.map((value, i) => value + (cb[i] - value) * t);
  return `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
};

const blendPalette = (a: Palette, b: Palette, t: number): Palette => {
  const out = {} as Palette;
  (Object.keys(a) as (keyof Palette)[]).forEach((key) => {
    out[key] = mixColor(a[key], b[key], t);
  });
  return out;
};

const blendThroughDusk = (a: Palette, b: Palette, t: number): Palette =>
  t < 0.5 ? blendPalette(a, DUSK, t * 2) : blendPalette(DUSK, b, (t - 0.5) * 2);

type RoofType = 'flat' | 'step' | 'spire';

interface Bldg {
  x: number;
  y: number;
  w: number;
  h: number;
  layer: 0 | 1 | 2;
  roof: RoofType;
  antenna: number;
  tank: boolean;
}

interface Win {
  x: number;
  y: number;
  lit: boolean;
  warm: boolean;
  layer: 0 | 1 | 2;
  phase: number;
  base: number;
}

interface Star {
  x: number;
  y: number;
  phase: number;
  size: number;
}

interface Perch {
  x: number;
  y: number;
  taken: boolean;
}

interface Bird {
  state: 'flying' | 'perched' | 'leaving' | 'away';
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  perch: Perch | null;
  flap: number;
  dir: number;
  hop: number;
  nextIdle: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

interface Scene {
  cell: number;
  cols: number;
  rows: number;
  groundY: number;
  riverRows: number;
  far: Bldg[];
  mid: Bldg[];
  near: Bldg[];
  windows: Win[];
  stars: Star[];
  perches: Perch[];
  birds: Bird[];
  birdsAway: boolean;
  particles: Particle[];
  tower: { x: number; w: number; top: number };
  dome: { x: number; w: number; baseY: number; r: number };
  moon: { x: number; y: number; r: number };
  plane: { active: boolean; x: number; y: number; speed: number; next: number };
  shooting: { active: boolean; x: number; y: number; vx: number; vy: number; life: number; next: number };
  time: number;
  skyFromDark: boolean;
  skyToDark: boolean;
  skyT: number;
  flickerAt: number;
  cursor: number;
  clockH: number;
  clockM: number;
  clockKey: number;
}

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const lafayetteClock = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LAFAYETTE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  let h = 0;
  let m = 0;
  for (const p of parts) {
    if (p.type === 'hour') h = Number(p.value) % 24;
    if (p.type === 'minute') m = Number(p.value);
  }
  return { h, m };
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const cubic = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const FLAP_UP = [
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 0],
];
const FLAP_DOWN = [
  [0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
];
const PERCHED = [
  [0, 1, 1],
  [1, 1, 0],
];

function buildScene(w: number, h: number): Scene {
  const cell = w < 480 ? 4 : w < 900 ? 5 : w < 1600 ? 6 : 7;
  const cols = Math.max(44, Math.ceil(w / cell));
  const rows = Math.max(34, Math.ceil(h / cell));
  const riverRows = Math.max(4, Math.round(rows * 0.06));
  const groundY = rows - riverRows - 1;
  const maxH = Math.max(14, Math.round(rows * (w < 480 ? 0.37 : 0.42)));
  const rand = mulberry32(0x51ed270b ^ cols);
  const ri = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

  const towerW = 9;
  const towerX = Math.max(4, Math.min(cols - towerW - 4, Math.floor(cols * 0.14)));
  const towerTop = groundY - Math.round(maxH * 0.97);

  const domeW = Math.max(12, Math.min(18, Math.round(cols * 0.075)));
  const domeX = Math.max(4, Math.min(cols - domeW - 4, Math.floor(cols * 0.71)));
  const domeBaseY = groundY - Math.round(maxH * 0.34);
  const domeR = Math.max(5, Math.floor(domeW / 2) - 1);

  const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && a1 > b0;

  const far: Bldg[] = [];
  let x = -ri(2, 8);
  while (x < cols + 4) {
    const bw = ri(3, 7);
    const bh = ri(Math.round(maxH * 0.16), Math.round(maxH * 0.48));
    far.push({ x, y: groundY - bh, w: bw, h: bh, layer: 0, roof: 'flat', antenna: 0, tank: false });
    x += bw + (rand() < 0.35 ? 1 : 0);
  }

  const mid: Bldg[] = [];
  x = -ri(2, 9);
  while (x < cols + 5) {
    const bw = ri(4, 9);
    const bh = ri(Math.round(maxH * 0.28), Math.round(maxH * 0.64));
    mid.push({
      x,
      y: groundY - bh,
      w: bw,
      h: bh,
      layer: 1,
      roof: rand() < 0.16 ? 'step' : 'flat',
      antenna: rand() < 0.18 ? ri(2, 4) : 0,
      tank: rand() < 0.08,
    });
    x += bw + (rand() < 0.55 ? ri(0, 2) : 0);
  }

  const near: Bldg[] = [];
  x = -ri(3, 11);
  while (x < cols + 6) {
    const bw = ri(3, 8);
    const bh = ri(Math.round(maxH * 0.36), Math.round(maxH * 0.86));
    const inTower = overlaps(x, x + bw, towerX - 3, towerX + towerW + 4);
    const inDome = overlaps(x, x + bw, domeX - 3, domeX + domeW + 4);
    if (!inTower && !inDome) {
      near.push({
        x,
        y: groundY - bh,
        w: bw,
        h: bh,
        layer: 2,
        roof: rand() < 0.2 ? 'step' : rand() < 0.12 ? 'spire' : 'flat',
        antenna: rand() < 0.3 ? ri(2, 5) : 0,
        tank: rand() < 0.18,
      });
    }
    x += bw + (rand() < 0.4 ? ri(1, 3) : 0);
  }

  const perches: Perch[] = [];
  const seen = new Set<string>();
  const addPerch = (px: number, py: number) => {
    const k = `${px},${py}`;
    if (px < 4 || px >= cols - 5 || py < 6 || py > groundY - 2 || seen.has(k)) return;
    seen.add(k);
    perches.push({ x: px, y: py, taken: false });
  };

  for (const b of near) {
    if (b.x + b.w < 0 || b.x > cols) continue;
    addPerch(b.x + 1, b.y - 1);
    addPerch(b.x + b.w - 2, b.y - 1);
    if (b.roof === 'step') {
      const sw = Math.max(2, b.w - 3);
      addPerch(b.x + Math.floor((b.w - sw) / 2) + Math.floor(sw / 2), b.y - 5);
    }
    if (b.roof === 'spire') addPerch(b.x + Math.floor(b.w / 2), b.y - 8);
    if (b.antenna) addPerch(b.x + Math.floor(b.w / 2), b.y - b.antenna - 1);
  }
  for (const b of mid) {
    if (b.x + b.w < 0 || b.x > cols) continue;
    addPerch(b.x + 1, b.y - 1);
  }
  addPerch(towerX + 4, towerTop - 15);
  addPerch(towerX + 4, towerTop - 7);
  addPerch(domeX, domeBaseY - 1);
  addPerch(domeX + domeW - 1, domeBaseY - 1);
  addPerch(domeX + Math.round(domeW / 2), domeBaseY - domeR - 3);

  const blocked = (wx: number, wy: number) =>
    (wx >= towerX - 3 && wx <= towerX + towerW + 4 && wy >= towerTop - 8 && wy <= groundY) ||
    (wx >= domeX - 3 && wx <= domeX + domeW + 4 && wy >= domeBaseY - domeR - 3 && wy <= groundY);

  const windows: Win[] = [];
  const addWindows = (b: Bldg, rowStep: number, skip: number, litChance: number) => {
    for (let wy = b.y + 2; wy < groundY - 1; wy += rowStep) {
      for (let wx = b.x + 1; wx < b.x + b.w - 1; wx += 2) {
        if (rand() < skip || blocked(wx, wy)) continue;
        windows.push({
          x: wx,
          y: wy,
          lit: rand() < litChance,
          warm: rand() < (b.layer === 2 ? 0.09 : 0.04),
          layer: b.layer,
          phase: rand() * Math.PI * 2,
          base: 0.35 + rand() * 0.5,
        });
      }
    }
  };
  for (const b of near) addWindows(b, 2, 0.22, 0.5);
  for (const b of mid) addWindows(b, 3, 0.48, 0.38);
  for (const b of far) {
    const n = ri(1, 2);
    for (let i = 0; i < n; i++) {
      const wx = b.x + ri(1, Math.max(1, b.w - 2));
      const wy = b.y + ri(2, Math.max(2, b.h - 2));
      if (blocked(wx, wy)) continue;
      windows.push({
        x: wx,
        y: wy,
        lit: rand() < 0.5,
        warm: false,
        layer: 0,
        phase: rand() * 6.28,
        base: 0.2,
      });
    }
  }

  const stars: Star[] = Array.from({ length: Math.round(cols * 0.3) }, () => ({
    x: rand() * cols,
    y: rand() * Math.max(10, (groundY - maxH) * 0.96),
    phase: rand() * Math.PI * 2,
    size: rand() < 0.14 ? 3 : 2,
  }));

  const moon = {
    x: Math.round(cols * (w < 480 ? 0.745 : 0.815)),
    y: Math.round(rows * 0.145),
    r: Math.max(5, Math.min(8, Math.round(cols * 0.032))),
  };

  const clock = lafayetteClock();

  return {
    cell,
    cols,
    rows,
    groundY,
    riverRows,
    far,
    mid,
    near,
    windows,
    stars,
    perches,
    birds: [],
    birdsAway: false,
    particles: [],
    tower: { x: towerX, w: towerW, top: towerTop },
    dome: { x: domeX, w: domeW, baseY: domeBaseY, r: domeR },
    moon,
    plane: { active: false, x: 0, y: 0, speed: 0, next: 14 + rand() * 26 },
    shooting: { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, next: 20 + rand() * 35 },
    time: 0,
    skyFromDark: false,
    skyToDark: false,
    skyT: 1,
    flickerAt: 0.4,
    cursor: 0,
    clockH: clock.h,
    clockM: clock.m,
    clockKey: 0,
  };
}

export default forwardRef<CityHandle, CityCanvasProps>(function CityCanvas(
  { isDark, paused, onBirdsChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef(isDark);
  const pausedRef = useRef(paused);
  const cbRef = useRef({ onBirdsChange });
  const paintRef = useRef<() => void>(() => {});
  const startRef = useRef<() => void>(() => {});
  const stopRef = useRef<() => void>(() => {});
  const sendRef = useRef<() => void>(() => {});
  const beginSkyRef = useRef<() => void>(() => {});
  const syncScrollRef = useRef<(force?: boolean) => void>(() => {});

  darkRef.current = isDark;
  cbRef.current = { onBirdsChange };

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      stopRef.current();
      paintRef.current();
    } else {
      startRef.current();
      // if the page was paused mid-flight, match the flock to where the page is now
      syncScrollRef.current(true);
    }
  }, [paused]);

  useEffect(() => {
    darkRef.current = isDark;
    beginSkyRef.current();
    paintRef.current();
  }, [isDark]);

  useImperativeHandle(
    ref,
    () => ({
      sendBird: () => sendRef.current(),
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let scene: Scene | null = null;
    let running = false;
    let raf = 0;
    let last = 0;
    let inView = true;
    let disposed = false;
    // the first frame is painted straight away, but the loop waits until the loading
    // screen is gone so it doesn't burn frames underneath it
    let appReady = false;


    const pixel = (x: number, y: number, pw = 1, phh = 1, color = '#fff', alpha = 1) => {
      if (!scene) return;
      const s = scene;
      if (x + pw < 0 || y + phh < 0 || x > s.cols || y > s.rows) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x * s.cell), Math.round(y * s.cell), Math.ceil(pw * s.cell), Math.ceil(phh * s.cell));
    };

    const dot = (x: number, y: number, size: number, color: string, alpha = 1) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), size, size);
    };

    const lineCell = (x0: number, y0: number, x1: number, y1: number, color: string) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
      for (let i = 0; i <= n; i++) {
        pixel(Math.round(x0 + (dx * i) / n), Math.round(y0 + (dy * i) / n), 1, 1, color);
      }
    };

    const drawBird = (b: Bird, p: Palette) => {
      if (b.state === 'away') return;
      const cell = scene?.cell ?? 6;
      const airborne = b.state === 'flying' || b.state === 'leaving';
      const frame = airborne ? (Math.sin(b.flap) > 0 ? FLAP_UP : FLAP_DOWN) : PERCHED;
      const width = frame[0].length;
      const ox = Math.round(b.x) - Math.floor(width / 2);
      const oy = Math.round(b.y) - 1 - (b.hop > 0 ? 1 : 0);
      if (b.state === 'perched' && b.perch) {
        pixel(ox + 1, b.perch.y + 1, 3, 1, p.near, 0.4);
      }
      for (let r = 0; r < frame.length; r++) {
        for (let c = 0; c < width; c++) {
          if (!frame[r][c]) continue;
          const cx = b.dir < 0 ? width - 1 - c : c;
          pixel(ox + cx, oy + r, 1, 1, p.bird, airborne ? 0.96 : 1);
        }
      }
      if (b.state === 'perched') {
        const eyeX = (b.dir < 0 ? ox + 0.25 : ox + width - 1) * cell;
        dot(eyeX, (oy + 0.2) * cell, Math.max(1.4, cell * 0.28), p.ink, 0.9);
        const beakX = (b.dir < 0 ? ox - 1 : ox + width) * cell;
        dot(beakX, (oy + 0.75) * cell, Math.max(1.4, cell * 0.28), p.beak, 0.95);
      }
    };

    const drawBuilding = (b: Bldg, p: Palette) => {
      const body = b.layer === 0 ? p.far : b.layer === 1 ? p.mid : p.near;
      pixel(b.x, b.y, b.w, b.h, body);
      if (b.layer === 0) return;

      pixel(b.x, b.y, b.w, 1, b.layer === 2 ? p.roof : p.edge, b.layer === 2 ? 1 : 0.35);

      if (b.roof === 'step') {
        const sw = Math.max(2, b.w - 3);
        const sx = b.x + Math.floor((b.w - sw) / 2);
        pixel(sx, b.y - 4, sw, 4, body);
        pixel(sx, b.y - 4, sw, 1, b.layer === 2 ? p.roof : p.edge, b.layer === 2 ? 1 : 0.4);
      }
      if (b.roof === 'spire') {
        const cx = b.x + Math.floor(b.w / 2);
        pixel(cx, b.y - 6, 1, 6, body);
        pixel(cx, b.y - 7, 1, 1, p.window, 0.45 + 0.4 * Math.sin((scene ? scene.time : 0) * 3 + cx));
      }
      if (b.antenna) {
        const ax = b.x + Math.floor(b.w / 2);
        pixel(ax, b.y - b.antenna, 1, b.antenna, body);
        pixel(ax, b.y - b.antenna, 1, 1, p.window, 0.45 + 0.4 * Math.sin((scene ? scene.time : 0) * 3 + ax));
      }
      if (b.tank) {
        pixel(b.x + 2, b.y - 5, 4, 4, body);
        pixel(b.x + 1, b.y - 6, 6, 1, b.layer === 2 ? p.roof : p.edge, 0.8);
        pixel(b.x + 2, b.y - 4, 1, 1, p.unlit, 0.7);
      }
    };

    const draw = () => {
      const s = scene;
      if (!s) return;
      const eased = easeInOut(Math.min(1, s.skyT));
      const fromP = paletteFor(s.skyFromDark);
      const toP = paletteFor(s.skyToDark);
      const p = eased >= 1 ? toP : blendThroughDusk(fromP, toP, eased);
      const darkness =
        s.skyFromDark === s.skyToDark
          ? s.skyToDark
            ? 1
            : 0
          : s.skyFromDark
            ? 1 - eased
            : eased;
      const t = s.time;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, p.skyTop);
      sky.addColorStop(1, p.skyBottom);
      ctx.globalAlpha = 1;
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(w * 0.5, h * 0.7, 0, w * 0.5, h * 0.7, w * 0.62);
      glow.addColorStop(0, p.glow);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // stars — sub-cell dots keep the sky quiet
      for (const st of s.stars) {
        const tw = 0.28 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.85 + st.phase));
        const sx = st.x * s.cell + s.cell / 2 - st.size / 2;
        const sy = st.y * s.cell + s.cell / 2 - st.size / 2;
        dot(sx, sy, st.size, p.star, tw * (0.55 + darkness * 0.45));
      }

      // sun / moon — the old body sets down the right of a semicircle while the
      // new one rises up the left, so the theme change reads as a day turning
      const { x: mx, r } = s.moon;
      // clear of the fixed nav (plus the halo ring) — on short viewports the sky
      // band is thin, so the resting body would otherwise land on the nav links
      const my = Math.max(s.moon.y, Math.ceil(88 / s.cell) + r);
      const drawBody = (cx: number, cy: number, dark: boolean, alpha: number, pal: Palette) => {
        if (alpha <= 0.01) return;
        for (let y = -r - 5; y <= r + 5; y++) {
          for (let x = -r - 5; x <= r + 5; x++) {
            const d = Math.hypot(x, y);
            if (d > r + 1.5 && d < r + 5 && bayerAt(x + 9, y + 9) < 0.17) {
              pixel(cx + x, cy + y, 1, 1, pal.halo, 0.55 * alpha);
            }
          }
        }
        for (let y = -r; y <= r; y++) {
          for (let x = -r; x <= r; x++) {
            const d = x * x + y * y;
            if (d > r * r) continue;
            if (dark) {
              const ox = r * 0.52;
              const oy = -r * 0.16;
              if ((x - ox) * (x - ox) + (y - oy) * (y - oy) <= (r * 0.9) * (r * 0.9)) continue;
            }
            if (d > (r - 1.2) * (r - 1.2) && bayerAt(x + 8, y + 8) < 0.34) continue;
            pixel(cx + x, cy + y, 1, 1, pal.moon, 0.95 * alpha);
          }
        }
      };
      if (s.skyT >= 1) {
        drawBody(mx, my, s.skyToDark, 1, toP);
      } else {
        const arc = Math.max(4, Math.min(r * 3.2, s.cols * 0.17));
        const pivotY = my + arc;
        // one half of the circle, on the right: the old body sets down the
        // right edge while the new one rises back up the same edge. Keeps the
        // orbit clear of the name on narrow screens.
        const outAngle = -Math.PI / 2 + eased * Math.PI;
        const inAngle = Math.PI / 2 - eased * Math.PI;
        drawBody(
          mx + Math.cos(outAngle) * arc,
          pivotY + Math.sin(outAngle) * arc,
          s.skyFromDark,
          1 - eased,
          fromP,
        );
        drawBody(
          mx + Math.cos(inAngle) * arc,
          pivotY + Math.sin(inAngle) * arc,
          s.skyToDark,
          eased,
          toP,
        );
      }

      if (s.shooting.active) {
        for (let i = 0; i < 5; i++) {
          const k = i / 5;
          pixel(s.shooting.x - s.shooting.vx * k * 0.05, s.shooting.y - s.shooting.vy * k * 0.05, 1, 1, p.star, Math.max(0, 0.65 - k * 0.13));
        }
      }

      if (s.plane.active) {
        const px = Math.round(s.plane.x);
        const py = Math.round(s.plane.y);
        pixel(px, py, 2, 1, p.bird, 0.62);
        pixel(px + 2, py - 1, 1, 1, p.bird, 0.62);
        pixel(px + 3, py, 1, 1, p.bird, 0.62);
        pixel(px + 5, py, 1, 1, p.window, Math.sin(t * 9) > 0 ? 0.95 : 0.08);
        pixel(px - 1, py, 1, 1, p.star, 0.16);
        pixel(px - 2, py, 1, 1, p.star, 0.1);
      }

      // three layers, back to front
      for (const b of s.far) drawBuilding(b, p);
      for (const win of s.windows) {
        if (win.layer !== 0 || !win.lit) continue;
        pixel(win.x, win.y, 1, 1, p.window, 0.16 + 0.1 * Math.sin(t + win.phase));
      }

      for (const b of s.mid) drawBuilding(b, p);
      for (const win of s.windows) {
        if (win.layer !== 1) continue;
        if (!win.lit) {
          pixel(win.x, win.y, 1, 1, p.unlit, 0.35);
          continue;
        }
        pixel(win.x, win.y, 1, 1, win.warm ? p.warm : p.window, win.base * 0.6);
      }

      for (const b of s.near) drawBuilding(b, p);
      for (const win of s.windows) {
        if (win.layer !== 2) continue;
        if (!win.lit) {
          pixel(win.x, win.y, 1, 1, p.unlit, 0.55);
          continue;
        }
        const a = Math.min(0.96, win.base * (0.72 + 0.28 * Math.sin(t * 0.8 + win.phase)));
        pixel(win.x, win.y, 1, 1, win.warm ? p.warm : p.window, a);
      }

      // clock tower
      const tw = s.tower;
      pixel(tw.x - 1, s.groundY - 8, tw.w + 2, 8, p.near);
      pixel(tw.x - 1, s.groundY - 8, tw.w + 2, 1, p.roof);
      pixel(tw.x - 1, s.groundY - 8, 1, 8, p.edge, 0.45);
      pixel(tw.x + 2, tw.top + 9, tw.w - 4, s.groundY - tw.top - 17, p.near);
      pixel(tw.x + 2, tw.top + 9, 1, s.groundY - tw.top - 17, p.edge, 0.28);
      pixel(tw.x, tw.top, tw.w, 9, p.near);
      pixel(tw.x, tw.top, tw.w, 1, p.roof);
      pixel(tw.x - 1, tw.top + 9, tw.w + 2, 1, p.edge, 0.55);
      for (let i = 0; i < 6; i++) {
        pixel(tw.x + 4 - i, tw.top - 6 + i, 1 + i * 2, 1, p.near);
      }
      pixel(tw.x + 4, tw.top - 15, 1, 9, p.edge, 0.75);
      pixel(tw.x + 4, tw.top - 16, 1, 1, p.window, 0.55 + 0.4 * Math.sin(t * 3));
      const fx = tw.x + 1;
      const fy = tw.top + 1;
      pixel(fx, fy, 7, 7, p.paper);
      const fcx = (fx + 3.5) * s.cell;
      const fcy = (fy + 3.5) * s.cell;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 1;
      ctx.strokeRect(fx * s.cell + 0.5, fy * s.cell + 0.5, 7 * s.cell - 1, 7 * s.cell - 1);
      ctx.fillStyle = p.ink;
      for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        ctx.fillRect(
          Math.round(fcx + Math.cos(a) * s.cell * 3.15 - 1),
          Math.round(fcy + Math.sin(a) * s.cell * 3.15 - 1),
          2,
          2,
        );
      }
      const hAng = (((s.clockH % 12) + s.clockM / 60) * Math.PI) / 6 - Math.PI / 2;
      const mAng = (s.clockM * Math.PI) / 30 - Math.PI / 2;
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = Math.max(1.4, s.cell * 0.24);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fcx, fcy);
      ctx.lineTo(fcx + Math.cos(hAng) * s.cell * 1.8, fcy + Math.sin(hAng) * s.cell * 1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fcx, fcy);
      ctx.lineTo(fcx + Math.cos(mAng) * s.cell * 2.9, fcy + Math.sin(mAng) * s.cell * 2.9);
      ctx.stroke();
      ctx.fillStyle = p.ink;
      ctx.beginPath();
      ctx.arc(fcx, fcy, Math.max(1, s.cell * 0.26), 0, Math.PI * 2);
      ctx.fill();
      for (let wy = tw.top + 12; wy < s.groundY - 5; wy += 4) {
        if ((wy + tw.x) % 3 !== 0) pixel(tw.x + 4, wy, 1, 1, p.window, 0.4 + 0.18 * Math.sin(t * 0.7 + wy));
      }

      // dome
      const dm = s.dome;
      const dcx = dm.x + Math.round(dm.w / 2);
      pixel(dm.x, dm.baseY, dm.w, Math.max(1, s.groundY - dm.baseY), p.near);
      pixel(dm.x, dm.baseY, dm.w, 1, p.roof);
      pixel(dm.x, dm.baseY, 1, s.groundY - dm.baseY, p.edge, 0.4);
      pixel(dm.x + dm.w - 1, dm.baseY, 1, s.groundY - dm.baseY, p.edge, 0.4);
      for (let i = 0; i <= dm.r; i++) {
        const half = Math.round(Math.sqrt(Math.max(0, dm.r * dm.r - i * i)));
        pixel(dcx - half, dm.baseY - i, half * 2, 1, p.near);
        if (half > 1) {
          pixel(dcx - half, dm.baseY - i, 1, 1, p.edge, 0.5);
          pixel(dcx + half - 1, dm.baseY - i, 1, 1, p.edge, 0.5);
        }
      }
      pixel(dcx, dm.baseY - dm.r - 2, 1, 2, p.edge);
      for (let k = 0; k < 3; k++) {
        pixel(dm.x + 3 + k * 4, dm.baseY + 3, 2, 4, p.window, 0.32 + 0.22 * Math.sin(t * 0.6 + k));
      }

      // river
      pixel(0, s.groundY + 1, s.cols, s.riverRows, p.river);
      pixel(0, s.groundY, s.cols, 1, p.bank);
      for (let i = 0; i < 90; i++) {
        const rx = (i * 37) % s.cols;
        const ry = s.groundY + 2 + ((i * 13) % Math.max(1, s.riverRows - 1));
        const a = 0.07 + 0.11 * (0.5 + 0.5 * Math.sin(t * 1.1 + i));
        pixel(rx + Math.sin(t * 0.7 + i) * 1.5, ry, 2, 1, p.reflect, a);
      }

      for (const b of s.birds) drawBird(b, p);
      for (const pt of s.particles) {
        pixel(pt.x, pt.y, 1, 1, pt.color, Math.max(0, pt.life / pt.max));
      }

      ctx.globalAlpha = 1;
    };

    const burst = (x: number, y: number, n: number) => {
      const s = scene;
      if (!s) return;
      const color = darkRef.current ? '#8b83f2' : '#4a43c4';
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 1 + Math.random() * 3;
        s.particles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 1,
          life: 0.5 + Math.random() * 0.3,
          max: 0.8,
          color,
        });
      }
      if (s.particles.length > 50) s.particles.splice(0, s.particles.length - 50);
    };

    const spawn = (px?: number, py?: number, user = false) => {
      const s = scene;
      if (!s) return;
      const free = s.perches.filter((p) => !p.taken);
      if (free.length === 0) return;
      const from = {
        x: px ?? s.cols * (0.18 + Math.random() * 0.64),
        y: py ?? s.rows * (0.14 + Math.random() * 0.18),
      };
      free.sort(
        (a, b) =>
          Math.abs(a.x - from.x) + Math.abs(a.y - from.y) - (Math.abs(b.x - from.x) + Math.abs(b.y - from.y)),
      );
      const perch = free[Math.floor(Math.random() * Math.min(4, free.length))];
      perch.taken = true;
      const to = { x: perch.x, y: perch.y - 1 };
      const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 7;
      const midY = Math.min(from.y, to.y) - (7 + Math.random() * 11);
      const isPaused = pausedRef.current;
      const bird: Bird = {
        state: isPaused ? 'perched' : 'flying',
        x: isPaused ? to.x : from.x,
        y: isPaused ? to.y : from.y,
        fromX: from.x,
        fromY: from.y,
        c1x: from.x + (midX - from.x) * 0.35,
        c1y: from.y + (midY - from.y) * 0.8,
        c2x: to.x + (midX - to.x) * 0.35,
        c2y: to.y + (midY - to.y) * 0.8,
        tx: to.x,
        ty: to.y,
        t: isPaused ? 1 : 0,
        dur: 900 + Math.random() * 700,
        perch,
        flap: Math.random() * Math.PI * 2,
        dir: from.x <= to.x ? 1 : -1,
        hop: 0,
        nextIdle: s.time + 2 + Math.random() * 4,
      };
      s.birds.push(bird);
      while (s.birds.length > 20) {
        const old = s.birds.shift();
        if (old?.perch) old.perch.taken = false;
      }
      if (!isPaused) burst(from.x, from.y, user ? 6 : 0);
      cbRef.current.onBirdsChange?.(s.birds.length);
      if (pausedRef.current) draw();
    };

    const seed = (count: number) => {
      const s = scene;
      if (!s) return;
      const picks = [...s.perches].sort(() => Math.random() - 0.5).slice(0, count);
      for (const perch of picks) {
        perch.taken = true;
        s.birds.push({
          state: 'perched',
          x: perch.x,
          y: perch.y - 1,
          fromX: perch.x,
          fromY: perch.y - 1,
          c1x: perch.x,
          c1y: perch.y - 1,
          c2x: perch.x,
          c2y: perch.y - 1,
          tx: perch.x,
          ty: perch.y - 1,
          t: 1,
          dur: 1,
          perch,
          flap: 0,
          dir: Math.random() < 0.5 ? 1 : -1,
          hop: 0,
          nextIdle: s.time + 2 + Math.random() * 5,
        });
      }
      cbRef.current.onBirdsChange?.(s.birds.length);
    };

    const step = (dt: number) => {
      const s = scene;
      if (!s) return;
      s.time += dt;
      if (s.skyT < 1) s.skyT = Math.min(1, s.skyT + dt / 1.25);

      const minuteKey = Math.floor(Date.now() / 60000);
      if (minuteKey !== s.clockKey) {
        s.clockKey = minuteKey;
        const clock = lafayetteClock();
        s.clockH = clock.h;
        s.clockM = clock.m;
      }

      if (s.time > s.flickerAt) {
        s.flickerAt = s.time + 0.18 + Math.random() * 0.45;
        const n = s.windows.length;
        if (n) {
          for (let k = 0; k < 2; k++) {
            const win = s.windows[s.cursor++ % n];
            if (win.layer === 0) continue;
            win.lit = !win.lit;
          }
        }
      }

      const pl = s.plane;
      if (!pl.active && s.time > pl.next) {
        pl.active = true;
        pl.x = -8;
        pl.y = Math.round(s.rows * (0.07 + Math.random() * 0.2));
        pl.speed = s.cols / (9 + Math.random() * 4);
      }
      if (pl.active) {
        pl.x += pl.speed * dt;
        if (pl.x > s.cols + 10) {
          pl.active = false;
          pl.next = s.time + 28 + Math.random() * 40;
        }
      }

      const sh = s.shooting;
      if (!sh.active && s.time > sh.next) {
        sh.active = true;
        sh.x = s.cols * (0.08 + Math.random() * 0.5);
        sh.y = s.rows * (0.05 + Math.random() * 0.16);
        sh.vx = s.cols * (0.6 + Math.random() * 0.4);
        sh.vy = s.rows * (0.18 + Math.random() * 0.16);
        sh.life = 0.85;
      }
      if (sh.active) {
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.life -= dt;
        if (sh.life <= 0) {
          sh.active = false;
          sh.next = s.time + 20 + Math.random() * 32;
        }
      }

      for (const b of s.birds) {
        if (b.state === 'flying' || b.state === 'leaving') {
          b.t += (dt * 1000) / b.dur;
          b.flap += dt * (b.state === 'leaving' ? 30 : 26);
          if (b.t >= 1) {
            b.t = 1;
            b.x = b.tx;
            b.y = b.ty;
            if (b.state === 'leaving') {
              b.state = 'away';
            } else {
              b.state = 'perched';
              b.perch && (b.perch.taken = true);
              b.nextIdle = s.time + 1.6 + Math.random() * 4;
              if (!pausedRef.current) burst(b.x, b.y, 3);
            }
          } else {
            const e = easeInOut(b.t);
            b.x = cubic(b.fromX, b.c1x, b.c2x, b.tx, e);
            b.y = cubic(b.fromY, b.c1y, b.c2y, b.ty, e);
          }
        } else if (b.state === 'perched') {
          if (b.hop > 0) b.hop = Math.max(0, b.hop - dt);
          if (s.time > b.nextIdle) {
            b.hop = 0.24;
            if (Math.random() < 0.5) b.dir *= -1;
            b.nextIdle = s.time + 2 + Math.random() * 5;
          }
        }
      }

      for (const pt of s.particles) {
        pt.life -= dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 3 * dt;
      }
      s.particles = s.particles.filter((pt) => pt.life > 0);
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw();
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !appReady || !scene || pausedRef.current || !inView || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Scroll takes the flock with it: scrolling down lifts every perched (or
    // arriving) bird out of the skyline; scrolling back toward the top brings
    // them in from above to their own perches. Perches stay reserved while the
    // birds are away, so the count never jumps around.
    // takeoff sits well below the return line, so a direction change (trackpad
    // momentum, iOS bounce) between the two can't flip the flock back and forth
    const takeoffAt = () => Math.max(64, window.innerHeight * 0.1);
    const returnAt = () => Math.max(24, window.innerHeight * 0.03);
    const takeOff = () => {
      const s = scene;
      if (!s || s.birdsAway || pausedRef.current) return;
      s.birdsAway = true;
      for (const b of s.birds) {
        if (b.state === 'away' || b.state === 'leaving') continue;
        const drift = (Math.random() - 0.5) * Math.max(6, s.cols * 0.14);
        const toX = Math.max(-4, Math.min(s.cols + 4, b.x + drift));
        const toY = -6 - Math.random() * 5;
        b.state = 'leaving';
        b.fromX = b.x;
        b.fromY = b.y;
        b.c1x = b.x + drift * 0.2;
        b.c1y = b.y - s.rows * (0.12 + Math.random() * 0.1);
        b.c2x = toX;
        b.c2y = toY + s.rows * (0.14 + Math.random() * 0.1);
        b.tx = toX;
        b.ty = toY;
        b.t = 0;
        b.dur = 900 + Math.random() * 650;
        b.hop = 0;
        if (Math.abs(drift) > 1) b.dir = drift > 0 ? 1 : -1;
      }
      start();
    };

    const land = () => {
      const s = scene;
      if (!s || !s.birdsAway || pausedRef.current) return;
      s.birdsAway = false;
      for (const b of s.birds) {
        if (b.state !== 'away' && b.state !== 'leaving') continue;
        const perch = b.perch;
        if (!perch) {
          b.state = 'away';
          continue;
        }
        const from = { x: b.x, y: b.y };
        const to = { x: perch.x, y: perch.y - 1 };
        const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 8;
        const midY = Math.min(from.y, to.y) - (6 + Math.random() * 9);
        b.state = 'flying';
        b.fromX = from.x;
        b.fromY = from.y;
        b.c1x = from.x + (midX - from.x) * 0.4;
        b.c1y = from.y + (midY - from.y) * 0.8;
        b.c2x = to.x + (midX - to.x) * 0.35;
        b.c2y = to.y + (midY - to.y) * 0.8;
        b.tx = to.x;
        b.ty = to.y;
        b.t = 0;
        b.dur = 1000 + Math.random() * 700;
        b.dir = from.x <= to.x ? 1 : -1;
        b.flap = Math.random() * Math.PI * 2;
        perch.taken = true;
      }
      start();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      const ndpr = Math.min(window.devicePixelRatio || 1, 2);
      if (nw === w && nh === h && ndpr === dpr && scene) return;
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const prev = scene ? Math.min(scene.birds.length, 10) : 3;
      stop();
      scene = buildScene(w, h);
      scene.skyFromDark = darkRef.current;
      scene.skyToDark = darkRef.current;
      scene.skyT = 1;
      seed(prev);
      // a fresh scene starts with the flock perched; match it to where the page is
      syncScrollRef.current(true);
      draw();
      start();
    };

    const beginSky = () => {
      const s = scene;
      if (!s) return;
      const target = darkRef.current;
      if (s.skyToDark === target && s.skyT >= 1) return;
      s.skyFromDark = s.skyToDark;
      s.skyToDark = target;
      s.skyT = pausedRef.current ? 1 : 0;
      if (!pausedRef.current) start();
    };

    const onClick = (e: MouseEvent) => {
      if (!scene) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * scene.cols;
      const y = ((e.clientY - rect.top) / rect.height) * scene.rows;
      spawn(x, y, true);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    let lastScrollY = window.scrollY;
    let scrollFrame = 0;
    const syncScroll = (force = false) => {
      const y = window.scrollY;
      const down = y > lastScrollY + 0.5;
      const up = y < lastScrollY - 0.5;
      lastScrollY = y;
      if (pausedRef.current || !scene) return;
      if (force) {
        if (y < returnAt() && scene.birdsAway) land();
        else if (y > takeoffAt() && inView && !scene.birdsAway) takeOff();
        return;
      }
      if (down && inView && y > takeoffAt() && !scene.birdsAway) takeOff();
      else if (up && y < returnAt() && scene.birdsAway) land();
    };
    syncScrollRef.current = syncScroll;
    const onScroll = () => {
      // a modal's body scroll lock jumps scrollY to 0 and back; that isn't the reader scrolling
      if (document.documentElement.hasAttribute('data-scroll-locked')) return;
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        if (!disposed) syncScroll();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    // rebuilding the scene is costly, so wait for the window to settle
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      if (disposed) return;
      if (!scene) return resize();
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => !disposed && resize(), 150);
    });
    ro.observe(canvas);

    // moving to a screen with a different pixel density changes no box size, so
    // the ResizeObserver never fires; listen for the density itself
    let dprQuery: MediaQueryList | null = null;
    const onDpr = () => {
      dprQuery?.removeEventListener('change', onDpr);
      if (disposed) return;
      resize();
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDpr);
    };
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', onDpr);

    canvas.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);

    paintRef.current = draw;
    startRef.current = start;
    stopRef.current = stop;
    sendRef.current = () => spawn(undefined, undefined, true);
    beginSkyRef.current = beginSky;

    resize();
    syncScroll(true);
    const offReady = onAppReady(() => {
      appReady = true;
      start();
    });

    return () => {
      disposed = true;
      offReady();
      clearTimeout(resizeTimer);
      dprQuery?.removeEventListener('change', onDpr);
      stop();
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollFrame);
      paintRef.current = () => {};
      startRef.current = () => {};
      stopRef.current = () => {};
      sendRef.current = () => {};
      beginSkyRef.current = () => {};
      syncScrollRef.current = () => {};
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-cursor-hover
      className="absolute inset-0 h-full w-full touch-pan-y"
    />
  );
});
