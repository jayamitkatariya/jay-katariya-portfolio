import React, { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import HeroCanvas from './components/HeroCanvas';
import ReadingProgress from './components/ReadingProgress';
import LoadingScreen from './components/LoadingScreen';
import { markAppReady, onAppReady } from './lib/appReady';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import DarkModeToggle from './components/DarkModeToggle';
import AchievementToast from './components/AchievementToast';
import AchievementCounter from './components/AchievementCounter';
import SmartContactRouting from './components/SmartContactRouting';
import CustomCursor from './components/CustomCursor';
import PixelWipe from './components/PixelWipe';
import AchievementsPanel from './components/AchievementsPanel';
import DiscoOverlay from './components/DiscoOverlay';
import { useAwayTitle, useVisitCount, useRapidRepeat } from './hooks/useEasterEggs';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDarkMode } from './hooks/useDarkMode';
import { useAchievements, AchievementContext } from './hooks/useAchievements';
import { projects } from './data/projects';
import TypewriterText from './components/TypewriterText';
import AnimatedDescription from './components/AnimatedDescription';
import LifeCanvas from './components/LifeCanvas';
import SectionHeading, { PixelIcon, type SpriteName } from './components/SectionHeading';
import ExperienceList from './components/ExperienceList';
import PixelSprite from './components/PixelSprite';
import { thinkerIdea, crabWalk, runner, waver, flapMail } from './components/sprites';
import SnapshotPile from './components/SnapshotPile';
import DitherBand from './components/DitherBand';
import ErrorBoundary from './components/ErrorBoundary';
import AgentView from './components/AgentView';
import AgentModeToggle from './components/AgentModeToggle';
import { useAgentMode } from './hooks/useAgentMode';
import { about } from './data/profile';

// Route-level + heavy components load on demand to keep the first paint light
const PortfolioPage = lazy(() => import('./components/portfolio/PortfolioPage'));
const MemoriesPage = lazy(() => import('./components/MemoriesPage'));
const ResumePage = lazy(() => import('./components/ResumePage'));
const WorldMap = lazy(() => import('./components/WorldMap'));
const QRCodeModal = lazy(() => import('./components/QRCodeModal'));
const PageFallback = () => <div className="min-h-screen" />;

const currentWork = [
  {
    company: "workro",
    role: "cofounder and ceo",
    description: "building workro, an ai-native people platform backed by infinity automated solutions. workro desk and workro recruit are live with 100+ companies onboarded. more products in the pipeline."
  },
  {
    company: "infinity automated solutions pvt. ltd.",
    role: "corporate strategy & ops intern (2nd summer)",
    description: "ran audits across every department and built systems to improve efficiencies. on the deal team negotiating a full sales deal with dollar general. previously: international market assessments, M&A valuation and financial modeling. also built infinitysols.com from scratch."
  },
  {
    company: "purduethink",
    role: "senior advisory board & project manager",
    description: "6% acceptance rate. leading a 5-person team consulting for united airlines on recruiting pipeline and MileagePlus strategy. previously built short/mid/long-term strategy for careshub's $500k project."
  },
  {
    company: "random ass projects",
    role: "creator",
    description: "built tools i wished existed. cue, bucket, localmind, clickyyy, persona cli, mote, and more."
  },
  {
    company: "purdue university",
    role: "TA for MGMT100",
    description: "teaching fundamental management concepts and business principles to undergrads."
  },
  {
    company: "larsen leaders academy",
    role: "member",
    description: "top 10% of daniels school of business. certificate in entrepreneurship and innovation. 6 company treks, fully sponsored study abroad to gettysburg."
  }
];

const previousWork = [
  {
    company: "mindcord",
    role: "founder and CEO",
    description: "130k+ member global STEM, entrepreneurship, and finance community with monthly competitions. received interest from thiel fellowship, dorm room fund, and z fellows. featured in teenager today!"
  },
  {
    company: "goldman sachs",
    role: "possibilities summit program",
    description: "4% acceptance rate year-long program. completed finance case work, engaged directly with GS professionals across divisions, and developed applied knowledge in capital markets and investment strategy."
  },
  {
    company: "clemson university",
    role: "research intern",
    description: "investigated subtractive and additive manufacturing techniques under associate dean xin zhao. sole-authored 2 peer-reviewed papers published on SSRN."
  },
];

const skills = ["javascript", "react", "react native", "html/css", "python", "node.js", "postgresql", "rest apis", "excel", "matlab", "fusion 360", "hermes agent"];
const languages = ["english", "hindi", "marathi", "marwari", "sanskrit"];
const interests = ["premier league", "subway surfers", "coding", "pizza", "swimming", "soccer", "tv shows", "leg days", "robotics", "standup comedy"];

const recognition: { title: string; detail: string; icon: SpriteName }[] = [
  { title: "morgan business concept competition", detail: "special prize winner ($1K), purdue", icon: 'trophy' },
  { title: "dean's list & semester honors", detail: "purdue university", icon: 'star' },
  { title: "tks unicorn scholar", detail: "top 70 of 9,000 intl. applicants ($500)", icon: 'crown' },
  { title: "amp global youth scholar", detail: "competitive intl. scholarship ($1.6K)", icon: 'globe' },
  { title: "published researcher", detail: "2 papers on SSRN (laser physics, pollutant removal)", icon: 'book' },
  { title: "un recognition", detail: "refugee awareness campaign", icon: 'globe' },
  { title: "national cyber olympiad", detail: "top 0.02% among 5 million students", icon: 'bolt' },
  { title: "dartmouth cid alumni", detail: "$1K scholarship, creativity + innovation + design program", icon: 'cap' },
  { title: "purdue venturex2", detail: "$5K grant", icon: 'star' },
  { title: "state-level football", detail: "silver medal, u-16", icon: 'medal' },
];

type Page = 'home' | 'portfolio' | 'memories' | 'resume' | 'notfound';

const PAGE_TITLES: Record<Page, string> = {
  home: 'Jay Katariya | Integrated Business & Engineering @ Purdue',
  portfolio: 'Portfolio | Jay Katariya',
  memories: 'Memories | Jay Katariya',
  resume: 'Resume | Jay Katariya',
  notfound: 'Not found | Jay Katariya',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'good morning';
  if (hour >= 12 && hour < 17) return 'good afternoon';
  if (hour >= 17 && hour < 21) return 'good evening';
  return 'good night';
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage: Page = (() => {
    // tolerate a trailing slash (/portfolio/)
    switch (location.pathname.replace(/(.)\/+$/, '$1')) {
      case '/': return 'home';
      case '/portfolio': return 'portfolio';
      case '/memories': return 'memories';
      case '/resume': return 'resume';
      default: return 'notfound';
    }
  })();

  const goToPage = useCallback((page: 'home' | 'portfolio' | 'memories' | 'resume') => {
    const paths = { home: '/', portfolio: '/portfolio', memories: '/memories', resume: '/resume' } as const;
    navigate(paths[page]);
  }, [navigate]);

  // Scroll to top on route change. instant: html has smooth scrolling, which would
  // otherwise scroll up through the whole exiting page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    document.title = PAGE_TITLES[currentPage];
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && currentPage !== 'notfound') {
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

  const { isAgent, setAgent } = useAgentMode();
  const [showImagesInfo, setShowImagesInfo] = useState(false);
  // agent mode is for reading, not for intros
  const [isLoading, setIsLoading] = useState(() => !isAgent);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQR, setShowQR] = useState(false);
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
    setPage: (page: 'home' | 'portfolio' | 'memories' | 'resume') => goToPage(page),
    toggleHelp: () => setShowShortcuts(prev => !prev),
    closeOverlays: () => {
      setShowShortcuts(false);
      setShowQR(false);
      setShowAchievements(false);
    },
    onShortcutUsed: () => achievements.unlock('navigator'),
  }), [goToPage, achievements.unlock]);

  // agent mode is a single plain document: no page switching or help dialog behind it
  useKeyboardShortcuts(shortcutActions, !isAgent);

  // Hero parallax + scroll fade. Written straight to the DOM: React state here
  // would re-render the whole app on every scroll frame.
  const heroTextRef = useRef<HTMLDivElement>(null);
  const lifeLayerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (currentPage !== 'home') return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      // a 0-height viewport (hidden iframe, prerender) would make this NaN
      const p = vh > 0 ? Math.min(Math.max(y / (vh * 0.6), 0), 1) : 0;
      if (heroTextRef.current) {
        heroTextRef.current.style.transform = `translateY(${y * -0.12}px) scale(${1 - p * 0.15}) translateY(${p * -30}px)`;
        heroTextRef.current.style.opacity = String(1 - p * 0.8);
      }
      if (lifeLayerRef.current) lifeLayerRef.current.style.opacity = String(1 - p);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [currentPage]);

  // stable identity, or the typewriter restarts on every render
  const heroLines = useMemo(() => [
    `${getGreeting()}, integrated business & engineering, minor in psychology @ purdue`,
    'building things from first principles',
    'entrepreneur, engineer, and perpetual student',
    'currently building workro and planning world domination',
  ], []);

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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] noise-overlay">
      <CustomCursor />
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>
      {/* no fade: the loader's dither dissolve is the reveal, and it should open onto the finished page */}
      <div className={`relative z-[2] ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
      {/* inside this stacking context so the nav (z-50) stays above the wipe (z-45) */}
      <PixelWipe />
      {currentPage === 'home' && <ReadingProgress />}
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full [--nav-px:1rem] sm:[--nav-px:1.5rem] md:[--nav-px:3rem] xl:[--nav-px:4rem] 2xl:[--nav-px:6rem] pl-[calc(var(--nav-px)+env(safe-area-inset-left))] pr-[calc(var(--nav-px)+env(safe-area-inset-right))] py-3 sm:py-3.5 md:py-4 pointer-coarse:py-1.5 pointer-coarse:sm:py-2 flex justify-between items-center z-50 bg-[var(--nav-bg)] backdrop-blur-md transition-colors duration-300">
        {/* Soft fade below the bar. A smooth gradient, not a dither: a fixed pixel pattern
            over scrolling pixel art makes dots look like they freeze in place. */}
        <div aria-hidden="true" className="absolute left-0 top-full w-full h-4 pointer-events-none bg-gradient-to-b from-[var(--nav-bg)] to-transparent" />
        <Link to="/" className="font-mono text-xs tracking-widest font-bold hover:text-[var(--text-secondary)] transition-colors -mx-2 px-2 py-2 pointer-coarse:py-3.5">jk.</Link>
        {/* Static on purpose: weight never changes, so links don't shift when the active page changes */}
        <div className="flex items-center gap-0 min-[400px]:gap-1 sm:gap-2 md:gap-6 font-mono text-[10px] min-[400px]:text-[11px] sm:text-xs tracking-wider min-[400px]:tracking-widest text-[var(--text-secondary)]">
          {([['home', '/'], ['portfolio', '/portfolio'], ['memories', '/memories'], ['resume', '/resume']] as const).map(([page, to]) => (
            <Link
              key={page}
              to={to}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`relative inline-block whitespace-nowrap py-2 pointer-coarse:py-3.5 px-1.5 min-[400px]:px-2 sm:px-3 transition-colors duration-200 ${
                currentPage === page ? 'text-[var(--text-primary)]' : 'hover:text-[var(--text-primary)]'
              }`}
            >
              {page}
              {currentPage === page && (
                <span className="absolute -bottom-0.5 pointer-coarse:bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--text-primary)] rounded-full" />
              )}
            </Link>
          ))}
          <DarkModeToggle isDark={isDark} onToggle={handleDarkModeToggle} />
        </div>
      </nav>

      <ErrorBoundary resetKey={location.pathname}>
      {/* again once the old page has left: a closing overlay may have restored the old scroll position */}
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
        {currentPage === 'notfound' && (
          <motion.main
            key="notfound"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="min-h-[80svh] flex flex-col items-center justify-center text-center px-4 pt-24"
          >
            <p className="font-mono text-xs tracking-widest text-[var(--text-tertiary)] mb-4">error 404</p>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter mb-4">lost the plot.</h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] font-light mb-8">this page doesn't exist (or never did).</p>
            <Link to="/" className="font-mono text-xs tracking-widest border border-[var(--border-primary)] rounded-full px-5 py-2.5 pointer-coarse:py-3.5 hover:border-[var(--text-primary)] transition-colors">
              take me home →
            </Link>
          </motion.main>
        )}

        {currentPage === 'memories' && (
          <motion.div
            key="memories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <Suspense fallback={<PageFallback />}><MemoriesPage /></Suspense>
          </motion.div>
        )}

        {currentPage === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <Suspense fallback={<PageFallback />}><PortfolioPage /></Suspense>
          </motion.div>
        )}

        {currentPage === 'resume' && (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <Suspense fallback={<PageFallback />}><ResumePage /></Suspense>
          </motion.div>
        )}

        {currentPage === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
          {/* Hero Section */}
          <header className="relative min-h-[100svh] flex flex-col items-center justify-end pb-20 sm:pb-24 md:pb-28 short:pb-14 overflow-hidden bg-[var(--bg-primary)]">
            {/* Interactive Moving Pixels Canvas */}
            <HeroCanvas isDark={isDark} />

            {/* Faint graph-paper grid, aligned to the life cells */}
            <div
              aria-hidden="true"
              className="absolute inset-0 z-0 pointer-events-none hero-grid"
            />

            {/* Soft gradient mask to blend canvas into the background seamlessly */}
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-transparent z-0 pointer-events-none"></div>

            {/* Game of life: move the cursor to launch gliders */}
            <div ref={lifeLayerRef} className="absolute inset-0 z-[1] pointer-events-none">
              <LifeCanvas isDark={isDark} />
            </div>

            {/* Text Container */}
            <div
              ref={heroTextRef}
              className="relative z-10 text-center flex flex-col items-center px-4 sm:px-6 will-change-transform"
            >
              <h1 className="text-5xl min-[400px]:text-6xl md:text-8xl short:text-6xl lg:text-[10rem] xl:text-[12rem] 2xl:text-[14rem] font-bold tracking-tighter mb-3 sm:mb-4 md:mb-6 leading-none text-[var(--text-primary)]">
                jay katariya
              </h1>
              {/* lines reserved for the longest one (three on the narrowest phones, two below xl), so the name doesn't bob as lines type */}
              <div className="font-mono text-[9px] sm:text-[10px] md:text-xs lg:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase text-[var(--text-secondary)] font-medium mb-4 sm:mb-5 min-h-[3em] max-[359px]:min-h-[4.5em] xl:min-h-[1.5em]">
                <TypewriterText
                  texts={heroLines}
                  typingSpeed={40}
                  deletingSpeed={25}
                  pauseDuration={3000}
                />
              </div>
            </div>

            <div className="absolute bottom-8 sm:bottom-10 md:bottom-12 hidden sm:flex short:hidden flex-col items-center gap-4 font-mono text-[10px] text-[var(--text-tertiary)] z-10">
              <div className="w-5 h-8 border border-[var(--text-tertiary)] rounded-full flex justify-center p-1">
                <div className="w-1 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce"></div>
              </div>
              <span className="tracking-[0.2em] uppercase">scroll down</span>
            </div>

            <div className="absolute bottom-5 left-4 sm:bottom-8 sm:left-6 md:bottom-12 md:left-12 short:bottom-4 z-20 flex flex-col items-start text-left font-mono text-[9px] sm:text-[10px] text-[var(--text-tertiary)] tracking-widest uppercase">
              <button
                onClick={() => setShowImagesInfo(!showImagesInfo)}
                aria-expanded={showImagesInfo}
                className="hover:text-[var(--text-primary)] transition-colors opacity-70 hover:opacity-100 cursor-pointer text-left flex items-center gap-2 pointer-coarse:py-3 pointer-coarse:-my-3"
              >
                <span className="text-lg leading-none">{showImagesInfo ? '−' : '+'}</span> what are these images?
              </button>
              {showImagesInfo && (
                <div className="mt-3 opacity-70 max-w-[200px] leading-relaxed animate-fade-up">
                  taj mahal • messi • jeff bezos • jensen huang • mark zuckerberg • the GOATs.
                </div>
              )}
            </div>
          </header>

            {/* Ambient floating orbs */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden hidden dark:block">
              <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px] animate-float-orb" />
              <div className="absolute top-[60%] right-[15%] w-[250px] h-[250px] rounded-full bg-cyan-500/5 blur-[80px] animate-float-orb-slow" />
              <div className="absolute bottom-[20%] left-[40%] w-[200px] h-[200px] rounded-full bg-amber-500/5 blur-[60px] animate-float-orb-delayed" />
            </div>

          <main className="relative z-10">
            {/* About Section */}
            <section id="about" className="relative max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 md:pt-32 pb-10 sm:pb-14 md:pb-16">
              <div className="md:flex md:items-center md:gap-6">
              <div className="max-w-3xl md:flex-1 md:min-w-0 lg:flex-none lg:w-[48rem] flex flex-col gap-4 sm:gap-5 md:gap-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] font-light leading-relaxed">
                <SectionHeading text="about" icon="smile" color="text-indigo-500" className="!mb-0 sm:!mb-1" />
                {about.map(p => <p key={p}>{p}</p>)}
                <div className="mt-3 sm:mt-4 p-4 sm:p-6 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] rounded-lg">
                  <p className="text-xs sm:text-sm font-mono text-[var(--text-secondary)] leading-relaxed">
                    confirmation bias reminds us we see what we expect. this site is a snapshot of a fraction of my life, but i hope you'll look beyond it to see the whole picture.
                  </p>
                </div>
              </div>
              {/* tablet/laptop widths only: a thinker whose idea lights up, centred in the free space beside the text */}
              <div aria-hidden="true" className="hidden md:flex md:w-24 lg:w-auto lg:flex-1 items-center justify-center pointer-events-none">
                <div className="text-indigo-500 w-20 lg:w-28 xl:w-44">
                  <PixelSprite frames={thinkerIdea} fps={3} />
                </div>
              </div>
            </div>
            </section>

            <ExperienceList
              id="work"
              title="what i'm up to"
              icon="bolt"
              color="text-blue-500"
              items={currentWork}
              caption="ongoing"
              live
              mascot={
                <div className="relative h-20 xl:h-24 [--sprite:5rem] xl:[--sprite:6rem]">
                  <div className="absolute inset-x-0 top-0 animate-lane-run">
                    <div className="animate-lane-flip text-blue-500 w-(--sprite) aspect-square">
                      <PixelSprite frames={crabWalk} fps={8} accent="#facc15" />
                    </div>
                  </div>
                </div>
              }
            />
            <ExperienceList
              id="previously"
              title="previously"
              icon="hourglass"
              color="text-red-500"
              items={previousWork}
              caption="before"
              mascot={
                <div className="relative h-20 xl:h-24 [--sprite:5rem] xl:[--sprite:6rem]">
                  <div className="absolute inset-x-0 top-0 animate-lane-run">
                    <div className="animate-lane-flip text-red-500 w-(--sprite) aspect-square">
                      <PixelSprite frames={runner} fps={8} />
                    </div>
                  </div>
                </div>
              }
            />

            {/* Recognition */}
            <section id="recognition" className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
              <SectionHeading text="recognition" icon="trophy" color="text-amber-500" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {recognition.map((item, i) => {
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.5, delay: (i % 2) * 0.06 + Math.floor(i / 2) * 0.05, ease: [0.23, 1, 0.32, 1] }}
                      className="group relative px-4 py-3.5 sm:px-5 sm:py-4 border border-[var(--border-primary)] rounded-xl hover:border-amber-500/40 hover:bg-[var(--bg-secondary)]/60 transition-colors duration-300 cursor-default"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 text-amber-500/50 group-hover:text-amber-500 group-hover:-translate-y-px transition-all duration-300">
                          <PixelIcon name={item.icon} size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-xs sm:text-sm text-[var(--text-primary)] font-medium leading-snug group-hover:text-amber-500 transition-colors duration-300">
                            {item.title}
                          </p>
                          <p className="text-[11px] sm:text-xs text-[var(--text-tertiary)] font-light mt-0.5 leading-relaxed">
                            <AnimatedDescription text={item.detail} />
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Skills & Interests */}
            <section id="skills" className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14 overflow-hidden">
              <SectionHeading text="skills & interests" icon="heart" color="text-emerald-500" />

              {/* Technical Skills Marquee */}
              <div className="mb-5 sm:mb-6">
                <h3 className="font-mono text-xs tracking-widest text-[var(--text-primary)] mb-3 sm:mb-4">technical</h3>
                <div className="relative group/marquee marquee-fade">
                  <div className="flex animate-marquee-left w-max">
                    {[...skills, ...skills, ...skills, ...skills].map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        // the repeats only fill the loop; screen readers get the list once
                        aria-hidden={i >= skills.length || undefined}
                        className="px-3 py-1.5 text-sm font-light text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-full hover:text-emerald-500 hover:border-emerald-500/40 transition-colors cursor-default mx-1 shrink-0"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="mb-5 sm:mb-6">
                <h3 className="font-mono text-xs tracking-widest text-[var(--text-primary)] mb-3 sm:mb-4">languages</h3>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {languages.map(s => (
                    <span key={s} className="px-3 py-1.5 text-sm font-light text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-full hover:text-emerald-500 hover:border-emerald-500/40 transition-colors cursor-default">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interests Marquee (reverse direction) */}
              <div>
                <h3 className="font-mono text-xs tracking-widest text-[var(--text-primary)] mb-3 sm:mb-4">interests</h3>
                <div className="relative group/marquee marquee-fade">
                  <div className="flex animate-marquee-right w-max">
                    {[...interests, ...interests, ...interests, ...interests].map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        aria-hidden={i >= interests.length || undefined}
                        className="px-3 py-1.5 text-sm font-light text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-full hover:text-emerald-500 hover:border-emerald-500/40 transition-colors cursor-default mx-1 shrink-0"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Snapshots */}
            <section id="snapshots" className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
              <SectionHeading text="snapshots" icon="camera" color="text-pink-500" />
              <SnapshotPile />
            </section>

            {/* Where I've Been */}
            <section className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-10 md:pt-14 pb-10 sm:pb-12 md:pb-14">
              <SectionHeading text="where i've been" icon="globe" color="text-cyan-500" />
              <Suspense fallback={<div className="aspect-[1000/430] w-full" />}>
                <WorldMap isDark={isDark} />
              </Suspense>
            </section>

            {/* Contact */}
            <section id="contact" className="relative max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14 text-center">
              {/* tablet/laptop widths only: pixel mascots in the top corners */}
              <div aria-hidden="true" className="hidden md:block absolute top-6 xl:top-8 left-[max(calc(50%_-_50vw_+_0.75rem),calc(25%_-_25vw_-_var(--half)),-22rem)] [--half:1.5rem] lg:[--half:2rem] xl:[--half:3.5rem] w-12 lg:w-16 xl:w-28 text-purple-500 pointer-events-none">
                <PixelSprite frames={waver} fps={3} />
              </div>
              <div aria-hidden="true" className="hidden md:block absolute top-6 xl:top-8 right-[max(calc(50%_-_50vw_+_0.75rem),calc(25%_-_25vw_-_var(--half)),-22rem)] [--half:1.5rem] lg:[--half:2rem] xl:[--half:3.5rem] w-12 lg:w-16 xl:w-28 text-purple-500 pointer-events-none">
                <div className="animate-sprite-bob">
                  <PixelSprite frames={flapMail} fps={3} />
                </div>
              </div>
              <SectionHeading text="get in touch" icon="mail" color="text-purple-500" align="center" />
              <p className="text-base sm:text-xl md:text-2xl text-[var(--text-secondary)] font-light mb-4 sm:mb-6 leading-relaxed">
                always excited to meet new people and explore interesting opportunities.
              </p>
              <SmartContactRouting />
              <button
                onClick={() => setShowQR(true)}
                className="mt-8 pointer-coarse:mt-5 pointer-coarse:py-3.5 font-mono text-[10px] sm:text-xs tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors uppercase"
              >
                [ save my contact ]
              </button>
            </section>
          </main>
          </motion.div>
        )}
      </AnimatePresence>
      </ErrorBoundary>

      {/* opaque bg: the fixed noise grain must not show through the band's gaps, or it reads as dots that don't scroll */}
      <footer className="relative mt-6 sm:mt-10 overflow-hidden bg-[var(--bg-primary)]">
        <DitherBand
          src="/memories/memory-19.webp"
          color="var(--dither-ink)"
          isDark={isDark}
          focusY={0.45}
          text="im him"
          className="h-[200px] sm:h-[280px] md:h-[340px] 2xl:h-[420px]"
        />
        <div className="relative -mt-2 max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6 font-mono tracking-widest">
          <div className="md:col-span-6 flex flex-col items-start gap-2.5 sm:gap-3 text-[10px] sm:text-xs text-[var(--text-tertiary)]">
            <Link to="/" className="text-sm font-bold text-[var(--text-primary)] mb-1 pointer-coarse:py-2.5 pointer-coarse:-my-2.5">jk.</Link>
            <p>built with react, typescript, and tailwind css</p>
            <AgentModeToggle isAgent={false} onToggle={() => setAgent(true)} />
            {visitCount >= 2 && <p>welcome back, visit #{visitCount}</p>}
            <AchievementCounter earned={achievements.earned} total={achievements.total} onClick={() => setShowAchievements(true)} />
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">© {new Date().getFullYear()} jay katariya.</p>
          </div>
          <div className="md:col-span-6 grid grid-cols-2 gap-6 text-[11px] sm:text-xs md:justify-items-end">
            <div className="flex flex-col gap-2 pointer-coarse:gap-0">
              <span className="text-[var(--text-tertiary)] mb-1">pages</span>
              {([['home', '/'], ['portfolio', '/portfolio'], ['memories', '/memories'], ['resume', '/resume']] as const).map(([label, to]) => (
                <Link key={to} to={to} className="footer-link text-[var(--text-primary)] w-fit pointer-coarse:py-3">{label}</Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 pointer-coarse:gap-0">
              <span className="text-[var(--text-tertiary)] mb-1">elsewhere</span>
              <a href="https://linkedin.com/in/jkatariya" target="_blank" rel="noreferrer" className="footer-link text-[var(--text-primary)] w-fit pointer-coarse:py-3">linkedin</a>
              <a href="mailto:jkatariy@purdue.edu" className="footer-link text-[var(--text-primary)] w-fit pointer-coarse:py-3">email</a>
              <a href="/jay-katariya-resume.pdf" target="_blank" rel="noreferrer" className="footer-link text-[var(--text-primary)] w-fit pointer-coarse:py-3">resume.pdf</a>
            </div>
          </div>
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
