import { useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Project } from '../../data/projects';

interface GlowCardProps {
  project: Project;
  glowRGB: string;
  accentClass: string;
  index: number;
}

export default function GlowCard({ project, glowRGB, accentClass }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const isTouch = 'ontouchstart' in window;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isTouch || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // 3D tilt calculation
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rotateX: (y - 0.5) * -8,
      rotateY: (x - 0.5) * 8,
    });
  }, [isTouch]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  const Wrapper = project.url ? 'a' : 'div';
  const wrapperProps = project.url
    ? { href: project.url, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative group h-full"
      style={{ perspective: '1000px' }}
    >
      {/* Glow border on hover */}
      {!isTouch && (
        <div
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${glowRGB}, 0.35), transparent 60%)`,
          }}
        />
      )}

      {/* Card */}
      <Wrapper
        {...wrapperProps}
        className="relative z-10 flex flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] backdrop-blur-sm p-5 sm:p-6 h-full transition-all duration-300 group-hover:border-transparent group-hover:shadow-lg cursor-pointer"
        style={{
          boxShadow: isHovered
            ? `0 8px 32px rgba(${glowRGB}, 0.15), 0 2px 8px rgba(0,0,0,0.04)`
            : '0 1px 3px rgba(0,0,0,0.04)',
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
        }}
      >
        {/* Glare overlay */}
        {!isTouch && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-150"
            style={{
              background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,${isHovered ? 0.06 : 0}), transparent 60%)`,
              opacity: isHovered ? 1 : 0,
            }}
          />
        )}

        {/* Header: category + link icon */}
        <div className="flex items-center justify-between mb-4">
          <span className={`font-mono text-[10px] tracking-widest uppercase ${accentClass}`}>
            {project.type}
          </span>
          {project.url && (
            <ExternalLink size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-tertiary)] transition-colors" />
          )}
        </div>

        {/* Name */}
        <h3 className="font-mono text-base sm:text-lg font-medium text-[var(--text-primary)] mb-2 group-hover:text-[var(--text-primary)] transition-colors">
          {project.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed mb-4 flex-1">
          {project.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </Wrapper>
    </div>
  );
}
