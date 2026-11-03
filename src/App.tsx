import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Menu, X } from 'lucide-react';
import ReadingProgress from './components/ReadingProgress';
import LoadingScreen from './components/LoadingScreen';
import { markAppReady, onAppReady } from './lib/appReady';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import DarkModeToggle from './components/DarkModeToggle';
import AchievementToast from './components/AchievementToast';
import CustomCursor from './components/CustomCursor';
import PixelWipe from './components/PixelWipe';
import AchievementsPanel from './components/AchievementsPanel';
import DiscoOverlay from './components/DiscoOverlay';
import { useAwayTitle, useVisitCount, useRapidRepeat } from './hooks/useEasterEggs';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDarkMode } from './hooks/useDarkMode';
import { useAchievements, AchievementContext } from './hooks/useAchievements';
import ErrorBoundary from './components/ErrorBoundary';
import AgentView from './components/AgentView';
import { useAgentMode } from './hooks/useAgentMode';
import DitherBand from './components/DitherBand';
import HeroCity from './components/HeroCity';
import SelectedWork from './components/SelectedWork';
import Filmstrip from './components/Filmstrip';
import ContactSection from './components/ContactSection';
import MobileMenu, { PAGES } from './components/MobileMenu';
import WritingPage from './components/WritingPage';
import { useBodyScrollLock, isScrollLocked } from './hooks/useBodyScrollLock';
import { lazyWithRetry } from './lib/lazyWithRetry';

// Route-level + heavy components load on demand to keep the first paint light.
// Writing deliberately stays in the main bundle: it's tiny, it's a primary nav
// destination, and a failed lazy import left phones showing the error panel.
const PortfolioPage = lazyWithRetry(() => import('./components/portfolio/PortfolioPage'));
const MemoriesPage = lazyWithRetry(() => import('./components/MemoriesPage'));
const ResumePage = lazyWithRetry(() => import('./components/ResumePage'));
const QRCodeModal = lazyWithRetry(() => import('./components/QRCodeModal'));
const PageFallback = () => <div className="min-h-screen" />;

// Page transitions. Exits are shorter and use a symmetric curve, so the old page
// actually fades rather than snapping out; keyboard navigation skips motion entirely.
// The leaving page reads `instant` through AnimatePresence's `custom`, since its own
// props are frozen at the render before the navigation.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_EXIT = [0.4, 0, 0.6, 1] as const;
type PageMotion = { instant: boolean };
const pageVariants = (lift: boolean) => ({
  initial: { opacity: 0, ...(lift ? { y: 20 } : {}) },
  enter: ({ instant }: PageMotion) => ({
    opacity: 1,
    ...(lift ? { y: 0 } : {}),
    transition: instant ? { duration: 0 } : { duration: 0.35, ease: EASE_OUT },
  }),
  exit: ({ instant }: PageMotion) => ({
    opacity: 0,
    ...(lift ? { y: -20 } : {}),
    transition: instant ? { duration: 0 } : { duration: 0.2, ease: EASE_EXIT },
  }),
});
const LIFT = pageVariants(true);
const FADE = pageVariants(false);

const INTRO_KEY = 'intro-seen';
const introSeen = () => {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
};

type Page = 'home' | 'portfolio' | 'writing' | 'memories' | 'resume' | 'notfound';

const PAGE_TITLES: Record<Page, string> = {
  home: 'Jay Katariya | Integrated Business & Engineering @ Purdue',
  portfolio: 'Portfolio | Jay Katariya',
  writing: 'Writing | Jay Katariya',
  memories: 'Memories | Jay Katariya',
  resume: 'Resume | Jay Katariya',
  notfound: 'Not found | Jay Katariya',
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage: Page = (() => {
    // tolerate a trailing slash (/portfolio/)
    const path = location.pathname.replace(/(.)\/+$/, '$1');
    // article pages live under /writing/:slug and keep the writing tab active
    if (path === '/writing' || path.startsWith('/writing/')) return 'writing';
    switch (path) {
      case '/': return 'home';
      case '/portfolio': return 'portfolio';
      case '/memories': return 'memories';
      case '/resume': return 'resume';
      default: return 'notfound';
    }
  })();

  // keyboard shortcuts navigate with `instant`, which skips the wipe and the page fade
  const goToPage = useCallback((page: 'home' | 'portfolio' | 'writing' | 'memories' | 'resume', instant = false) => {
    const paths = { home: '/', portfolio: '/portfolio', writing: '/writing', memories: '/memories', resume: '/resume' } as const;
    navigate(paths[page], instant ? { state: { instant: true } } : undefined);
  }, [navigate]);
  const pageMotion: PageMotion = { instant: (location.state as { instant?: boolean } | null)?.instant === true };

  // Hash links land on their section, everything else starts at the top.
  const scrollTimerRef = useRef(0);
  const scrollToTarget = useCallback((hash: string) => {
    window.clearTimeout(scrollTimerRef.current);
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: 'instant' });
        return;
      }
      if (tries++ < 24) scrollTimerRef.current = window.setTimeout(tick, 80);
    };
    tick();
  }, []);
  useEffect(() => () => window.clearTimeout(scrollTimerRef.current), []);

  // When the page itself changes, wait for the old one to finish fading out: scrolling
  // now would make it visibly jump to its top mid-exit. Same-page changes (a hash, or a
  // writing article) scroll straight away.
  // Recorded during render, not in an effect: an instant (keyboard) exit can finish
  // before effects run, and onExitComplete would find nothing pending.
  const prevPageRef = useRef<Page | null>(null);
  const pendingScrollRef = useRef<string | null>(null);
  if (prevPageRef.current !== currentPage) {
    if (prevPageRef.current !== null) pendingScrollRef.current = location.hash;
    prevPageRef.current = currentPage;
  }
  useEffect(() => {
    if (pendingScrollRef.current !== null) return; // the exit hands off to handlePageExitComplete
    scrollToTarget(location.hash);
  }, [currentPage, location.pathname, location.hash, scrollToTarget]);

  const handlePageExitComplete = useCallback(() => {
    const hash = pendingScrollRef.current;
    if (hash === null) return;
    pendingScrollRef.current = null;
    scrollToTarget(hash);
    // the link that was clicked usually unmounted with the old page; put focus on the new
    // one so the next Tab starts there instead of back at the top of the document
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && active !== document.body && active.isConnected) return;
      document.querySelector<HTMLElement>('[data-page]')?.focus({ preventScroll: true });
    });
  }, [scrollToTarget]);

  useEffect(() => {
    document.title = PAGE_TITLES[currentPage];
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      // even a 404 points at itself, rather than inheriting the last page's canonical
      canonical.setAttribute('href', `https://www.jaykatariya.com${location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '')}`);
    }
    // unknown paths still return 200 (SPA fallback), so keep them out of search results
    if (currentPage !== 'notfound') return;
    const noindex = document.createElement('meta');
    noindex.name = 'robots';
    noindex.content = 'noindex';
    document.head.appendChild(noindex);
    return () => noindex.remove();
  }, [currentPage, location.pathname]);

  // The nav is transparent over the hero, then picks up its paper layer on scroll.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      // a modal pins the body, which reads as scrollY 0; that isn't the reader scrolling up
      if (isScrollLocked()) return;
      setScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const navSolid = currentPage !== 'home' || scrolled;

  const { isAgent, setAgent } = useAgentMode();
  // agent mode is for reading, not for intros; and the intro plays once per session,
  // not on every reload or deep link
  const [isLoading, setIsLoading] = useState(() => !isAgent && !introSeen());
  useEffect(() => {
    if (!isLoading) markAppReady();
  }, [isLoading]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQR, setShowQR] = useState(false);
  // the phone menu: one sheet, one open state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useBodyScrollLock(menuOpen);
  // keep the lazily-loaded modal mounted after first open so its exit animation plays
  const qrMountedRef = useRef(false);
  if (showQR) qrMountedRef.current = true;
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const achievements = useAchievements();

  // easter eggs
  const [showAchievements, setShowAchievements] = useState(false);
  const [disco, setDisco] = useState(false);
  const visitCount = useVisitCount();
  const isLightSpam = useRapidRepeat(10, 60000);

  useAwayTitle('come back :(');
  // after the loading screen, or the toast plays out unseen behind it
  useEffect(() => {
    if (visitCount < 2) return;
    return onAppReady(() => achievements.unlock('regular'));
  }, [visitCount, achievements.unlock]);

  useEffect(() => {
    if (!isAgent) return;
    markAppReady();
    achievements.unlock('robot');
  }, [isAgent, achievements.unlock]);

  const handleDarkModeToggle = () => {
    toggleDarkMode();
    if (isLightSpam()) {
      setDisco(true);
      achievements.unlock('indecisive');
      setTimeout(() => setDisco(false), 1800);
    }
  };

  const handleLoadingComplete = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {}
    setIsLoading(false);
    markAppReady();
  }, []);

  // overlays belong to the page they were opened on
  useEffect(() => {
    setShowQR(false);
    setShowShortcuts(false);
    setShowAchievements(false);
  }, [location.pathname]);

  // Track page visits for "explorer" achievement
  const visitedPagesRef = useRef(new Set<string>());
  useEffect(() => {
    if (currentPage === 'notfound') return;
    visitedPagesRef.current.add(currentPage);
    if (visitedPagesRef.current.size >= 3) {
      achievements.unlock('explorer');
    }
  }, [currentPage]);

  const shortcutActions = useMemo(() => ({
    setPage: (page: 'home' | 'portfolio' | 'writing' | 'memories' | 'resume') => goToPage(page, true),
    toggleHelp: () => {
      // state, not just the DOM: the lazily-loaded qr modal has a beat where it is
      // open but not mounted yet, and `?` must not stack the help dialog on top of it
      if (showQR || showAchievements) return;
      setShowShortcuts(prev => !prev);
    },
    // the footer is just a signature now, so these two live on the keyboard
    toggleAgent: () => setAgent(true),
    toggleAchievements: () => {
      if (showQR || showShortcuts) return;
      setShowAchievements(prev => !prev);
    },
    closeOverlays: () => {
      setShowShortcuts(false);
      setShowQR(false);
      setShowAchievements(false);
      setMenuOpen(false);
    },
    onShortcutUsed: () => achievements.unlock('navigator'),
  }), [goToPage, achievements.unlock, showQR, showAchievements, showShortcuts, setAgent]);

  // agent mode is a single plain document: no page switching or help dialog behind it
  useKeyboardShortcuts(shortcutActions, !isAgent);

  // the sheet belongs to the page it was opened on
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // rotating into a desktop width unmounts the sheet (`sm:hidden`), so drop the
  // open state too — otherwise the body would stay scroll-locked behind nothing
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 640px)');
    const onChange = () => {
      if (wide.matches) setMenuOpen(false);
    };
    wide.addEventListener('change', onChange);
    return () => wide.removeEventListener('change', onChange);
  }, []);

  if (isAgent) {
    return (
      <MotionConfig reducedMotion="user">
      <AchievementContext.Provider value={achievements}>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <AgentView onExit={() => setAgent(false)} />
        <AchievementToast achievement={achievements.latestUnlock} onDismiss={achievements.dismissToast} />
      </div>
      </AchievementContext.Provider>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <AchievementContext.Provider value={achievements}>
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <CustomCursor />
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>
      {/* no fade: the loader's dither dissolve is the reveal, and it should open onto the finished page */}
      <div className={`relative z-[2] ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
      {/* inside this stacking context so the nav (z-50) stays above the wipe (z-45) */}
      <PixelWipe />
      {currentPage === 'home' && <ReadingProgress />}
      {/* Scrim for the phone menu. Sits below the nav (z-40 < z-50) so the sheet and the
          toggle stay clickable; tapping it closes the menu. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-[var(--text-primary)]/10 backdrop-blur-[2px] sm:hidden"
          />
        )}
      </AnimatePresence>
      {/* Navigation */}
      <nav aria-label="primary" className={`fixed top-0 left-0 w-full [--nav-px:1rem] sm:[--nav-px:1.5rem] md:[--nav-px:3rem] xl:[--nav-px:4rem] 2xl:[--nav-px:6rem] pl-[calc(var(--nav-px)+env(safe-area-inset-left))] pr-[calc(var(--nav-px)+env(safe-area-inset-right))] py-3 sm:py-3.5 md:py-4 pointer-coarse:py-1.5 pointer-coarse:sm:py-2 flex justify-between items-center z-50 transition-[background-color,backdrop-filter] duration-300 ${menuOpen ? 'bg-[var(--bg-primary)]' : navSolid ? 'bg-[var(--nav-bg)] backdrop-blur-md' : 'bg-transparent'}`}>
        {/* Soft fade below the bar. A smooth gradient, not a dither: a fixed pixel pattern
            over scrolling pixel art makes dots look like they freeze in place. */}
        <div aria-hidden="true" className={`absolute left-0 top-full w-full h-4 pointer-events-none bg-gradient-to-b from-[var(--nav-bg)] to-transparent transition-opacity duration-300 ${navSolid ? 'opacity-100' : 'opacity-0'}`} />
        <Link to="/" className="font-mono text-xs tracking-widest font-bold hover:text-[var(--text-secondary)] transition-colors -mx-2 px-2 py-2 pointer-coarse:py-3.5">jk.</Link>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Static on purpose: weight never changes, so links don't shift when the active page changes */}
          <div className="hidden sm:flex items-center gap-2 md:gap-6 font-mono text-xs tracking-widest text-[var(--text-secondary)]">
            {PAGES.map(([page, to]) => (
              <Link
                key={page}
                to={to}
                aria-current={currentPage === page ? 'page' : undefined}
                className={`relative inline-block whitespace-nowrap px-3 py-2 pointer-coarse:py-3.5 transition-colors duration-200 ${
                  currentPage === page ? 'text-[var(--text-primary)]' : 'hover:text-[var(--text-primary)]'
                }`}
              >
                {page}
                {currentPage === page && (
                  <span className="absolute -bottom-0.5 pointer-coarse:bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--text-primary)] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* one toggle for both layouts; only the menu button is phone-only */}
          <DarkModeToggle isDark={isDark} onToggle={handleDarkModeToggle} />
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? 'mobile-menu' : undefined}
            aria-label={menuOpen ? 'close menu' : 'open menu'}
            className="grid h-11 w-11 place-items-center rounded-full text-[var(--text-primary)] transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] active:bg-[var(--bg-secondary)] sm:hidden"
          >
            {menuOpen ? <X size={19} strokeWidth={1.7} /> : <Menu size={19} strokeWidth={1.7} />}
          </button>
        </div>

        <MobileMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentPage={currentPage}
          returnFocusTo={menuButtonRef}
        />
      </nav>

      <ErrorBoundary resetKey={location.pathname}>
      <AnimatePresence mode="wait" custom={pageMotion} onExitComplete={handlePageExitComplete}>
        {currentPage === 'notfound' && (
          <motion.main
            key="notfound"
            variants={LIFT}
            custom={pageMotion}
            initial="initial"
            animate="enter"
            exit="exit"
            data-page
            tabIndex={-1}
            className="outline-none min-h-[80svh] flex flex-col items-center justify-center text-center px-4 pt-24"
          >
            <p className="font-mono text-xs tracking-widest text-[var(--text-tertiary)] mb-4">error 404</p>
            <h1 className="font-display font-bold tracking-normal text-5xl sm:text-7xl mb-4">lost the plot.</h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] font-light mb-8">this page doesn't exist (or never did).</p>
            <Link to="/" className="font-mono text-xs tracking-widest border border-[var(--border-primary)] rounded-full px-5 py-2.5 pointer-coarse:py-3.5 hover:border-[var(--text-primary)] transition-colors">
              take me home →
            </Link>
          </motion.main>
        )}

        {currentPage === 'writing' && (
          <motion.div
            key="writing"
            variants={LIFT}
            custom={pageMotion}
            initial="initial"
            animate="enter"
            exit="exit"
            data-page
            tabIndex={-1}
            className="outline-none"
          >
            <WritingPage />
          </motion.div>
        )}

        {currentPage === 'memories' && (
          <motion.div
            key="memories"
            variants={LIFT}
            custom={pageMotion}
            initial="initial"
            animate="enter"
            exit="exit"
            data-page
            tabIndex={-1}
            className="outline-none"
          >
            <Suspense fallback={<PageFallback />}><MemoriesPage /></Suspense>
          </motion.div>
        )}

        {currentPage === 'portfolio' && (
          <motion.div
            key="portfolio"
            variants={LIFT}
            custom={pageMotion}
            initial="initial"
            animate="enter"
            exit="exit"
            data-page
            tabIndex={-1}
            className="outline-none"
          >
            <Suspense fallback={<PageFallback />}><PortfolioPage /></Suspense>
          </motion.div>
        )}

        {currentPage === 'resume' && (
          <motion.div
            key="resume"
            variants={LIFT}
            custom={pageMotion}
            initial="initial"
            animate="enter"
            exit="exit"
            data-page
            tabIndex={-1}
            className="outline-none"
          >
            <Suspense fallback={<PageFallback />}><ResumePage /></Suspense>
          </motion.div>
        )}

        {currentPage === 'home' && (
          <motion.div
            key="home"
            variants={FADE}
            custom={pageMotion}
            initial="initial"
            animate="enter"
            exit="exit"
            data-page
            tabIndex={-1}
            className="outline-none"
          >
            <HeroCity isDark={isDark} />
            <main>
              <SelectedWork />
              <Filmstrip />
              <ContactSection onSaveContact={() => setShowQR(true)} />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
      </ErrorBoundary>

      {/* opaque bg: the dither band must blend into the page at its edges */}
      <footer className="relative mt-6 sm:mt-10 overflow-hidden bg-[var(--bg-primary)]">
        <DitherBand
          src="/memories/memory-19.webp"
          color="var(--dither-ink)"
          isDark={isDark}
          focusY={0.45}
          text="im him"
          className="h-[200px] sm:h-[280px] md:h-[340px] 2xl:h-[420px]"
        />
        <div className="relative -mt-2 mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 pb-[max(1.75rem,calc(env(safe-area-inset-bottom)+1rem))] text-center font-mono tracking-widest">
          <p className="text-[10px] text-[var(--text-primary)] sm:text-[11px]">jay katariya · west lafayette · pune</p>
          <p className="text-[9px] text-[var(--text-tertiary)] sm:text-[10px]">built by hand.</p>
        </div>
      </footer>

      <AchievementsPanel isOpen={showAchievements} onClose={() => setShowAchievements(false)} unlocked={achievements.unlocked} />
      <DiscoOverlay active={disco} />
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <AchievementToast achievement={achievements.latestUnlock} onDismiss={achievements.dismissToast} />
      {qrMountedRef.current && (
        <Suspense fallback={null}>
          <QRCodeModal isOpen={showQR} onClose={() => setShowQR(false)} />
        </Suspense>
      )}
      </div>
    </div>
    </AchievementContext.Provider>
    </MotionConfig>
  );
}
