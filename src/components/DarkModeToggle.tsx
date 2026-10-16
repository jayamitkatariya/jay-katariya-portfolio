import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';
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

    // flushSync so the new theme is committed before the "after" snapshot is taken
    const transition = (document as any).startViewTransition(() => {
      flushSync(onToggle);
    });
    // clicking again mid-animation skips the running transition, which rejects `ready`;
    // the theme still changed, so there's nothing to handle
    transition.ready?.catch(() => {});
  };

  // the nav has no spare width at 320px, so the touch hit area grows invisibly instead
  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className="relative p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)] pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
    </button>
  );
}
