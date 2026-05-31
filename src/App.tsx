import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Award, Medal, BookOpen, Globe, Zap, Crown } from 'lucide-react';
import WorldMap from './components/WorldMap';
import HeroCanvas from './components/HeroCanvas';
import FloatingSearchBar from './components/FloatingSearchBar';
import MemoriesPage from './components/MemoriesPage';
import ReadingProgress from './components/ReadingProgress';
import LoadingScreen from './components/LoadingScreen';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import DarkModeToggle from './components/DarkModeToggle';
import AchievementToast from './components/AchievementToast';
import AchievementCounter from './components/AchievementCounter';
import SmartContactRouting from './components/SmartContactRouting';
import MagneticButton from './components/MagneticButton';
import CustomCursor from './components/CustomCursor';
import QRCodeModal from './components/QRCodeModal';
import PortfolioPage from './components/portfolio/PortfolioPage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDarkMode } from './hooks/useDarkMode';
import { useAchievements, AchievementContext } from './hooks/useAchievements';
import { useParallax } from './hooks/useParallax';
import { useScrollSection } from './hooks/useScrollSection';
import { projects } from './data/projects';
import ResumePage from './components/ResumePage';
import ProactiveBubble from './components/ProactiveBubble';
import TextScramble from './components/TextScramble';
import TypewriterText from './components/TypewriterText';
import AnimatedDescription from './components/AnimatedDescription';

const currentWork = [
  {
    company: "workro",
    role: "cofounder and ceo",
    description: "building workro — an ai-native people platform backed by infinity automated solutions. shipped workro desk, workro recruit, and workro people (launching soon). beta is done. 20+ companies onboarded. out of beta and growing fast."
  },
  {
    company: "infinity automated solutions pvt. ltd.",
    role: "corporate strategy & operations intern",
    description: "international market assessments, M&A valuation and financial modeling, and operational workflow optimization. also built and launched infinitysols.com from scratch."
  },
  {
    company: "purduethink",
    role: "senior advisory board & project manager",
    description: "6% acceptance rate. leading a 5-person team consulting for united airlines on recruiting pipeline and MileagePlus strategy. previously built short/mid/long-term strategy for careshub's $500k project."
  },
  {
    company: "random ass projects",
    role: "creator",
    description: "built tools i wished existed — notabook.xyz, typeshitt.vercel.app, planout.me, and more."
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

const skills = ["javascript", "react", "react native", "html/css", "python", "node.js", "postgresql", "rest apis", "excel", "matlab", "fusion 360"];
const languages = ["english", "hindi", "marathi", "marwari", "sanskrit"];
const interests = ["premier league", "subway surfers", "coding", "pizza", "swimming", "soccer", "tv shows", "leg days", "robotics", "standup comedy"];

const recognition = [
  { title: "morgan business concept competition", detail: "special prize winner ($1K), purdue", icon: Trophy },
  { title: "dean's list & semester honors", detail: "purdue university", icon: Award },
  { title: "tks unicorn scholar", detail: "top 70 of 9,000 intl. applicants ($500)", icon: Crown },
  { title: "amp global youth scholar", detail: "competitive intl. scholarship ($1.6K)", icon: Globe },
  { title: "published researcher", detail: "2 papers on SSRN (laser physics, pollutant removal)", icon: BookOpen },
  { title: "un recognition", detail: "refugee awareness campaign", icon: Globe },
  { title: "national cyber olympiad", detail: "top 0.02% among 5 million students", icon: Zap },
  { title: "state-level football", detail: "silver medal, u-16", icon: Medal },
];

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

  const currentPage: 'home' | 'portfolio' | 'memories' | 'resume' = (() => {
    switch (location.pathname) {
      case '/portfolio': return 'portfolio';
      case '/memories': return 'memories';
      case '/resume': return 'resume';
      default: return 'home';
    }
  })();

  const goToPage = useCallback((page: 'home' | 'portfolio' | 'memories' | 'resume') => {
    const paths = { home: '/', portfolio: '/portfolio', memories: '/memories', resume: '/resume' } as const;
    navigate(paths[page]);
  }, [navigate]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [showImagesInfo, setShowImagesInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const achievements = useAchievements();

  const handleLoadingComplete = useCallback(() => setIsLoading(false), []);

  // Track page visits for "explorer" achievement
  const visitedPagesRef = useRef(new Set<string>(['home']));
  useEffect(() => {
    visitedPagesRef.current.add(currentPage);
    if (visitedPagesRef.current.size >= 3) {
      achievements.unlock('explorer');
    }
  }, [currentPage]);

  const shortcutActions = useMemo(() => ({
    setPage: (page: 'home' | 'portfolio' | 'memories' | 'resume') => goToPage(page),
    openChat: () => setIsChatOpen(true),
    toggleHelp: () => setShowShortcuts(prev => !prev),
    closeOverlays: () => {
      setIsChatOpen(false);
      setShowShortcuts(false);
    },
    onShortcutUsed: () => achievements.unlock('navigator'),
  }), [goToPage, achievements.unlock]);

  useKeyboardShortcuts(shortcutActions);

  const heroParallax = useParallax(currentPage === 'home' ? -0.12 : 0);

  // Hero scroll fade effect
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [hoveredExp, setHoveredExp] = useState<number | null>(null);
  const [hoveredPrev, setHoveredPrev] = useState<number | null>(null);
  const [hoveredRecognition, setHoveredRecognition] = useState<number | null>(null);
  useEffect(() => {
    if (currentPage !== 'home') {
      setHeroScrollProgress(0);
      return;
    }
    const handleScroll = () => {
      const vh = window.innerHeight;
      const progress = Math.min(window.scrollY / (vh * 0.6), 1);
      setHeroScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage]);


  // Scroll section detection for proactive bubble
  const scrollSection = useScrollSection(currentPage === 'home');
  const hasInteractedWithChat = useRef(false);

  // Chat action handler — site control from chat
  const handleChatAction = useCallback((action: string) => {
    if (action === 'toggleDarkMode') {
      toggleDarkMode();
    } else if (action.startsWith('navigate:')) {
      const path = action.slice('navigate:'.length);
      navigate(path);
      setIsChatOpen(false);
    } else if (action.startsWith('scrollTo:')) {
      const id = action.slice('scrollTo:'.length);
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [toggleDarkMode, navigate, location.pathname]);

  return (
    <AchievementContext.Provider value={achievements}>
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] noise-overlay">
      <CustomCursor />
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>
      <div className={`relative z-[2] ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}>
      {currentPage === 'home' && <ReadingProgress />}
      {/* Navigation */}
      <nav className="fixed top-0 w-full px-4 py-3 sm:px-6 sm:py-3.5 md:px-12 md:py-4 xl:px-16 2xl:px-24 flex justify-between items-center z-50 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--border-secondary)] transition-all duration-300">
        <MagneticButton strength={0.2} radius={80}>
          <Link to="/" className="font-mono text-xs tracking-widest font-bold hover:text-[var(--text-secondary)] transition-colors">jk.</Link>
        </MagneticButton>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-6 font-mono text-[11px] sm:text-xs tracking-widest text-[var(--text-secondary)]">
          <MagneticButton strength={0.2} radius={60}>
            <Link to="/" className={`py-2 px-2 sm:px-3 hover:text-[var(--text-primary)] transition-colors relative ${currentPage === 'home' ? 'text-[var(--text-primary)] font-semibold' : ''}`}>
              home
              {currentPage === 'home' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--text-primary)] rounded-full"></span>}
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.2} radius={60}>
            <Link to="/portfolio" className={`py-2 px-2 sm:px-3 hover:text-[var(--text-primary)] transition-colors relative ${currentPage === 'portfolio' ? 'text-[var(--text-primary)] font-semibold' : ''}`}>
              portfolio
              {currentPage === 'portfolio' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--text-primary)] rounded-full"></span>}
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.2} radius={60}>
            <Link to="/memories" className={`py-2 px-2 sm:px-3 hover:text-[var(--text-primary)] transition-colors relative ${currentPage === 'memories' ? 'text-[var(--text-primary)] font-semibold' : ''}`}>
              memories
              {currentPage === 'memories' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--text-primary)] rounded-full"></span>}
            </Link>
          </MagneticButton>
          <MagneticButton strength={0.2} radius={60}>
            <Link to="/resume" className={`py-2 px-2 sm:px-3 hover:text-[var(--text-primary)] transition-colors relative ${currentPage === 'resume' ? 'text-[var(--text-primary)] font-semibold' : ''}`}>
              resume
              {currentPage === 'resume' && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--text-primary)] rounded-full"></span>}
            </Link>
          </MagneticButton>
          <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {currentPage === 'memories' && (
          <motion.div
            key="memories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <MemoriesPage />
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
            <PortfolioPage />
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
            <ResumePage />
          </motion.div>
        )}

        {currentPage === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="animate-in fade-in duration-700"
          >
          {/* Hero Section */}
          <header className="relative min-h-screen flex flex-col items-center justify-end pb-20 sm:pb-24 md:pb-28 overflow-hidden bg-[var(--bg-primary)]">
            {/* Interactive Moving Pixels Canvas */}
            <HeroCanvas isDark={isDark} />

            {/* Soft gradient mask to blend canvas into the background seamlessly */}
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-transparent z-0 pointer-events-none"></div>

            {/* Text Container */}
            <div
              className="relative z-10 text-center flex flex-col items-center px-4 sm:px-6"
              style={{
                ...heroParallax,
                transform: `${heroParallax.transform || ''} scale(${1 - heroScrollProgress * 0.15}) translateY(${heroScrollProgress * -30}px)`,
                opacity: 1 - heroScrollProgress * 0.8,
                transition: 'none',
              }}
            >
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] xl:text-[12rem] 2xl:text-[14rem] font-bold tracking-tighter mb-3 sm:mb-4 md:mb-6 leading-none text-[var(--text-primary)]">
                jay katariya
              </h1>
              <div className="font-mono text-[9px] sm:text-[10px] md:text-xs lg:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase text-[var(--text-secondary)] font-medium mb-4 sm:mb-5 min-h-[1.5em]">
                <TypewriterText
                  texts={[
                    `${getGreeting()} — integrated business & engineering, minor in psychology @ purdue`,
                    'building things from first principles',
                    'entrepreneur, engineer, and perpetual student',
                    'currently building workro and planning world domination',
                  ]}
                  typingSpeed={40}
                  deletingSpeed={25}
                  pauseDuration={3000}
                />
              </div>
            </div>

            <div className="absolute bottom-8 sm:bottom-10 md:bottom-12 hidden sm:flex flex-col items-center gap-4 font-mono text-[10px] text-[var(--text-tertiary)] z-10">
              <div className="w-5 h-8 border border-[var(--text-tertiary)] rounded-full flex justify-center p-1">
                <div className="w-1 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce"></div>
              </div>
              <span className="tracking-[0.2em] uppercase">scroll down</span>
            </div>

            <div className="absolute bottom-5 left-4 sm:bottom-8 sm:left-6 md:bottom-12 md:left-12 z-20 flex flex-col items-start text-left font-mono text-[9px] sm:text-[10px] text-[var(--text-tertiary)] tracking-widest uppercase">
              <button
                onClick={() => setShowImagesInfo(!showImagesInfo)}
                className="hover:text-[var(--text-primary)] transition-colors opacity-70 hover:opacity-100 cursor-pointer text-left flex items-center gap-2"
              >
                <span className="text-lg leading-none">{showImagesInfo ? '−' : '+'}</span> what are these images?
              </button>
              {showImagesInfo && (
                <div className="mt-3 opacity-70 max-w-[200px] leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
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
            <section id="about" className="max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 md:pt-32 pb-10 sm:pb-14 md:pb-16">
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] font-light leading-relaxed">
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-indigo-500 mb-2 sm:mb-4">
                  <TextScramble text="about" />
                </h2>
                <p>
                  hey, i'm currently studying integrated business and engineering at purdue because i like understanding things from first principles. i crave the feeling of creating something out of nothing.
                </p>
                <p>
                  i like to write code, build innovative platforms, do entrepreneurship, produce projects, and philosophize.
                </p>
                <div className="mt-3 sm:mt-4 p-4 sm:p-6 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] rounded-lg">
                  <p className="text-xs sm:text-sm font-mono text-[var(--text-secondary)] leading-relaxed">
                    confirmation bias reminds us we see what we expect. this site is a snapshot of a fraction of my life, but i hope you'll look beyond it to see the whole picture.
                  </p>
                </div>
              </div>
            </section>

            {/* What I'm Up To */}
            <section id="work" className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-blue-500 mb-4 sm:mb-5 md:mb-6">
                <TextScramble text="what i'm up to" />
              </h2>
              <div className="flex flex-col border-t border-[var(--border-primary)] relative">
                {/* Timeline connector */}
                <div className="absolute left-0 md:left-[-24px] top-0 bottom-0 w-px bg-[var(--border-primary)] hidden md:block" />
                {currentWork.map((exp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                    onMouseEnter={() => setHoveredExp(i)}
                    onMouseLeave={() => setHoveredExp(null)}
                    className={`group border-b border-[var(--border-primary)] py-5 sm:py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-6 transition-all duration-300 px-4 sm:px-6 -mx-4 sm:-mx-6 rounded-2xl cursor-default relative ${
                      hoveredExp !== null && hoveredExp !== i ? 'opacity-40' : 'opacity-100'
                    } ${hoveredExp === i ? 'bg-[var(--bg-secondary)]/80' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-blue-500/30 border border-blue-500/50 hidden md:block transition-all duration-300 group-hover:scale-150 group-hover:bg-blue-500/60" />
                    {/* Left border glow on hover */}
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-blue-500/0 rounded-full transition-all duration-300 group-hover:bg-blue-500/40" />
                    <div className="md:col-span-4 flex flex-col gap-1 sm:gap-2 transition-transform duration-300 group-hover:translate-x-2">
                      <span className="font-mono text-xs sm:text-sm text-[var(--text-primary)] font-medium">{exp.company}</span>
                      <span className="font-mono text-[11px] sm:text-xs text-[var(--text-tertiary)] tracking-wide">{exp.role}</span>
                    </div>
                    <div className="md:col-span-8 text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed transition-transform duration-300 group-hover:translate-x-1">
                      <AnimatedDescription text={exp.description} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Previously */}
            <section id="previously" className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-red-500 mb-4 sm:mb-5 md:mb-6">
                <TextScramble text="previously" />
              </h2>
              <div className="flex flex-col border-t border-[var(--border-primary)] relative">
                {/* Timeline connector */}
                <div className="absolute left-0 md:left-[-24px] top-0 bottom-0 w-px bg-[var(--border-primary)] hidden md:block" />
                {previousWork.map((exp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                    onMouseEnter={() => setHoveredPrev(i)}
                    onMouseLeave={() => setHoveredPrev(null)}
                    className={`group border-b border-[var(--border-primary)] py-5 sm:py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-6 transition-all duration-300 px-4 sm:px-6 -mx-4 sm:-mx-6 rounded-2xl cursor-default relative ${
                      hoveredPrev !== null && hoveredPrev !== i ? 'opacity-40' : 'opacity-100'
                    } ${hoveredPrev === i ? 'bg-[var(--bg-secondary)]/80' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-red-500/30 border border-red-500/50 hidden md:block transition-all duration-300 group-hover:scale-150 group-hover:bg-red-500/60" />
                    {/* Left border glow on hover */}
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-red-500/0 rounded-full transition-all duration-300 group-hover:bg-red-500/40" />
                    <div className="md:col-span-4 flex flex-col gap-1 sm:gap-2 transition-transform duration-300 group-hover:translate-x-2">
                      <span className="font-mono text-xs sm:text-sm text-[var(--text-primary)] font-medium">{exp.company}</span>
                      <span className="font-mono text-[11px] sm:text-xs text-[var(--text-tertiary)] tracking-wide">{exp.role}</span>
                    </div>
                    <div className="md:col-span-8 text-sm sm:text-base text-[var(--text-secondary)] font-light leading-relaxed transition-transform duration-300 group-hover:translate-x-1">
                      <AnimatedDescription text={exp.description} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Recognition */}
            <section id="recognition" className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14">
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-amber-500 mb-4 sm:mb-5 md:mb-6">
                <TextScramble text="recognition" />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {recognition.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, rotateX: 45, y: 20 }}
                      whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.5, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                      onMouseEnter={() => setHoveredRecognition(i)}
                      onMouseLeave={() => setHoveredRecognition(null)}
                      className={`group relative px-4 py-3.5 sm:px-5 sm:py-4 border border-[var(--border-primary)] rounded-xl hover:border-amber-500/30 hover:bg-[var(--bg-secondary)]/60 transition-all duration-300 cursor-default ${
                        hoveredRecognition !== null && hoveredRecognition !== i ? 'opacity-40' : 'opacity-100'
                      }`}
                      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 text-amber-500/40 group-hover:text-amber-500 transition-colors duration-300">
                          <Icon size={16} strokeWidth={1.5} />
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
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-emerald-500 mb-4 sm:mb-5 md:mb-6">
                <TextScramble text="skills & interests" />
              </h2>

              {/* Technical Skills Marquee */}
              <div className="mb-5 sm:mb-6">
                <h3 className="font-mono text-xs tracking-widest text-[var(--text-primary)] mb-3 sm:mb-4">technical</h3>
                <div className="relative group/marquee">
                  <div className="flex animate-marquee-left w-max">
                    {[...skills, ...skills, ...skills, ...skills].map((s, i) => (
                      <span
                        key={`${s}-${i}`}
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
                <div className="relative group/marquee">
                  <div className="flex animate-marquee-right w-max">
                    {[...interests, ...interests, ...interests, ...interests].map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        className="px-3 py-1.5 text-sm font-light text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-full hover:text-emerald-500 hover:border-emerald-500/40 transition-colors cursor-default mx-1 shrink-0"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Where I've Been */}
            <section className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-10 md:pt-14 pb-10 sm:pb-12 md:pb-14">
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-cyan-500 mb-4 sm:mb-5 md:mb-6">
                <TextScramble text="where i've been" />
              </h2>
              <WorldMap isDark={isDark} />
            </section>

            {/* Contact */}
            <section id="contact" className="max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-14 text-center">
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-purple-500 mb-4 sm:mb-6">
                <TextScramble text="get in touch" />
              </h2>
              <p className="text-base sm:text-xl md:text-2xl text-[var(--text-secondary)] font-light mb-4 sm:mb-6 leading-relaxed">
                always excited to meet new people and explore interesting opportunities.
              </p>
              <SmartContactRouting onOpenChat={() => setIsChatOpen(true)} />
              <button
                onClick={() => setShowQR(true)}
                className="mt-8 font-mono text-[10px] sm:text-xs tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors uppercase"
              >
                [ save my contact ]
              </button>
            </section>
          </main>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-[var(--border-secondary)] pt-6 sm:pt-8 pb-14 sm:pb-16 text-center flex flex-col items-center gap-2 sm:gap-3 px-4">
        <p className="font-mono text-[10px] sm:text-xs text-[var(--text-tertiary)] tracking-widest">
          built with react, typescript, and tailwind css
        </p>
        <AchievementCounter earned={achievements.earned} total={achievements.total} />
        <p className="font-mono text-[9px] sm:text-[10px] text-[var(--text-muted)] tracking-widest">
          © {new Date().getFullYear()} jay katariya.
        </p>
      </footer>

      <FloatingSearchBar isOpen={isChatOpen} setIsOpen={setIsChatOpen} onFirstMessage={() => { achievements.unlock('curious_mind'); hasInteractedWithChat.current = true; }} onAction={handleChatAction} projects={projects} />
      <ProactiveBubble
        currentPage={currentPage}
        scrollSection={scrollSection}
        isChatOpen={isChatOpen}
        hasInteracted={hasInteractedWithChat.current}
        onOpenChat={() => setIsChatOpen(true)}
      />
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <AchievementToast achievement={achievements.latestUnlock} onDismiss={achievements.dismissToast} />
      <QRCodeModal isOpen={showQR} onClose={() => setShowQR(false)} />
      </div>
    </div>
    </AchievementContext.Provider>
  );
}
