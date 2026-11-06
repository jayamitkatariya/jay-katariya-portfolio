import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { PixelIcon } from './SectionHeading';
import { toggleSoundMuted, useSoundMuted } from '../lib/sound/store';

export const PAGES = [
  ['home', '/'],
  ['portfolio', '/portfolio'],
  ['writing', '/writing'],
  ['memories', '/memories'],
  ['resume', '/resume'],
] as const;

/**
 * The phone menu: a sheet that drops from under the nav. Owns its own exit
 * animation, closes on Escape / outside tap / navigation, and returns focus to
 * the toggle so the keyboard doesn't get stranded.
 */
export default function MobileMenu({
  isOpen,
  onClose,
  currentPage,
  returnFocusTo,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const muted = useSoundMuted();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // keyed on isOpen alone: re-running on every parent render would pull focus back
  // to the first link while someone is tabbing through the sheet
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    // move focus into the sheet without scrolling the page behind it
    const first = panelRef.current?.querySelector<HTMLElement>('a');
    first?.focus({ preventScroll: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // only hand focus back if the sheet was actually open — this effect also runs on
  // mount, and focusing then would put a focus ring on the toggle before anyone taps it
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    returnFocusTo.current?.focus({ preventScroll: true });
  }, [isOpen, returnFocusTo]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sheet"
          id="mobile-menu"
          ref={panelRef}
          // clip-path reveals the sheet top-down like the old height tween, without re-laying it out each frame
          initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
          animate={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
          exit={{ clipPath: 'inset(0 0 100% 0)', opacity: 0, transition: { duration: 0.17, ease: [0.4, 0, 0.6, 1] } }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          className="absolute left-0 top-full max-h-[calc(100svh-3.5rem)] w-full overflow-y-auto overscroll-contain border-b border-[var(--border-primary)] bg-[var(--bg-primary)] sm:hidden"
        >
            <nav aria-label="mobile" className="flex flex-col">
              {PAGES.map(([label, to], i) => {
                const active = currentPage === label;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-14 items-center justify-between px-[calc(var(--nav-px)+env(safe-area-inset-left))] py-4 font-mono text-[15px] tracking-widest transition-colors ${
                      i === 0 ? '' : 'border-t border-[var(--border-primary)]'
                    } ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] active:text-[var(--text-primary)]'}`}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {label}
                    </span>
                    {active && <span className="h-1.5 w-1.5 bg-[var(--accent)]" aria-hidden="true" />}
                  </Link>
                );
              })}
            </nav>
            {/* the nav bar has no room for a sound switch on phones; it lives here */}
            <button
              type="button"
              onClick={toggleSoundMuted}
              aria-pressed={!muted}
              data-sound={muted ? 'none' : 'toggleOff'}
              className="flex min-h-14 w-full items-center justify-between border-t border-[var(--border-primary)] px-[calc(var(--nav-px)+env(safe-area-inset-left))] py-4 font-mono text-[11px] tracking-widest text-[var(--text-tertiary)] transition-colors active:text-[var(--text-primary)]"
            >
              <span className="flex items-center gap-3">
                <PixelIcon name={muted ? 'mute' : 'sound'} size={12} instant />
                sound
              </span>
              <span className={muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}>{muted ? 'off' : 'on'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
