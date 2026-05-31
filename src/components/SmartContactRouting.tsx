import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SmartContactRoutingProps {
  onOpenChat: () => void;
}

const OPTIONS = [
  { key: 'hiring', label: 'hiring', href: 'https://linkedin.com/in/jkatariya', external: true },
  { key: 'question', label: 'quick question', href: '', external: false },
  { key: 'collab', label: 'collaboration', href: 'mailto:jkatariy@purdue.edu', external: false },
  { key: 'hello', label: 'just saying hi', href: 'mailto:jkatariy@purdue.edu?subject=hi!', external: false },
] as const;

export default function SmartContactRouting({ onOpenChat }: SmartContactRoutingProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (key: string) => {
    setSelected(key);
    if (key === 'question') {
      onOpenChat();
      return;
    }
    const opt = OPTIONS.find(o => o.key === key);
    if (opt?.href) {
      setTimeout(() => {
        window.open(opt.href, opt.external ? '_blank' : '_self');
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
                  className="border border-[var(--border-primary)] rounded-full px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-xs sm:text-sm hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] hover:border-[var(--text-primary)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  {opt.label}
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
              {selected === 'question' ? 'opening chat...' : selected === 'hiring' ? 'opening linkedin...' : 'opening email...'}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="font-mono text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-4"
            >
              go back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback contact info */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 font-mono text-[10px] sm:text-xs text-[var(--text-tertiary)]">
        <a href="mailto:jkatariy@purdue.edu" className="hover:text-[var(--text-primary)] transition-colors">jkatariy@purdue.edu</a>
        <span className="hidden sm:inline">·</span>
        <a href="tel:7655438168" className="hover:text-[var(--text-primary)] transition-colors">(765) 543-8168</a>
        <span className="hidden sm:inline">·</span>
        <a href="https://linkedin.com/in/jkatariya" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">linkedin</a>
      </div>
    </div>
  );
}
