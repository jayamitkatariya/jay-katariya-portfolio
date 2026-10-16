import { useCallback, useLayoutEffect, useState } from 'react';

const STORAGE_KEY = 'agent-mode';

function save(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {}
}

// ?agent=1 / ?agent=0 wins, so the mode can be linked; otherwise the last choice is remembered
function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location.search).get('agent');
  if (param === '1' || param === '0') {
    save(param === '1');
    return param === '1';
  }
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useAgentMode() {
  const [isAgent, setIsAgent] = useState(readInitial);

  // lets css drop the custom cursor and grain; the two views share no scroll position
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute('data-agent', isAgent);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [isAgent]);

  const setAgent = useCallback((on: boolean) => {
    save(on);
    setIsAgent(on);
  }, []);

  return { isAgent, setAgent };
}
