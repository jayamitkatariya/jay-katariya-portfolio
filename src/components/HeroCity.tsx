import { useEffect, useRef, useState } from 'react';
import { Bird, Pause, Play } from 'lucide-react';
import CityCanvas, { type CityHandle } from './CityCanvas';
import { prefersReducedMotion } from '../lib/dither';

const LAFAYETTE = 'America/Indiana/Indianapolis';
const PUNE = 'Asia/Kolkata';

function zonedTime(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '';
  const ap = (parts.find((p) => p.type === 'dayPeriod')?.value ?? '').toLowerCase();
  return `${h}:${m}${ap}`;
}

function useLiveStatus() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: LAFAYETTE,
      hour: '2-digit',
      hour12: false,
    }).format(now),
  );
  const greeting =
    hour >= 5 && hour < 12
      ? 'good morning'
      : hour >= 12 && hour < 17
        ? 'good afternoon'
        : hour >= 17 && hour < 21
          ? 'good evening'
          : 'good night';
  return {
    greeting,
    lafayette: zonedTime(now, LAFAYETTE),
    pune: zonedTime(now, PUNE),
  };
}

export default function HeroCity({ isDark }: { isDark: boolean }) {
  const [paused, setPaused] = useState(() => prefersReducedMotion());
  const [birds, setBirds] = useState(3);
  const cityRef = useRef<CityHandle>(null);
  const status = useLiveStatus();

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[var(--bg-primary)]">
      <CityCanvas
        ref={cityRef}
        isDark={isDark}
        paused={paused}
        onBirdsChange={setBirds}
      />

      <div className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-5 pb-[23vh] pt-[10vh] text-center short:pb-[15vh] short:pt-[4vh]">
          <h1 className="font-display font-bold leading-[0.9] tracking-normal text-[clamp(3rem,10.5vw,11rem)] text-[var(--text-primary)] short:text-5xl">
            jay katariya
          </h1>
          <p className="mt-5 max-w-[36ch] text-balance text-[15px] font-light leading-snug text-[var(--text-secondary)] sm:mt-6 sm:text-lg md:text-xl short:mt-3 short:text-base">
            i make something out of nothing.
          </p>
          <p className="mt-3 font-mono text-[9px] tracking-[0.18em] text-[var(--text-tertiary)] sm:mt-4 sm:text-[10px] short:mt-2">
            building workro · purdue ibe &rsquo;28
          </p>
        </div>

        <div className="relative z-20 flex flex-wrap items-end justify-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-between sm:px-6 sm:pb-5">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--border-primary)]/80 bg-[var(--bg-primary)]/70 px-3 py-1.5 font-mono text-[8.5px] tracking-widest text-[var(--text-secondary)] backdrop-blur-sm sm:text-[9px]">
            <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--accent)] animate-pixel-blink" />
            <span>
              {status.greeting} · lafayette {status.lafayette}
              <span className="hidden min-[380px]:inline"> · pune {status.pune}</span>
            </span>
          </div>

          {/* phones keep only the clock plus an icon-only pause (the city must stay stoppable);
              the full bird/pause/count pill lives on wider screens */}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-[var(--border-primary)]/80 bg-[var(--bg-primary)]/70 text-[var(--text-secondary)] backdrop-blur-sm transition-[color,scale] duration-150 ease-out active:scale-[0.96] sm:hidden"
            aria-label={paused ? 'animate the city' : 'pause the city'}
            aria-pressed={paused}
          >
            {paused ? <Play size={10} strokeWidth={1.8} /> : <Pause size={10} strokeWidth={1.8} />}
          </button>

          <div className="pointer-events-auto hidden items-center gap-0.5 rounded-full border border-[var(--border-primary)]/80 bg-[var(--bg-primary)]/70 p-0.5 font-mono text-[8.5px] tracking-widest text-[var(--text-secondary)] backdrop-blur-sm sm:flex sm:text-[9px]">
            <button
              type="button"
              onClick={() => cityRef.current?.sendBird()}
              className="relative after:absolute after:-inset-y-1 after:inset-x-0 after:content-[''] grid min-h-8 w-8 place-items-center rounded-full transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.96] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] pointer-coarse:min-h-11 pointer-coarse:w-11"
              aria-label="send a bird"
              title="send a bird"
            >
              <Bird size={13} strokeWidth={1.6} className="text-[var(--accent)]" />
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="relative after:absolute after:-inset-y-1 after:inset-x-0 after:content-[''] flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.96] hover:text-[var(--text-primary)] pointer-coarse:min-h-11"
              aria-label={paused ? 'animate the city' : 'pause the city'}
              aria-pressed={paused}
            >
              {paused ? <Play size={10} strokeWidth={1.8} /> : <Pause size={10} strokeWidth={1.8} />}
              <span>{paused ? 'animate' : 'pause'}</span>
            </button>
            <span className="pr-2 pl-1 text-[var(--text-tertiary)]" aria-live="off">
              {birds} birds
            </span>
          </div>
        </div>
      </div>

    </section>
  );
}
