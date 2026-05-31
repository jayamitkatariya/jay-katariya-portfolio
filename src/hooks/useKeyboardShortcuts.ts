import { useEffect, useCallback } from 'react';

interface ShortcutActions {
  setPage: (page: 'home' | 'portfolio' | 'memories' | 'resume') => void;
  openChat: () => void;
  toggleHelp: () => void;
  closeOverlays: () => void;
  onShortcutUsed?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  const handler = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

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
      case '/':
        e.preventDefault();
        actions.openChat();
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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
