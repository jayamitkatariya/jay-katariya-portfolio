import { useEffect, useCallback } from 'react';

interface ShortcutActions {
  setPage: (page: 'home' | 'portfolio' | 'memories' | 'resume') => void;
  toggleHelp: () => void;
  closeOverlays: () => void;
  onShortcutUsed?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions, enabled = true) {
  const handler = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
    // leave browser/OS shortcuts (cmd+1, ctrl+1 tab switching…) alone
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    if (e.repeat && e.key !== 'Escape') return;
    // an open dialog owns the keyboard: no page switches from behind it, and `?` only
    // toggles the help dialog itself rather than stacking on top of another one
    const modal = document.querySelector('[aria-modal="true"]');
    if (modal && e.key !== 'Escape' && !(e.key === '?' && modal.hasAttribute('data-shortcuts-help'))) return;

    switch (e.key) {
      case '1':
        actions.setPage('home');
        actions.onShortcutUsed?.();
        break;
      case '2':
        actions.setPage('portfolio');
        actions.onShortcutUsed?.();
        break;
      case '3':
        actions.setPage('memories');
        actions.onShortcutUsed?.();
        break;
      case '4':
        actions.setPage('resume');
        actions.onShortcutUsed?.();
        break;
      case '?':
        actions.toggleHelp();
        actions.onShortcutUsed?.();
        break;
      case 'Escape':
        actions.closeOverlays();
        break;
    }
  }, [actions]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler, enabled]);
}
