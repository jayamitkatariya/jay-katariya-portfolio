import { AnimatePresence, motion } from 'motion/react';
import { prefersReducedMotion } from '../lib/dither';

// Brief flashing overlay for the dark-mode-spam easter egg.
// The live region stays mounted, so the message is actually announced when it appears.
export default function DiscoOverlay({ active }: { active: boolean }) {
  return (
    <div aria-live="polite" className="contents">
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[85] pointer-events-none grid place-items-center"
          >
            {!prefersReducedMotion() && <div className="absolute inset-0 disco-flicker" />}
            <p className="relative font-mono text-sm sm:text-base tracking-widest bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 rounded-lg shadow-2xl">
              ok ok i get it
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
