import React, { useRef, useState, useCallback } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}

export default function MagneticButton({ children, className = '', strength = 0.3, radius = 100 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      const factor = (1 - dist / radius) * strength;
      setTransform({ x: dx * factor, y: dy * factor });
    } else {
      setTransform({ x: 0, y: 0 });
    }
  }, [isTouch, radius, strength]);

  const handleMouseLeave = useCallback(() => {
    setTransform({ x: 0, y: 0 });
  }, []);

  if (isTouch) return <div className={className}>{children}</div>;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ display: 'inline-block' }}
    >
      <div
        ref={ref}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px)`,
          transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
