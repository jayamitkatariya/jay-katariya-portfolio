import { useState, useEffect } from 'react';

const SECTION_IDS = ['about', 'work', 'previously', 'skills', 'contact'];

export function useScrollSection(enabled: boolean): string | null {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setActiveSection(null);
      return;
    }

    const observers: IntersectionObserver[] = [];

    const handleIntersect = (id: string) => (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(id);
        }
      });
    };

    SECTION_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(handleIntersect(id), {
        threshold: 0.3,
        rootMargin: '-10% 0px -10% 0px',
      });

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [enabled]);

  return activeSection;
}
