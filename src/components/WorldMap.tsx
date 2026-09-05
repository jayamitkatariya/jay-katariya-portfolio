import { useState, useMemo } from 'react';

interface MapLocation {
  name: string;
  context: string;
  lat: number;
  lng: number;
  color: string;
  category: 'live' | 'study' | 'visited';
}

const LOCATIONS: MapLocation[] = [
  { name: 'pune', context: 'hometown', lat: 18.52, lng: 73.86, color: '#f59e0b', category: 'live' },
  { name: 'west lafayette', context: 'purdue university', lat: 40.43, lng: -86.91, color: '#818cf8', category: 'study' },
  { name: 'mauritius', context: 'traveled', lat: -20.35, lng: 57.55, color: '#22d3ee', category: 'visited' },
  { name: 'singapore', context: 'traveled', lat: 1.35, lng: 103.82, color: '#22d3ee', category: 'visited' },
  { name: 'germany', context: 'traveled', lat: 51.16, lng: 10.45, color: '#22d3ee', category: 'visited' },
  { name: 'switzerland', context: 'traveled', lat: 46.82, lng: 8.23, color: '#22d3ee', category: 'visited' },
  { name: 'spain', context: 'traveled', lat: 40.46, lng: -3.75, color: '#22d3ee', category: 'visited' },
];

function toXY(lat: number, lng: number): [number, number] {
  return [(lng + 180) / 360 * 1000, (90 - lat) / 180 * 500];
}

// Generate a curved arc path between two points
function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Arc curves upward - sweep radius proportional to distance
  const sweep = dist * 0.4;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - sweep * 0.6;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

// Home base for arcs (Pune)
const HOME = LOCATIONS[0];

// Continent outlines - equirectangular projection, viewBox 0 0 1000 500
const CONTINENT_PATHS = [
  "M42,56 L69,53 L119,56 L167,47 L194,50 L236,61 L264,75 L242,75 L264,97 L286,89 L306,83 L344,106 L353,117 L322,128 L314,125 L294,136 L289,147 L283,158 L278,175 L278,181 L269,169 L256,167 L250,169 L231,178 L231,189 L258,194 L253,203 L250,211 L208,200 L194,186 L167,156 L158,144 L158,117 L139,97 L89,83Z",
  "M306,39 L347,28 L403,25 L431,39 L414,56 L375,69 L342,56Z",
  "M281,228 L297,222 L322,228 L353,244 L383,258 L400,275 L397,303 L381,325 L356,347 L328,364 L311,381 L303,389 L294,367 L289,339 L286,311 L281,275Z",
  "M472,147 L483,139 L497,128 L514,117 L533,108 L553,97 L572,86 L589,81 L597,89 L589,106 L578,122 L567,144 L547,139 L528,133 L508,133Z",
  "M472,164 L500,158 L536,167 L569,172 L592,181 L614,200 L633,217 L639,225 L625,256 L608,278 L586,311 L567,339 L556,344 L542,331 L531,300 L525,269 L511,250 L497,233 L483,214Z",
  "M597,89 L619,81 L647,72 L683,64 L722,58 L769,56 L817,58 L858,64 L900,67 L942,69 L956,78 L947,94 L933,114 L914,133 L892,147 L864,150 L844,156 L825,167 L808,183 L794,200 L781,211 L764,217 L747,222 L733,214 L722,200 L717,186 L714,172 L703,161 L683,153 L658,147 L636,139 L617,125Z",
  "M678,167 L694,175 L708,189 L717,208 L711,225 L700,231 L689,222 L681,208 L675,192Z",
  "M781,211 L797,208 L814,219 L819,236 L811,250 L797,253 L783,244 L778,228Z",
  "M878,117 L886,111 L894,125 L889,142 L881,142Z",
  "M481,103 L489,94 L494,106 L489,114Z",
  "M825,292 L864,286 L903,289 L919,308 L917,336 L900,356 L872,364 L844,356 L828,336 L822,314Z",
  "M797,253 L822,250 L847,253 L861,258 L853,267 L831,269 L808,267Z",
  "M706,236 L711,233 L714,239 L708,244Z",
  "M622,308 L628,300 L633,314 L628,325Z",
];

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  live: { label: 'living', icon: '◆' },
  study: { label: 'studying', icon: '▲' },
  visited: { label: 'visited', icon: '●' },
};

export default function WorldMap({ isDark }: { isDark?: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const dark = isDark ?? false;

  // Theme-aware palette using CSS variable patterns
  const palette = useMemo(() => ({
    ocean: dark ? '#08080f' : '#fafbfc',
    oceanGradEnd: dark ? '#0c0c18' : '#f4f5f7',
    land: dark ? '#13132a' : '#e8eaed',
    landStroke: dark ? '#1e1e3a' : '#d1d5db',
    landHighlight: dark ? '#1a1a38' : '#f0f1f3',
    dotGrid: dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)',
    arcStroke: dark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.12)',
    arcStrokeHover: dark ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.35)',
    text: dark ? '#888' : '#888',
    textHover: dark ? '#f5f5f5' : '#111',
    tooltipBg: dark ? 'rgba(15,15,25,0.92)' : 'rgba(255,255,255,0.95)',
    tooltipBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    tooltipText: dark ? '#e5e5e5' : '#1a1a1a',
    tooltipSub: dark ? '#777' : '#888',
  }), [dark]);

  // Pre-compute coordinates
  const locationCoords = useMemo(() =>
    LOCATIONS.map(loc => ({ ...loc, xy: toXY(loc.lat, loc.lng) })),
    []
  );

  const homeXY = locationCoords[0].xy;

  // Build arc paths from home to each other location
  const arcs = useMemo(() =>
    locationCoords.slice(1).map(loc => ({
      name: loc.name,
      path: arcPath(homeXY[0], homeXY[1], loc.xy[0], loc.xy[1]),
    })),
    [locationCoords, homeXY]
  );

  // Smart label placement
  function labelPos(loc: typeof locationCoords[0]): { dx: number; dy: number; anchor: string } {
    const [x] = loc.xy;
    // Place labels to the right by default, left if too far right
    if (x > 850) return { dx: -14, dy: 4, anchor: 'end' };
    if (loc.name === 'switzerland') return { dx: -14, dy: 6, anchor: 'end' };
    if (loc.name === 'spain') return { dx: -14, dy: 4, anchor: 'end' };
    if (loc.name === 'west lafayette') return { dx: 0, dy: -16, anchor: 'middle' };
    return { dx: 14, dy: 5, anchor: 'start' };
  }

  return (
    <div className="w-full relative group/map">
      {/* Map container with subtle border glow on hover */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: dark
            ? '0 0 0 1px rgba(255,255,255,0.02), 0 4px 24px rgba(0,0,0,0.3)'
            : '0 0 0 1px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.04)',
        }}
      >
        <svg viewBox="0 0 1000 430" className="w-full h-auto block" style={{ maxHeight: '400px' }}>
          <defs>
            {/* Ocean gradient */}
            <radialGradient id="oceanGrad" cx="70%" cy="40%" r="65%">
              <stop offset="0%" stopColor={palette.ocean} />
              <stop offset="100%" stopColor={palette.oceanGradEnd} />
            </radialGradient>

            {/* Land fill with subtle gradient */}
            <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.land} />
              <stop offset="100%" stopColor={palette.landHighlight} />
            </linearGradient>

            {/* Glow filters for markers */}
            <filter id="glow-amber" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor="#f59e0b" floodOpacity="0.3" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-indigo" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feFlood floodColor="#818cf8" floodOpacity="0.3" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-cyan" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#22d3ee" floodOpacity="0.25" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Dot pattern for grid */}
            <pattern id="dotGrid" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
              <circle cx="12.5" cy="12.5" r="0.6" fill={palette.dotGrid} />
            </pattern>

            {/* Tooltip shadow */}
            <filter id="tooltipShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Ocean background */}
          <rect width="1000" height="430" fill="url(#oceanGrad)" />

          {/* Dot grid overlay */}
          <rect width="1000" height="430" fill="url(#dotGrid)" />

          {/* Subtle equator line */}
          <line x1={0} y1={250} x2={1000} y2={250} stroke={palette.dotGrid} strokeWidth={1} strokeDasharray="2 6" opacity={0.8} />

          {/* Continents */}
          {CONTINENT_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="url(#landGrad)"
              stroke={palette.landStroke}
              strokeWidth={0.6}
              strokeLinejoin="round"
            />
          ))}

          {/* Travel arcs from home (Pune) to each location */}
          {arcs.map((arc) => {
            const isArcHovered = hovered === arc.name || hovered === HOME.name;
            return (
              <path
                key={arc.name}
                d={arc.path}
                fill="none"
                stroke={isArcHovered ? palette.arcStrokeHover : palette.arcStroke}
                strokeWidth={isArcHovered ? 1.5 : 0.8}
                strokeDasharray={isArcHovered ? '6 4' : '3 6'}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.3s, stroke-width 0.3s, stroke-dasharray 0.3s' }}
              />
            );
          })}

          {/* Location markers */}
          {locationCoords.map((loc) => {
            const [x, y] = loc.xy;
            const isHov = hovered === loc.name;
            const lp = labelPos(loc);
            const glowId = loc.category === 'live' ? 'glow-amber'
              : loc.category === 'study' ? 'glow-indigo' : 'glow-cyan';
            const baseR = loc.category === 'visited' ? 3.5 : 5;

            return (
              <g
                key={loc.name}
                onMouseEnter={() => setHovered(loc.name)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Animated pulse ring */}
                <circle cx={x} cy={y} r={baseR} fill="none" stroke={loc.color} strokeWidth={1} opacity={0}>
                  <animate attributeName="r" values={`${baseR};${baseR * 4};${baseR * 5}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="stroke-width" values="1;0.5;0" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Ambient glow */}
                <circle cx={x} cy={y} r={baseR * 2.5} fill={loc.color} opacity={isHov ? 0.12 : 0.05} style={{ transition: 'opacity 0.3s' }} />

                {/* Main marker dot with glow filter */}
                <circle
                  cx={x} cy={y}
                  r={isHov ? baseR * 1.4 : baseR}
                  fill={loc.color}
                  filter={isHov ? `url(#${glowId})` : undefined}
                  style={{ transition: 'r 0.2s ease' }}
                />
                {/* Inner bright core */}
                <circle
                  cx={x} cy={y}
                  r={isHov ? baseR * 0.5 : baseR * 0.35}
                  fill="#fff"
                  opacity={0.7}
                  style={{ transition: 'r 0.2s ease' }}
                />

                {/* Label */}
                <text
                  x={x + lp.dx}
                  y={y + lp.dy}
                  textAnchor={lp.anchor}
                  fill={isHov ? palette.textHover : palette.text}
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: isHov ? '10.5px' : '8.5px',
                    fontWeight: isHov ? 600 : 400,
                    letterSpacing: '0.08em',
                    textTransform: 'lowercase' as const,
                    transition: 'fill 0.2s, font-size 0.2s',
                  }}
                >
                  {loc.name}
                </text>

                {/* Hover tooltip card */}
                {isHov && (() => {
                  // Calculate tooltip position to stay within bounds
                  const tw = 130;
                  const th = 38;
                  let tx = x + lp.dx;
                  let ty = y + lp.dy + 10;
                  if (lp.anchor === 'end') tx = x + lp.dx - tw;
                  else if (lp.anchor === 'middle') tx = x - tw / 2;
                  if (ty + th > 410) ty = y - th - 16;
                  if (tx < 10) tx = 10;
                  if (tx + tw > 990) tx = 990 - tw;

                  return (
                    <g>
                      <rect
                        x={tx}
                        y={ty}
                        width={tw}
                        height={th}
                        rx={6}
                        fill={palette.tooltipBg}
                        stroke={palette.tooltipBorder}
                        strokeWidth={0.5}
                        filter="url(#tooltipShadow)"
                      />
                      <text
                        x={tx + 10}
                        y={ty + 15}
                        fill={palette.tooltipText}
                        style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '9px',
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {CATEGORY_META[loc.category].icon} {loc.name}
                      </text>
                      <text
                        x={tx + 10}
                        y={ty + 28}
                        fill={palette.tooltipSub}
                        style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '7.5px',
                          fontWeight: 400,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {loc.context}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 mt-5">
        {(['live', 'study', 'visited'] as const).map(cat => {
          const meta = CATEGORY_META[cat];
          const color = cat === 'live' ? '#f59e0b' : cat === 'study' ? '#818cf8' : '#22d3ee';
          return (
            <div key={cat} className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: 'var(--text-tertiary)' }}>
              <span
                className="relative flex items-center justify-center"
                style={{ width: 10, height: 10 }}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: color, opacity: 0.15 }}
                />
                <span
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ backgroundColor: color }}
                />
              </span>
              <span>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
