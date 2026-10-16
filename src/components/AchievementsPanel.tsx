import { useEffect } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { motion, AnimatePresence } from 'motion/react';
import { ACHIEVEMENTS, type AchievementId } from '../hooks/useAchievements';

interface AchievementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unlocked: Set<AchievementId>;
}

export default function AchievementsPanel({ isOpen, onClose, unlocked }: AchievementsPanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useBodyScrollLock(isOpen);
  const closeRef = useDialogFocus<HTMLButtonElement>(isOpen);

  const earned = ACHIEVEMENTS.filter(a => unlocked.has(a.id)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[3px] z-[80]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="achievements"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[90vw] max-w-sm"
          >
            <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[80dvh] overflow-y-auto overscroll-contain">
              <div className="flex items-center justify-between mb-1 -mt-2">
                <h3 className="font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">achievements</h3>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="close"
                  className="-mr-2.5 w-10 h-10 grid place-items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-secondary)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="h-1 w-full bg-[var(--bg-tertiary)] rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-[var(--text-primary)] transition-[width] duration-500"
                  style={{ width: `${(earned / ACHIEVEMENTS.length) * 100}%` }}
                />
              </div>
              <ul className="flex flex-col gap-4">
                {ACHIEVEMENTS.map(a => {
                  const has = unlocked.has(a.id);
                  return (
                    <li key={a.id} className="flex items-center gap-3">
                      <span className={`w-8 h-8 shrink-0 grid place-items-center rounded-lg border border-[var(--border-primary)] text-base ${has ? '' : 'grayscale opacity-40'}`}>
                        {has ? a.icon : '?'}
                      </span>
                      <div className="min-w-0">
                        <div className={`font-mono text-xs tracking-wider ${has ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                          {has ? a.name : '???'}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] font-light">
                          {has ? a.description : a.hint}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-6 font-mono text-[10px] text-[var(--text-muted)] tracking-wider text-center">
                {earned === ACHIEVEMENTS.length ? 'all found. you are thorough.' : `${earned}/${ACHIEVEMENTS.length} found`}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
