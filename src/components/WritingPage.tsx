import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import PageHeader from './PageHeader';
import { writingNotes } from '../data/writing';
import { prefersReducedMotion } from '../lib/dither';

// The index is only titles. Opening one tears the paper from the seam, away
// from the middle, revealing the article underneath.

const SEAM = [48, 52, 46, 54, 49, 55, 47, 51, 45, 53, 48, 56, 50, 54, 47, 52, 49];

const seamPoints = (fromEnd: boolean) => {
  const n = SEAM.length - 1;
  const points: string[] = [];
  for (let i = 0; i <= n; i++) {
    const idx = fromEnd ? n - i : i;
    points.push(`${((idx / n) * 100).toFixed(2)}% ${SEAM[idx]}%`);
  }
  return points;
};

const TOP_POLY = ['0% 0%', '100% 0%', ...seamPoints(true)].join(',');
const BOTTOM_POLY = [...seamPoints(false), '100% 100%', '0% 100%'].join(',');

type TearPhase = 'cover' | 'open';

function PaperTear({ phase }: { phase: TearPhase }) {
  return (
    <div className="paper-tear" data-phase={phase} aria-hidden="true">
      <div className="paper-tear__half paper-tear__top" style={{ clipPath: `polygon(${TOP_POLY})` }} />
      <div className="paper-tear__half paper-tear__bottom" style={{ clipPath: `polygon(${BOTTOM_POLY})` }} />
    </div>
  );
}

export default function WritingPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // only a /writing/… url names a note; while this page is exiting after a nav the path
  // is already somewhere else, and must not be sliced into a bogus slug
  const slug = pathname.startsWith('/writing/')
    ? decodeURIComponent(pathname.replace(/\/+$/, '').slice('/writing/'.length))
    : '';
  const article = slug ? writingNotes.find((note) => note.slug === slug) : undefined;

  const [tear, setTear] = useState<TearPhase | null>(null);
  const timers = useRef<number[]>([]);
  // the active route, readable from a timer without re-creating it
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  useEffect(() => {
    // this page stays mounted for its exit animation after the route has already changed;
    // never let a late mount or a stale timer clobber the next page's title
    if (pathname !== '/writing' && !pathname.startsWith('/writing/')) return;
    const title = article ? `${article.title} | Jay Katariya` : 'Writing | Jay Katariya';
    const timer = window.setTimeout(() => {
      document.title = title;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [article, pathname]);

  // an unknown note is a soft 404: keep it out of search results
  useEffect(() => {
    if (!slug || article) return;
    const noindex = document.createElement('meta');
    noindex.name = 'robots';
    noindex.content = 'noindex';
    document.head.appendChild(noindex);
    return () => noindex.remove();
  }, [slug, article]);

  const openArticle = (nextSlug: string) => {
    if (tear) return;
    if (prefersReducedMotion()) {
      navigate(`/writing/${nextSlug}`);
      return;
    }
    const origin = pathname;
    const cancel = () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
      setTear(null);
    };
    setTear('cover');
    timers.current = [
      window.setTimeout(() => {
        // the reader left while the paper was coming down: honor that click
        if (pathRef.current !== origin) {
          cancel();
          return;
        }
        navigate(`/writing/${nextSlug}`);
      }, 160),
      window.setTimeout(() => setTear('open'), 240),
      window.setTimeout(() => setTear(null), 1260),
    ];
  };

  if (slug && !article) {
    return (
      <main className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-[9px] tracking-[0.22em] text-[var(--text-tertiary)]">404 / note</p>
        <h1 className="mt-4 font-display text-4xl font-bold">nothing here.</h1>
        <Link to="/writing" className="tap-target mt-6 font-mono text-[10px] tracking-[0.16em] text-[var(--text-secondary)] underline underline-offset-4">
          back to writing
        </Link>
      </main>
    );
  }

  return (
    <>
      {tear && <PaperTear phase={tear} />}

      <motion.main
        key={article ? article.slug : 'index'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
        className="relative mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 md:px-8"
      >
        {article ? (
          <article>
            <Link
              to="/writing"
              className="group inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-[var(--text-tertiary)] transition-colors duration-300 hover:text-[var(--text-primary)] sm:text-[10px]"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>
              writing
            </Link>

            <div className="mt-10 flex items-baseline gap-3 font-mono text-[9px] tracking-[0.2em] text-[var(--text-tertiary)] sm:mt-14 sm:text-[10px]">
              <span>{article.date}</span>
              <span>·</span>
              <span>note</span>
            </div>

            <h1 className="mt-4 text-balance font-display text-[clamp(2.1rem,5.2vw,3.6rem)] font-bold leading-[1.02] tracking-normal text-[var(--text-primary)]">
              {article.title}
            </h1>

            <p className="mt-5 max-w-[56ch] text-base font-light leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              {article.lede}
            </p>

            <div className="mt-8 flex max-w-[62ch] flex-col gap-5 text-[15px] font-light leading-relaxed text-[var(--text-secondary)] sm:mt-10 sm:text-base">
              {article.body.map((paragraph) =>
                paragraph.startsWith('## ') ? (
                  <h2
                    key={paragraph}
                    className="mt-4 text-balance font-display text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl"
                  >
                    {paragraph.slice(3)}
                  </h2>
                ) : (
                  <p key={paragraph}>{paragraph}</p>
                ),
              )}
            </div>

            <div className="mt-14 flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--border-primary)] pt-6 font-mono text-[9px] tracking-[0.18em] text-[var(--text-tertiary)] sm:mt-16 sm:text-[10px]">
              <Link to="/writing" className="tap-target footer-link text-[var(--text-primary)]">
                ← all writing
              </Link>
              <span>more notes soon.</span>
            </div>
          </article>
        ) : (
          <>
            <PageHeader title="writing" subtitle="notes on building, design & the internet." icon="book" />

            <div className="mt-12 border-t border-[var(--border-primary)] sm:mt-16">
              {writingNotes.map((note, i) => (
                <Link
                  key={note.slug}
                  to={`/writing/${note.slug}`}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                    event.preventDefault();
                    openArticle(note.slug);
                  }}
                  className="group grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 border-b border-[var(--border-primary)] py-6 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:py-8"
                >
                  <span className="font-mono text-[8.5px] tracking-widest text-[var(--text-muted)] transition-colors duration-300 group-hover:text-[var(--accent)] sm:text-[9px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-balance font-display text-[clamp(1.55rem,4.4vw,2.6rem)] leading-[1.05] tracking-normal text-[var(--text-primary)] transition-transform duration-300 ease-out group-hover:translate-x-1">
                      {note.title}
                    </span>
                  </span>
                  <span className="justify-self-end font-mono text-[8.5px] tracking-[0.14em] text-[var(--text-tertiary)] transition-colors duration-300 group-hover:text-[var(--accent)] sm:text-[9.5px]">
                    {note.date}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 font-mono text-[9px] tracking-[0.18em] text-[var(--text-tertiary)] sm:text-[10px]">
              <span>more notes soon.</span>
              <a
                href="mailto:hi@jaykatariya.com?subject=writing"
                className="tap-target footer-link text-[var(--text-primary)]"
              >
                send me a topic ↗
              </a>
            </div>
          </>
        )}
      </motion.main>
    </>
  );
}
