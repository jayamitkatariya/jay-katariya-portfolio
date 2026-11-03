import { useLayoutEffect, useState } from 'react';

// storage can throw (blocked cookies, some in-app webviews); never let that blank the page
function readTheme(): string | null {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
}

export function useDarkMode() {
  // light by default, whatever the OS says; dark only once the visitor has chosen it
  const [isDark, setIsDark] = useState(() => typeof window !== 'undefined' && readTheme() === 'dark');

  // layout effect so the class is applied before children read theme colors in their effects
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    // 'only light' opts out of browsers that force dark mode onto light pages (see index.html)
    root.style.colorScheme = isDark ? 'dark' : 'only light';
    // keep the browser chrome in sync with the in-app toggle, not just the OS setting
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      m.setAttribute('content', isDark ? '#111112' : '#faf9f6');
    });
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', isDark ? 'dark' : 'only light');
  }, [isDark]);

  // only an explicit toggle is a saved preference
  const toggle = () =>
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });

  return { isDark, toggle };
}
