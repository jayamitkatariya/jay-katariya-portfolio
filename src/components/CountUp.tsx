import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/dither';

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
  grouping?: boolean;
}

export default function CountUp({
  end,
  duration = 1500,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
  grouping = false,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setDisplayValue(end);
      return;
    }

    let frame = 0;
    const start = () => {
      // anchored to the first frame's timestamp: rAF's `now` can predate a performance.now()
      // taken here, which made progress negative and briefly rendered "-0%" / "$-5k"
      let startTime = -1;
      const tick = (now: number) => {
        if (startTime < 0) startTime = now;
        const progress = Math.min((now - startTime) / duration, 1);
        // Ease out quart
        setDisplayValue(progress < 1 ? (1 - Math.pow(1 - progress, 4)) * end : end);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        // above the viewport counts too: a fast scroll or jump can skip right past it
        if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
          observer.disconnect();
          if (entry.isIntersecting) start();
          else setDisplayValue(end);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [end, duration]);

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
