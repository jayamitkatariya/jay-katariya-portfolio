import { memo, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { bayerAt } from '../lib/dither';
import { projects } from '../data/projects';
import { BADGE_INK, STAR } from './portfolio/badgeRig';

// The portfolio ID badge, flattened for the loading screen: the canvas artwork from
// cardFace.ts front redrawn as SVG, hung on CSS straps and dropped in with
// springs. No three.js, physics, QR or canvas work, so it's ready on the first frame.
// Sizes live in index.css (.loader-badge) in badgeRig's world units (--u).

const { paper, ink, muted, rule, accent, live } = BADGE_INK;
const W = 1024; // same art board as cardFace (CARD_W × CARD_H)
const H = 1440;
const COUNT = String(projects.length);
const DELAY = 0.06; // let the cover paint before anything moves

// ── artwork, built once ──

/** Pixel rows as one path, horizontal runs merged so it stays a few hundred segments. */
function cellsPath(cols: number, rows: number, cell: number, x0: number, y0: number, on: (x: number, y: number) => boolean) {
  let d = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!on(x, y)) continue;
      let run = 1;
      while (x + run < cols && on(x + run, y)) run++;
      d += `M${x0 + x * cell} ${y0 + y * cell}h${run * cell}v${cell}h${-run * cell}z`;
      x += run - 1;
    }
  }
  return d;
}

const starPath = (x: number, y: number, cell: number) => cellsPath(8, 8, cell, x, y, (c, r) => STAR[r][c] === '#');

// ordered dither rising from the bottom of a band, coarser than the canvas so it reads at loader size
const ditherPath = (y0: number, h: number, cell: number, curve: (t: number) => number) => {
  const rows = Math.ceil(h / cell);
  return cellsPath(W / cell, rows, cell, 0, y0, (x, y) => curve(y / rows) > bayerAt(x, y));
};

// passport guilloche: interleaved sine ribbons (cardFace's guilloche, at half the sampling)
const GUILLOCHE = (() => {
  const top = 790;
  const bottom = 1030;
  const mid = (top + bottom) / 2;
  const amp = (bottom - top) / 2 - 6;
  let d = '';
  for (let k = 0; k < 16; k++) {
    const phase = (k / 16) * Math.PI * 2;
    for (let x = 0; x <= W; x += 8) {
      const t = x / W;
      const y = mid + amp * Math.sin(t * Math.PI * 5 + phase) * (0.55 + 0.45 * Math.cos(t * Math.PI * 2 + phase * 0.5));
      d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
    }
  }
  return d;
})();

// photoDuotone's levels + soft S-curve, as feComponentTransfer tables (ink → paper)
const DUOTONE = (() => {
  const lo = [34, 32, 30];
  const hi = [236, 233, 226];
  const curve = Array.from({ length: 17 }, (_, i) => {
    const l = Math.min(1, Math.max(0, (i / 16 - 0.08) / 0.84));
    return 0.6 * l + 0.4 * l * l * (3 - 2 * l);
  });
  return lo.map((v, k) => curve.map(f => ((v + (hi[k] - v) * f) / 255).toFixed(3)).join(' '));
})();

const FRONT_PANEL = ditherPath(1064, 376, 16, t => t ** 1.6 * 0.85);

const mono = (size: number, weight = 400) => `${weight} ${size}px "JetBrains Mono", monospace`;
const sans = (size: number, weight = 500) => `${weight} ${size}px Inter, sans-serif`;

const FIELDS: [string, string][] = [
  ['role', 'builder'],
  ['school', 'purdue · ibe'],
  ['projects', COUNT.padStart(2, '0')],
  ['status', 'building'],
];

function FrontFace() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
      <defs>
        <clipPath id="lb-photo">
          <rect x={72} y={244} width={400} height={500} rx={18} />
        </clipPath>
        <filter id="lb-duotone" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={1.2} />
          <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={DUOTONE[0]} />
            <feFuncG type="table" tableValues={DUOTONE[1]} />
            <feFuncB type="table" tableValues={DUOTONE[2]} />
          </feComponentTransfer>
        </filter>
      </defs>

      <rect width={W} height={H} fill={paper} />
      <path d={GUILLOCHE} fill="none" stroke="#e6e2d8" strokeWidth={2} />

      {/* header */}
      <path d={starPath(72, 124, 4)} fill={accent} />
      <text x={124} y={154} fill={ink} style={{ font: mono(28, 500), letterSpacing: 5 }}>PORTFOLIO PASS</text>
      <text x={952} y={154} fill={muted} textAnchor="end" style={{ font: mono(26), letterSpacing: 2 }}>
        № {COUNT.padStart(4, '0')}
      </text>
      <rect x={72} y={196} width={880} height={2} fill={rule} />

      {/* photo: paper-toned slot underneath, so a slow image just develops in */}
      <rect x={72} y={244} width={400} height={500} rx={18} fill="#e8e5de" />
      <image
        href="/idpic.jpg"
        x={72}
        y={244}
        width={400}
        height={500}
        preserveAspectRatio="xMidYMid slice"
        clipPath="url(#lb-photo)"
        filter="url(#lb-duotone)"
      />
      <rect x={73} y={245} width={398} height={498} rx={17} fill="none" stroke="rgba(20,20,20,0.12)" strokeWidth={2} />

      {/* fields */}
      {FIELDS.map(([label, value], i) => {
        const y = 274 + i * 124;
        const status = label === 'status';
        return (
          <g key={label}>
            <text x={528} y={y} fill={muted} style={{ font: mono(20, 500), letterSpacing: 4 }}>
              {label.toUpperCase()}
            </text>
            {/* static on purpose: animating anything inside this SVG repaints the whole face every frame */}
            {status && (
              <g>
                <circle cx={538} cy={y + 38} r={15} fill="rgba(16,185,129,0.18)" />
                <circle cx={538} cy={y + 38} r={8} fill={live} />
              </g>
            )}
            <text x={status ? 566 : 528} y={y + 52} fill={ink} style={{ font: sans(40, 400), letterSpacing: -0.5 }}>
              {value}
            </text>
          </g>
        );
      })}

      {/* name */}
      <text x={68} y={912} fill={ink} style={{ font: sans(132), letterSpacing: -5 }}>jay katariya</text>
      <text x={72} y={970} fill={muted} style={{ font: mono(26) }}>integrated business &amp; engineering</text>
      <text x={72} y={1010} fill={muted} style={{ font: mono(26) }}>purdue university</text>

      {/* ink panel */}
      <rect y={1064} width={W} height={H - 1064} fill={ink} />
      <path d={FRONT_PANEL} fill="#242424" />
      <text x={72} y={1150} fill={paper} style={{ font: sans(38), letterSpacing: -1 }}>jaykatariya.com</text>
      <text x={72} y={1192} fill={muted} style={{ font: mono(20, 500), letterSpacing: 3 }}>ACCESS GRANTED  →</text>
      <g fill="#cfcabf" style={{ font: mono(27, 500), letterSpacing: 3 }}>
        <text x={72} y={1318}>{'PP<JK<<KATARIYA<<JAY<<<<<<<'}</text>
        <text x={72} y={1362}>{`${COUNT.padStart(4, '0')}<BUILDER<PURDUE<IBE<<26`}</text>
      </g>
      {/* the real card has a QR here; the loader gets the emblem instead of shipping a QR encoder */}
      <rect x={728} y={1140} width={224} height={224} rx={16} fill={paper} />
      <path d={starPath(776, 1188, 16)} fill={accent} />

      {/* hairline inside the die-cut */}
      <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={54.4} fill="none" stroke="rgba(20,20,20,0.10)" strokeWidth={3} />
    </svg>
  );
}

/** Holographic seal: a slowly turning pastel foil under the printed rim, legend and star. */
function Seal() {
  const legend = 'VERIFIED · BUILDER · 2026 · ';
  const r = 95.4; // h * 0.745 in a 256 box, like drawSealInk
  return (
    <div className="absolute rounded-full overflow-hidden" style={{ left: '37.89%', top: '46.11%', width: '12.5%', aspectRatio: '1' }}>
      <div className="loader-holo absolute inset-0" />
      <svg viewBox="0 0 256 256" className="absolute inset-0 w-full h-full">
        <defs>
          <path id="lb-legend" d={`M128 ${128 - r}a${r} ${r} 0 1 1 -0.01 0`} />
        </defs>
        <g fill="none" stroke="rgba(20,20,20,0.55)" strokeWidth={3}>
          <circle cx={128} cy={128} r={119} />
          <circle cx={128} cy={128} r={72} />
        </g>
        <text fill="rgba(20,20,20,0.7)" style={{ font: mono(21.8, 500) }}>
          <textPath href="#lb-legend" textLength={2 * Math.PI * r} lengthAdjust="spacing">{legend}</textPath>
        </text>
        <path d={starPath(88, 88, 10)} fill="rgba(20,20,20,0.8)" />
      </svg>
    </div>
  );
}

const STRAP_TEXT = 'JAY KATARIYA  ✦  PORTFOLIO  ✦  '.repeat(14);

// Each motion layer animates the whole `transform` property (not x / rotate), which motion
// hands to WAAPI with springs baked into linear() easing: the compositor runs them, so the
// drop stays smooth while the page mounts behind the cover. Every variant names its value,
// or motion would return it to the 'drop' pose on the way out.

// pendulum: falls in tilted (the 3D card spawns off to one side) and swings through the catch
const SWING: Variants = {
  drop: { transform: 'rotate(10deg)' },
  hang: { transform: 'rotate(0deg)', transition: { type: 'spring', visualDuration: 0.75, bounce: 0.55, delay: DELAY + 0.18 } },
  gone: { transform: 'rotate(0deg)', transition: { duration: 0.2 } },
};
// card: the 3D badge's twist, turning in from edge-on to face you. It stays short of 90° (even
// at the spring's overshoot), so the card never shows a back face: no black flip, and nothing
// rides on backface-visibility, which WebKit doesn't always honour on composited layers
const TWIST: Variants = {
  drop: { transform: 'rotateY(-78deg)' },
  hang: { transform: 'rotateY(0deg)', transition: { type: 'spring', visualDuration: 0.6, bounce: 0.25, delay: DELAY } },
  gone: { transform: 'rotateY(0deg)' }, // stays face-on while it's yanked out
};

function LoaderBadge({ present }: { present: boolean }) {
  // Drop: falls a full screen, catches on the strap, and on the way out is yanked back up after
  // a short tug down. A screen's height clears the card at any size.
  const [drop] = useState<Variants>(() => {
    const lift = `translateY(${-window.innerHeight}px)`;
    return {
      drop: { transform: lift },
      hang: { transform: 'translateY(0px)', transition: { type: 'spring', visualDuration: 0.5, bounce: 0.28, delay: DELAY } },
      gone: {
        transform: ['translateY(0px)', 'translateY(14px)', lift],
        transition: { duration: 0.38, times: [0, 0.2, 1], ease: ['easeOut', [0.55, 0, 0.9, 0.35]] },
      },
    };
  });

  return (
    <motion.div
      className="loader-badge loader-badge--motion"
      variants={SWING}
      initial="drop"
      animate={present ? 'hang' : 'gone'}
    >
      <motion.div className="loader-badge__drop" variants={drop}>
        {([-1, 1] as const).map(side => (
          <div key={side} className="loader-strap" style={{ left: `calc(50% + var(--u) * ${side * 0.05})`, rotate: `${side * 27}deg` }}>
            <span>{STRAP_TEXT}</span>
          </div>
        ))}

        {/* ring + crimp, fixed to the straps; world units, y up from the card's top edge */}
        <svg
          viewBox="-0.2 -0.45 0.4 0.45"
          className="absolute overflow-visible"
          style={{ left: 'calc(50% - var(--u) * 0.2)', top: 'calc(var(--u) * -0.45)', width: 'calc(var(--u) * 0.4)', height: 'calc(var(--u) * 0.45)' }}
        >
          <defs>
            <linearGradient id="lb-metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a3a3a" />
              <stop offset="1" stopColor="#161616" />
            </linearGradient>
            <linearGradient id="lb-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#a3a3a0" />
              <stop offset="1" stopColor="#4a4a48" />
            </linearGradient>
          </defs>
          <circle cx={0} cy={-0.185} r={0.07} fill="none" stroke="url(#lb-ring)" strokeWidth={0.034} />
          <rect x={-0.11} y={-0.375} width={0.22} height={0.13} rx={0.02} fill="url(#lb-metal)" />
        </svg>

        <div className="absolute inset-0" style={{ perspective: 'calc(var(--cw) * 6)' }}>
          <motion.div variants={TWIST} className="relative w-full h-full">
            <div className="loader-face">
              <FrontFace />
              <Seal />
              <div className="loader-sheen" />
            </div>
            {/* clamp rides with the card, so it turns with it */}
            <div
              className="absolute rounded-[calc(var(--u)*0.025)]"
              style={{
                left: 'calc(50% - var(--u) * 0.16)',
                top: 'calc(var(--u) * -0.1)',
                width: 'calc(var(--u) * 0.32)',
                height: 'calc(var(--u) * 0.16)',
                background: 'linear-gradient(#3a3a3a, #161616)',
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// the loader re-renders on every typed letter; the card doesn't need to
export default memo(LoaderBadge);
