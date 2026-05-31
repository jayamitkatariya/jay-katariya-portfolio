import { useEffect, useRef, useState } from 'react';

export function useParallax(factor: number = 0.1) {
  const [offset, setOffset] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setOffset(window.scrollY);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    transform: `translateY(${offset * factor}px)`,
    willChange: 'transform' as const,
  };
}
