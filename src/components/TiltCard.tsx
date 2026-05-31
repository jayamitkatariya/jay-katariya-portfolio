import { useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltAmount?: number;
  glowRGB?: string;
  glareOpacity?: number;
}

export default function TiltCard({
  children,
  className = '',
  tiltAmount = 8,
  glowRGB,
  glareOpacity = 0.08,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const rotateX = (y - 0.5) * -tiltAmount;
    const rotateY = (x - 0.5) * tiltAmount;

    setTransform({ rotateX, rotateY });
    setGlare({ x: x * 100, y: y * 100, opacity: glareOpacity });
  }, [isTouch, tiltAmount, glareOpacity]);

  const handleMouseLeave = useCallback(() => {
    setTransform({ rotateX: 0, rotateY: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  if (isTouch) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={`relative ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="relative h-full transition-transform duration-150 ease-out"
        style={{
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}

        {/* Glare overlay */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-150"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      </div>

      {/* Glow border */}
      {glowRGB && isHovered && (
        <div
          className="absolute -inset-px rounded-[inherit] pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${glare.x}% ${glare.y}%, rgba(${glowRGB}, 0.3), transparent 60%)`,
          }}
        />
      )}
    </div>
  );
}
