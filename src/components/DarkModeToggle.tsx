import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { PixelIcon } from './SectionHeading';
import { prefersReducedMotion } from '../lib/dither';

interface DarkModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function DarkModeToggle({ isDark, onToggle }: DarkModeToggleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    const supportsViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document;

    // a hidden tab can't run the transition; it would just reject
    if (!supportsViewTransition || document.hidden || prefersReducedMotion()) {
      onToggle();
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 0;

    document.documentElement.style.setProperty('--toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--toggle-y', `${y}px`);

    // colour transitions off while the wipe runs, so it uncovers the finished theme
    const root = document.documentElement;
    root.classList.add('theme-switching');
    // flushSync so the new theme is committed before the "after" snapshot is taken
    const transition = (document as any).startViewTransition(() => {
      flushSync(onToggle);
    });
    // clicking again mid-animation skips the running transition, which rejects `ready`;
    // the theme still changed, so there's nothing to handle
    transition.ready?.catch(() => {});
    const done = () => root.classList.remove('theme-switching');
    (transition.finished ?? Promise.resolve()).then(done, done);
  };

  // the nav has no spare width at 320px, so the touch hit area grows invisibly instead
  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className="relative grid h-9 w-9 place-items-center rounded-full pointer-coarse:h-11 pointer-coarse:w-11 hover:bg-[var(--bg-secondary)] transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.96] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-orb" data-dark={isDark} aria-hidden="true">
        <span className="theme-orb__sun">
          <PixelIcon name="sun" size={14} instant />
        </span>
        <span className="theme-orb__moon">
          <PixelIcon name="moon" size={14} instant />
        </span>
      </span>
    </button>
  );
}
