import { useRef } from 'react';
import { Sun, Moon } from 'lucide-react';

interface DarkModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export default function DarkModeToggle({ isDark, onToggle }: DarkModeToggleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    const supportsViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document;

    if (!supportsViewTransition) {
      onToggle();
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 0;

    document.documentElement.style.setProperty('--toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--toggle-y', `${y}px`);

    (document as any).startViewTransition(() => {
      onToggle();
    });
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
    </button>
  );
}
