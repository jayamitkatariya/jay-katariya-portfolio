import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Achievement } from '../hooks/useAchievements';

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

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 sm:bottom-24 z-[70] pointer-events-auto"
        >
          <div className="flex items-center gap-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl px-4 py-3 shadow-2xl border border-[var(--border-primary)]">
            <span className="text-lg">{achievement.icon}</span>
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
  );
}
