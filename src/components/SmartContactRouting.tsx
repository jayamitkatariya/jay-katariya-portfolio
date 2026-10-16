import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PixelFill from './PixelFill';

const OPTIONS = [
  { key: 'hiring', label: 'hiring', href: 'https://linkedin.com/in/jkatariya', external: true },
  { key: 'question', label: 'quick question', href: 'mailto:jkatariy@purdue.edu?subject=quick%20question', external: false },
  { key: 'collab', label: 'collaboration', href: 'mailto:jkatariy@purdue.edu', external: false },
  { key: 'hello', label: 'just saying hi', href: 'mailto:jkatariy@purdue.edu?subject=hi%21', external: false },
] as const;

export default function SmartContactRouting() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (key: string) => {
    setSelected(key);
    const opt = OPTIONS.find(o => o.key === key);
    if (!opt) return;
    if (opt.external) {
      // open synchronously inside the click, or Safari's popup blocker eats it
      window.open(opt.href, '_blank', 'noopener,noreferrer');
    } else {
      setTimeout(() => {
        window.location.href = opt.href;
      }, 300);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {!selected ? (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <p className="font-mono text-xs text-[var(--text-tertiary)] tracking-wider mb-2">
              what would you like to discuss?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleClick(opt.key)}
                  className="group relative overflow-hidden border border-[var(--border-primary)] rounded-full px-5 sm:px-6 py-3 font-mono text-xs sm:text-sm hover:border-[var(--text-primary)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <PixelFill />
                  <span className="relative transition-colors duration-150 group-hover:delay-100 group-hover:text-[var(--bg-primary)]">{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <p className="font-mono text-sm text-[var(--text-secondary)]">
              {selected === 'hiring' ? 'opening linkedin...' : 'opening email...'}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="py-2.5 font-mono text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-4"
            >
              go back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback contact info */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-0 sm:gap-x-2 font-mono text-[11px] sm:text-xs text-[var(--text-tertiary)]">
        <a href="mailto:jkatariy@purdue.edu" className="inline-flex items-center min-h-10 px-2 hover:text-[var(--text-primary)] transition-colors">jkatariy@purdue.edu</a>
        <span className="hidden sm:inline">·</span>
        <a href="tel:+17655438168" className="inline-flex items-center min-h-10 px-2 hover:text-[var(--text-primary)] transition-colors">(765) 543-8168</a>
        <span className="hidden sm:inline">·</span>
        <a href="https://linkedin.com/in/jkatariya" target="_blank" rel="noreferrer" className="inline-flex items-center min-h-10 px-2 hover:text-[var(--text-primary)] transition-colors">linkedin</a>
      </div>
    </div>
  );
}
