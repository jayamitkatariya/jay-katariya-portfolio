import { useState, useMemo, useEffect, useRef, type CSSProperties } from 'react';
import { prefersReducedMotion } from '../lib/dither';

type Region = 'home' | 'us' | 'europe' | 'singapore' | 'mauritius';

interface MapLocation {
  name: string;
  context: string;
  lat: number;
  lng: number;
  color: string;
  category: 'live' | 'study' | 'visited';
  region: Region;
}

const LOCATIONS: MapLocation[] = [
  { name: 'pune', context: 'hometown', lat: 18.52, lng: 73.86, color: '#f59e0b', category: 'live', region: 'home' },
  { name: 'west lafayette', context: 'purdue university', lat: 40.43, lng: -86.91, color: '#818cf8', category: 'study', region: 'us' },
  { name: 'mauritius', context: 'traveled', lat: -20.35, lng: 57.55, color: '#22d3ee', category: 'visited', region: 'mauritius' },
  { name: 'singapore', context: 'traveled', lat: 1.35, lng: 103.82, color: '#22d3ee', category: 'visited', region: 'singapore' },
  { name: 'switzerland', context: 'traveled', lat: 46.82, lng: 8.23, color: '#22d3ee', category: 'visited', region: 'europe' },
  { name: 'spain', context: 'traveled', lat: 40.46, lng: -3.75, color: '#22d3ee', category: 'visited', region: 'europe' },
  { name: 'los angeles', context: 'traveled', lat: 34.05, lng: -118.24, color: '#22d3ee', category: 'visited', region: 'us' },
  { name: 'san diego', context: 'traveled', lat: 32.72, lng: -117.16, color: '#22d3ee', category: 'visited', region: 'us' },
  { name: 'gettysburg', context: 'lincoln leadership institute', lat: 39.83, lng: -77.23, color: '#22d3ee', category: 'visited', region: 'us' },
  { name: 'chicago', context: 'traveled', lat: 41.88, lng: -87.63, color: '#22d3ee', category: 'visited', region: 'us' },
  { name: 'indianapolis', context: 'traveled', lat: 39.77, lng: -86.16, color: '#22d3ee', category: 'visited', region: 'us' },
  { name: 'cincinnati', context: 'traveled', lat: 39.1, lng: -84.51, color: '#22d3ee', category: 'visited', region: 'us' },
];

function toXY(lat: number, lng: number): [number, number] {
  return [(lng + 180) / 360 * 1000, (90 - lat) / 180 * 500];
}

// Land as a dot grid, sampled from Natural Earth 1:50m (lat > -58°) on a 6-unit grid in the
// same equirectangular frame as toXY. Rows are '|'-separated; each run is base36 "startCol.length".
const LAND_STEP = 6;
const LAND =
  '|||19.a,1q.b|13.5,19.6,1g.o,2k.1,2m.1,2x.1,31.1,3i.2|12.1,17.5,1e.n,22.1,2i.2,2l.1,3l.1|t.3,z.3,13.1,15.1,1k.i,33.3,3i.3' +
  ',3m.6,43.1|q.4,13.2,17.1,1l.h,30.2,3f.c|q.2,t.6,11.1,13.1,16.7,1n.e,2z.2,37.3,3b.o,44.5|8.b,n.5,t.8,12.1,14.1,18.1,1c.4,' +
  '1m.1,1o.c,2j.7,33.2,37.2,3a.17,4i.4|0.2,7.q,y.c,1e.3,1m.a,2i.c,2x.c,3a.1c|2.2,6.13,1b.5,1n.6,21.4,2h.4,2n.4,2s.1,2u.1s|7' +
  '.y,1e.2,1o.4,2f.5,2l.21|8.w,1b.4,1p.3,2e.5,2l.1r,4f.4|8.1,b.1,k.k,1b.5,1h.1,2e.2,2h.2,2m.1j,4d.2|9.1,l.l,1c.7,28.2,2f.1,' +
  '2h.2,2l.1i,4c.3|n.m,1b.9,27.2,2a.1,2f.1,2h.1,2j.1k,4b.3|o.m,1b.b,27.1,29.3,2d.1t,4c.1|o.1,q.q,2c.1s,45.1|q.r,1k.2,29.1v|' +
  'q.s,2b.6,2i.7,2r.1,2t.5,30.13|q.p,28.1,2b.4,2g.2,2j.6,2u.3,2z.13,45.2|q.o,27.5,2h.2,2k.5,2q.2,2u.4,30.z|q.m,27.4,2f.1,2l' +
  '.1,2n.b,30.u,3x.1,44.1|r.l,28.2,2f.1,2l.1,2o.b,30.w,3y.1,43.2|r.l,28.8,2q.1,2s.13,40.3|t.h,23.1,27.b,2l.1,2s.13,3z.1|v.f' +
  ',27.d,2l.1a|w.7,19.1,26.s,2z.x|v.1,x.5,19.1,25.m,2s.7,32.t,3y.1|y.4,24.o,2t.6,30.2,37.n,3v.1|9.1,y.4,1a.1,24.o,2t.a,37.a' +
  ',3i.a|b.1,z.4,15.2,1d.2,24.p,2u.8,39.6,3j.5,3q.1|10.6,24.p,2v.6,39.5,3j.6,3v.1|14.5,24.q,2v.4,3a.2,3l.5,3v.1|16.3,24.s,3' +
  'a.3,3l.5,3w.1|18.1,1d.3,24.r,2y.1,3a.2,3n.3,3x.1|19.2,1c.7,25.u,3b.2,3l.1,3x.1|1b.9,26.s,3c.1|1c.b,27.1,2e.k,3k.1,3m.1,3' +
  's.2|1b.d,2g.h,3l.2,3r.3|1a.e,2g.f,3l.2,3q.4,3w.1,3y.1|1a.e,1p.2,2g.f,3m.2,3q.3,3v.1,3z.2,42.2|1a.k,2h.d,3n.1,3s.1,42.4|1' +
  'a.l,2h.d,3o.1,41.1,43.5|1b.k,2i.c,3r.2,3w.1,44.2,47.1|1b.j,2i.c|1c.i,2h.d,40.3,45.1|1c.h,2h.d,2x.2,3x.5,45.1,4g.1|1e.f,2' +
  'h.c,2w.2,3x.7,45.2|1f.e,2h.b,2w.2,3w.b|1f.d,2i.a,2w.2,3t.f|1f.c,2i.a,2w.1,3s.h|1f.a,2i.9,3s.i|1e.b,2j.7,3s.i|1e.a,2j.7,3' +
  't.h|1e.9,2k.5,3t.6,41.9|1e.8,2k.2,3t.2,43.6|1e.7,44.5|1d.7,45.1,4k.2|1d.6,4k.1|1e.3,47.1,4i.2|1d.4,4h.2|1d.4|1c.4,37.1|1' +
  'c.1,1e.1,1j.2|1d.1,1f.1|||||';

let landPathCache: string | null = null;
function landPath(): string {
  if (landPathCache) return landPathCache;
  const parts: string[] = [];
  LAND.split('|').forEach((row, r) => {
    if (!row) return;
    const y = (r + 0.5) * LAND_STEP;
    for (const run of row.split(',')) {
      const [s, l] = run.split('.').map(v => parseInt(v, 36));
      for (let c = s; c < s + l; c++) parts.push(`M${(c + 0.5) * LAND_STEP} ${y}h.01`);
    }
  });
  return (landPathCache = parts.join(''));
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  live: { label: 'living', icon: '◆', color: '#f59e0b' },
  study: { label: 'studying', icon: '▲', color: '#818cf8' },
  visited: { label: 'visited', icon: '●', color: '#22d3ee' },
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

// Land fades in when the map scrolls into view, then pins pop in one after another.
const MAP_CSS = `
.wm-pin{transform:scale(0);transform-box:fill-box;transform-origin:center;transition:transform .55s cubic-bezier(.34,1.56,.64,1) var(--d,0s)}
.wm-on .wm-pin{transform:scale(1)}
.wm-pulse{opacity:0;transform-box:fill-box;transform-origin:center}
.wm-on .wm-pulse{animation:wm-pulse 2.8s cubic-bezier(0,0,.2,1) var(--d,0s) infinite}
@keyframes wm-pulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(4.5);opacity:0}}
.wm-label{opacity:0;transition:opacity .6s ease var(--d,0s),fill .2s,font-size .2s}
.wm-on .wm-label{opacity:1}
.wm-land{opacity:0;transition:opacity 1s ease}
.wm-on .wm-land{opacity:1}
.wm-still *{transition:none!important;animation:none!important}
`;

export default function WorldMap({ isDark }: { isDark?: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [still] = useState(prefersReducedMotion);
  const [inView, setInView] = useState(still);

  // The tooltip lives in viewBox units, so on a narrow map it renders tiny.
  // Scale it up until its title is ~11 CSS px, whatever width the map is drawn at.
  const mapRef = useRef<HTMLDivElement>(null);
  const [tipScale, setTipScale] = useState(1);
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const fit = (w: number) => w > 0 && setTipScale(Math.min(4, Math.max(1, 1222 / w)));
    fit(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => fit(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = mapRef.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  const dark = isDark ?? false;

  const palette = useMemo(() => ({
    ocean: dark ? '#08080f' : '#fafbfc',
    oceanGradEnd: dark ? '#0c0c18' : '#f4f5f7',
    landDot: dark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.17)',
    text: dark ? '#8a8a96' : '#7a7a85',
    textHover: dark ? '#f5f5f5' : '#111',
    tooltipBg: dark ? 'rgba(15,15,25,0.92)' : 'rgba(255,255,255,0.95)',
    tooltipBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    tooltipText: dark ? '#e5e5e5' : '#1a1a1a',
    tooltipSub: dark ? '#777' : '#888',
  }), [dark]);

  const land = useMemo(landPath, []);

  const locationCoords = useMemo(() =>
    LOCATIONS.map(loc => ({ ...loc, xy: toXY(loc.lat, loc.lng) })),
    []
  );
  const byName = useMemo(() => new Map(locationCoords.map(l => [l.name, l])), [locationCoords]);

  // Pins land in order, home first
  const pinDelay = useMemo(() =>
    new Map(locationCoords.map((l, i) => [l.name, 0.3 + i * 0.08])),
    [locationCoords]
  );

  const hoveredLoc = hovered ? byName.get(hovered) : undefined;
  // hovering home lights every place; hovering anywhere else lights just its region
  const activeRegion: Region | null = hoveredLoc ? hoveredLoc.region : null;
  const regionLit = (r: Region) => activeRegion === null || activeRegion === 'home' || activeRegion === r;

  // Smart label placement
  function labelPos(loc: typeof locationCoords[0]): { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' } {
    const [x] = loc.xy;
    if (x > 850) return { dx: -14, dy: 4, anchor: 'end' };
    if (loc.name === 'switzerland') return { dx: 10, dy: -4, anchor: 'start' };
    if (loc.name === 'spain') return { dx: -12, dy: 4, anchor: 'end' };
    if (loc.name === 'west lafayette') return { dx: 0, dy: -16, anchor: 'middle' };
    // US cluster: spread labels in different directions so they don't overlap
    if (loc.name === 'los angeles') return { dx: -11, dy: 0, anchor: 'end' };
    if (loc.name === 'san diego') return { dx: 0, dy: 16, anchor: 'middle' };
    if (loc.name === 'chicago') return { dx: -10, dy: 0, anchor: 'end' };
    if (loc.name === 'indianapolis') return { dx: 0, dy: 18, anchor: 'middle' };
    if (loc.name === 'cincinnati') return { dx: 13, dy: -7, anchor: 'start' };
    if (loc.name === 'gettysburg') return { dx: 12, dy: 10, anchor: 'start' };
    return { dx: 12, dy: 4, anchor: 'start' };
  }

  // The US pins sit a few px apart, so per-pin hit circles would swallow each other.
  // Instead the pointer picks the nearest pin within reach (generous on a phone-width map).
  const svgRef = useRef<SVGSVGElement>(null);
  function nearestPin(clientX: number, clientY: number): string | null {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    const reach = Math.max(14, 16.5 * tipScale);
    let best: string | null = null;
    let bestD = reach;
    for (const l of locationCoords) {
      const d = Math.hypot(l.xy[0] - pt.x, l.xy[1] - pt.y);
      if (d < bestD) { bestD = d; best = l.name; }
    }
    return best;
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { live: 0, study: 0, visited: 0 };
    LOCATIONS.forEach(l => c[l.category]++);
    return c;
  }, []);

  return (
    <div className="w-full relative group/map">
      <div
        ref={mapRef}
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: dark
            ? '0 0 0 1px rgba(255,255,255,0.02), 0 4px 24px rgba(0,0,0,0.3)'
            : '0 0 0 1px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.04)',
        }}
      >
        <svg
          viewBox="0 0 1000 430"
          className={`w-full h-auto block${inView ? ' wm-on' : ''}${still ? ' wm-still' : ''}`}
          ref={svgRef}
          role="group"
          // mouse hovers; touch taps to toggle (pointermove also fires on a tap, so it's mouse-only)
          onPointerMove={e => e.pointerType === 'mouse' && setHovered(nearestPin(e.clientX, e.clientY))}
          onPointerLeave={e => e.pointerType === 'mouse' && setHovered(null)}
          onClick={e => {
            const hit = nearestPin(e.clientX, e.clientY);
            const mouse = (e.nativeEvent as PointerEvent).pointerType === 'mouse';
            // a tap toggles the pin under it; tapping open water closes the card
            setHovered(h => (!hit ? null : mouse || h !== hit ? hit : null));
          }}
          style={{ cursor: hovered ? 'pointer' : undefined }}
          aria-label={`map of places i've been: ${LOCATIONS.map(l => l.name).join(', ')}`}
        >
          <defs>
            <style>{MAP_CSS}</style>

            <radialGradient id="oceanGrad" cx="70%" cy="40%" r="65%">
              <stop offset="0%" stopColor={palette.ocean} />
              <stop offset="100%" stopColor={palette.oceanGradEnd} />
            </radialGradient>

            <filter id="glow-marker" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            <filter id="tooltipShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
            </filter>
          </defs>

          <rect width="1000" height="430" fill="url(#oceanGrad)" />

          {/* Dotted land */}
          <path
            className="wm-land"
            d={land}
            fill="none"
            stroke={palette.landDot}
            strokeWidth={2.4}
            strokeLinecap="round"
          />

          {/* Location markers */}
          {locationCoords.map((loc) => {
            const [x, y] = loc.xy;
            const isHov = hovered === loc.name;
            const lp = labelPos(loc);
            const major = loc.category !== 'visited';
            const baseR = major ? 4.5 : 2.8;
            const lit = regionLit(loc.region) || loc.region === 'home';
            const delay = `${pinDelay.get(loc.name) ?? 0}s`;

            return (
              <g
                key={loc.name}
                role="button"
                tabIndex={0}
                aria-label={`${loc.name}: ${loc.context}`}
                aria-pressed={isHov}
                // pointer clicks are resolved by the svg (nearest pin); this catches
                // assistive-tech activation, which arrives as a click with no coordinates
                onClick={e => {
                  if (e.detail !== 0) return;
                  e.stopPropagation();
                  setHovered(h => (h === loc.name ? null : loc.name));
                }}
                // keyboard focus only: a tap also focuses, and would fight the click toggle
                onFocus={e => e.currentTarget.matches(':focus-visible') && setHovered(loc.name)}
                onBlur={() => setHovered(h => (h === loc.name ? null : h))}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setHovered(h => (h === loc.name ? null : loc.name));
                  }
                }}
                className="outline-none"
                style={{ opacity: lit ? 1 : 0.3, transition: 'opacity 0.35s ease', '--d': delay } as CSSProperties}
              >
                {/* Pulse ring: home and campus only, so the map isn't throbbing everywhere */}
                {major && !still && (
                  <circle
                    className="wm-pulse"
                    pointerEvents="none"
                    cx={x} cy={y} r={baseR}
                    fill="none"
                    stroke={loc.color}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                <g className="wm-pin" pointerEvents="none">
                  <circle cx={x} cy={y} r={baseR * 2.6} fill={loc.color} opacity={isHov ? 0.18 : major ? 0.08 : 0} style={{ transition: 'opacity 0.3s' }} />

                  <circle
                    cx={x} cy={y}
                    r={isHov ? baseR * 1.45 : baseR}
                    fill={loc.color}
                    filter={isHov ? 'url(#glow-marker)' : undefined}
                    style={{ transition: 'r 0.2s ease' }}
                  />
                  <circle
                    cx={x} cy={y}
                    r={isHov ? baseR * 0.5 : baseR * 0.38}
                    fill="#fff"
                    opacity={0.8}
                    style={{ transition: 'r 0.2s ease' }}
                  />
                </g>

                {/* too small to read below laptop width; the list under the legend covers it */}
                <text
                  className="wm-label max-lg:hidden"
                  x={x + lp.dx}
                  y={y + lp.dy}
                  textAnchor={lp.anchor}
                  fill={isHov ? palette.textHover : palette.text}
                  style={{
                    fontFamily: MONO,
                    fontSize: isHov ? '10.5px' : major ? '9px' : '8px',
                    fontWeight: isHov || major ? 600 : 400,
                    letterSpacing: '0.08em',
                    textTransform: 'lowercase' as const,
                  }}
                >
                  {loc.name}
                </text>
              </g>
            );
          })}

          {/* Tooltip sits after every marker so neighbouring pins never paint over it */}
          {hoveredLoc && (() => {
            const [x, y] = hoveredLoc.xy;
            const lp = labelPos(hoveredLoc);
            const k = tipScale;
            const tw = 130 * k;
            const th = 38 * k;
            let tx = x + lp.dx;
            let ty = y + lp.dy + 10;
            if (lp.anchor === 'end') tx = x + lp.dx - tw;
            else if (lp.anchor === 'middle') tx = x - tw / 2;
            if (ty + th > 410) ty = y - th - 16;
            if (ty < 10) ty = 10;
            if (tx < 10) tx = 10;
            if (tx + tw > 990) tx = 990 - tw;

            return (
              <g pointerEvents="none">
                <rect
                  x={tx}
                  y={ty}
                  width={tw}
                  height={th}
                  rx={6 * k}
                  fill={palette.tooltipBg}
                  stroke={palette.tooltipBorder}
                  strokeWidth={0.5}
                  filter="url(#tooltipShadow)"
                />
                <text
                  x={tx + 10 * k}
                  y={ty + 15 * k}
                  fill={palette.tooltipText}
                  style={{ fontFamily: MONO, fontSize: `${9 * k}px`, fontWeight: 500, letterSpacing: '0.06em' }}
                >
                  <tspan fill={hoveredLoc.color}>{CATEGORY_META[hoveredLoc.category].icon}</tspan> {hoveredLoc.name}
                </text>
                <text
                  x={tx + 10 * k}
                  y={ty + 28 * k}
                  fill={palette.tooltipSub}
                  style={{ fontFamily: MONO, fontSize: `${7.5 * k}px`, fontWeight: 400, letterSpacing: '0.06em' }}
                >
                  {hoveredLoc.context}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-5">
        {(['live', 'study', 'visited'] as const).map(cat => {
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
              <span
                className="relative flex items-center justify-center"
                style={{ width: 10, height: 10 }}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: meta.color, opacity: 0.15 }}
                />
                <span
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
              </span>
              <span>{meta.label}</span>
              <span className="opacity-50">{counts[cat]}</span>
            </div>
          );
        })}
      </div>
      <p className="lg:hidden mt-3 text-center font-mono text-[10px] tracking-[0.12em] leading-relaxed text-[var(--text-tertiary)]">
        {LOCATIONS.map(l => l.name).join(' · ')}
      </p>
    </div>
  );
}
