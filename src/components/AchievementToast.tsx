import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Achievement } from '../hooks/useAchievements';
import { PixelIcon } from './SectionHeading';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  // the live region stays mounted so screen readers announce each unlock
  return (
    <div role="status" aria-live="polite">
    <AnimatePresence>
      {achievement && (
        <motion.div
          // keyed: a queued unlock animates in on its own instead of swapping text in place
          key={achievement.id}
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-x-4 mx-auto w-fit max-w-sm bottom-[calc(8.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[70] pointer-events-auto cursor-pointer"
          onClick={onDismiss}
        >
          <div className="flex items-center gap-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl px-4 py-3 shadow-2xl border border-[var(--border-primary)]">
            <PixelIcon name={achievement.icon} size={18} instant />
            <div>
              <div className="font-mono text-[10px] tracking-widest uppercase opacity-60 mb-0.5">
                achievement unlocked
              </div>
              <div className="font-medium text-sm">{achievement.name}</div>
              <div className="text-xs opacity-60 font-light">{achievement.description}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
