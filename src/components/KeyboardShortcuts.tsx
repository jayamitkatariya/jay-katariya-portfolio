import { motion, AnimatePresence } from 'motion/react';

const SHORTCUTS = [
  { key: '1', description: 'go to home' },
  { key: '2', description: 'go to portfolio' },
  { key: '3', description: 'go to memories' },
  { key: '4', description: 'go to resume' },
  { key: '/', description: 'open ai chat' },
  { key: '?', description: 'show shortcuts' },
  { key: 'esc', description: 'close overlays' },
];

export default function KeyboardShortcuts({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[90vw] max-w-sm"
          >
            <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl shadow-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">keyboard shortcuts</h3>
                <button
                  onClick={onClose}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-full hover:bg-[var(--bg-secondary)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {SHORTCUTS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)] font-light">{s.description}</span>
                    <kbd className="font-mono text-[11px] tracking-wider bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] px-2.5 py-1 rounded-lg min-w-[2rem] text-center">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <p className="mt-6 font-mono text-[10px] text-[var(--text-muted)] tracking-wider text-center">
                press ? to toggle this menu
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
